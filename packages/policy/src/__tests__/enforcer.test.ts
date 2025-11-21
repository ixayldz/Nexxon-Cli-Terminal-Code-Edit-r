import { describe, it, expect, beforeEach } from 'vitest';
import { PolicyEnforcer, type PolicyConfig } from '../enforcer.js';
import path from 'node:path';

describe('PolicyEnforcer', () => {
    let enforcer: PolicyEnforcer;

    const testPolicy: PolicyConfig = {
        version: 1,
        scope: {
            fs: {
                allow: ['./src', './tests', './packages'],
                deny: ['../secrets', '/etc']
            },
            network: {
                outbound: ['api.openai.com', 'registry.npmjs.org'],
                blocked: ['*tracking*', '169.254.169.254']
            },
            exec: {
                allow: ['git', 'npm', 'node', 'pnpm'],
                confirm: ['npm install', 'rm']
            }
        },
        limits: {
            tokens_per_session: 200000,
            files_read_per_minute: 500,
            bytes_read_per_minute: 10485760
        }
    };

    beforeEach(() => {
        enforcer = new PolicyEnforcer(testPolicy);
    });

    describe('File System Enforcement', () => {
        it('should allow paths in allow list', () => {
            const result = enforcer.checkFSAccess('./src/main.ts');
            expect(result.allowed).toBe(true);
        });

        it('should deny paths not in allow list', () => {
            const result = enforcer.checkFSAccess('/var/log/system.log');
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('not in allow list');
        });

        it('should deny paths in deny list even if in allow list', () => {
            const result = enforcer.checkFSAccess('../secrets/api-key.txt');
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('denied by policy');
        });

        it('should handle wildcard patterns', () => {
            const testPolicyWithWildcard: PolicyConfig = {
                ...testPolicy,
                scope: {
                    ...testPolicy.scope,
                    fs: {
                        allow: ['./packages/*'],
                        deny: ['./packages/*/secrets']
                    }
                }
            };
            const wildcardEnforcer = new PolicyEnforcer(testPolicyWithWildcard);

            const allowed = wildcardEnforcer.checkFSAccess('./packages/cli/src/main.ts');
            expect(allowed.allowed).toBe(true);

            const denied = wildcardEnforcer.checkFSAccess('./packages/runtime/secrets/key.txt');
            expect(denied.allowed).toBe(false);
        });
    });

    describe('Exec Enforcement', () => {
        it('should allow commands in allow list', () => {
            const result = enforcer.checkExec('npm test');
            expect(result.allowed).toBe(true);
        });

        it('should deny commands not in allow list', () => {
            const result = enforcer.checkExec('curl https://malicious.com');
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('not allowed');
        });

        it('should require confirmation for specified commands', () => {
            const result = enforcer.checkExec('npm install express');
            expect(result.allowed).toBe(true);
            expect(result.requiresConfirm).toBe(true);
        });

        it('should not require confirmation for safe commands', () => {
            const result = enforcer.checkExec('git status');
            expect(result.allowed).toBe(true);
            expect(result.requiresConfirm).toBe(false);
        });
    });

    describe('Network Enforcement', () => {
        it('should allow hosts in outbound list', () => {
            const result = enforcer.checkNetwork('api.openai.com');
            expect(result.allowed).toBe(true);
        });

        it('should deny hosts not in outbound list', () => {
            const result = enforcer.checkNetwork('malicious.com');
            expect(result.allowed).toBe(false);
        });

        it('should deny blocked hosts', () => {
            const result = enforcer.checkNetwork('analytics-tracking.com');
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('blocked');
        });

        it('should block metadata endpoints', () => {
            const result = enforcer.checkNetwork('169.254.169.254');
            expect(result.allowed).toBe(false);
        });
    });

    describe('Token Limits', () => {
        it('should allow tokens within limit', () => {
            const result = enforcer.checkTokenLimit(10000);
            expect(result.allowed).toBe(true);
        });

        it('should deny tokens exceeding limit', () => {
            enforcer.checkTokenLimit(150000);
            const result = enforcer.checkTokenLimit(100000);
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('limit exceeded');
        });

        it('should accumulate token usage', () => {
            enforcer.checkTokenLimit(50000);
            enforcer.checkTokenLimit(50000);
            const result = enforcer.checkTokenLimit(150000);
            expect(result.allowed).toBe(false);
        });
    });

    describe('File Read Limits', () => {
        it('should allow reads within rate limits', () => {
            const result = enforcer.checkFileReadLimit(1000);
            expect(result.allowed).toBe(true);
        });

        it('should deny when file count exceeds limit', () => {
            // Read 501 files (1 byte each)
            for (let i = 0; i < 501; i++) {
                enforcer.checkFileReadLimit(1);
            }
            const result = enforcer.checkFileReadLimit(1);
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('File read rate limit');
        });

        it('should deny when bytes exceed limit', () => {
            const result = enforcer.checkFileReadLimit(11000000); // >10MB
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Bytes read rate limit');
        });
    });

    describe('Policy Hash', () => {
        it('should generate consistent hash for same policy', () => {
            const hash1 = enforcer.getEffectiveHash();
            const hash2 = enforcer.getEffectiveHash();
            expect(hash1).toBe(hash2);
        });

        it('should generate different hash for different policies', () => {
            const enforcer2 = new PolicyEnforcer({
                ...testPolicy,
                limits: { ...testPolicy.limits, tokens_per_session: 100000 }
            });

            const hash1 = enforcer.getEffectiveHash();
            const hash2 = enforcer2.getEffectiveHash();
            expect(hash1).not.toBe(hash2);
        });

        it('should have sha256 prefix', () => {
            const hash = enforcer.getEffectiveHash();
            expect(hash).toMatch(/^sha256:[a-f0-9]+$/);
        });
    });
});
