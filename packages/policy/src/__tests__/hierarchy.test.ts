import { describe, it, expect, beforeEach } from 'vitest';
import { PolicyHierarchy } from '../hierarchy.js';

describe('PolicyHierarchy', () => {
    let hierarchy: PolicyHierarchy;

    beforeEach(() => {
        hierarchy = new PolicyHierarchy();
    });

    describe('Policy Merging - PRD Section 7.3.9', () => {
        it('should use intersection for FS allow lists', () => {
            const orgPolicy = {
                scope: {
                    fs: { allow: ['./src', './tests', './lib'], deny: [] }
                }
            };

            const projectPolicy = {
                scope: {
                    fs: { allow: ['./src', './docs'], deny: [] }
                }
            };

            const merged = hierarchy.merge({ org: orgPolicy, project: projectPolicy });

            // Intersection: only './src' is in both
            expect(merged.scope!.fs!.allow).toContain('./src');
            expect(merged.scope!.fs!.allow).not.toContain('./tests');
            expect(merged.scope!.fs!.allow).not.toContain('./docs');
        });

        it('should use union for FS deny lists', () => {
            const orgPolicy = {
                scope: {
                    fs: { allow: [], deny: ['../secrets'] }
                }
            };

            const projectPolicy = {
                scope: {
                    fs: { allow: [], deny: ['/etc'] }
                }
            };

            const merged = hierarchy.merge({ org: orgPolicy, project: projectPolicy });

            // Union: both denies apply
            expect(merged.scope!.fs!.deny).toContain('../secrets');
            expect(merged.scope!.fs!.deny).toContain('/etc');
        });

        it('should enforce deny overrides allow', () => {
            const orgPolicy = {
                scope: {
                    fs: { allow: ['./'], deny: ['./secrets'] }
                }
            };

            const merged = hierarchy.merge({ org: orgPolicy });

            expect(merged.scope!.fs!.deny).toContain('./secrets');
        });

        it('should use intersection for network outbound', () => {
            const orgPolicy = {
                scope: {
                    network: { outbound: ['api.github.com', 'api.openai.com'], blocked: [] }
                }
            };

            const projectPolicy = {
                scope: {
                    network: { outbound: ['api.openai.com', 'registry.npmjs.org'], blocked: [] }
                }
            };

            const merged = hierarchy.merge({ org: orgPolicy, project: projectPolicy });

            // Only api.openai.com is in both
            expect(merged.scope!.network!.outbound).toContain('api.openai.com');
            expect(merged.scope!.network!.outbound!.length).toBe(1);
        });

        it('should use union for network blocked', () => {
            const orgPolicy = {
                scope: {
                    network: { outbound: [], blocked: ['*tracking*'] }
                }
            };

            const projectPolicy = {
                scope: {
                    network: { outbound: [], blocked: ['169.254.169.254'] }
                }
            };

            const merged = hierarchy.merge({ org: orgPolicy, project: projectPolicy });

            expect(merged.scope!.network!.blocked).toContain('*tracking*');
            expect(merged.scope!.network!.blocked).toContain('169.254.169.254');
        });

        it('should choose minimum for numeric limits', () => {
            const orgPolicy = {
                limits: { tokens_per_session: 150000 }
            };

            const projectPolicy = {
                limits: { tokens_per_session: 200000 }
            };

            const merged = hierarchy.merge({ org: orgPolicy, project: projectPolicy });

            // Most restrictive (minimum)
            expect(merged.limits!.tokens_per_session).toBe(150000);
        });

        it('should use union for approval requirements', () => {
            const orgPolicy = {
                approval: { require_for: ['writes'] }
            };

            const projectPolicy = {
                approval: { require_for: ['exec.confirm'] }
            };

            const merged = hierarchy.merge({ org: orgPolicy, project: projectPolicy });

            expect(merged.approval!.require_for).toContain('writes');
            expect(merged.approval!.require_for).toContain('exec.confirm');
        });
    });

    describe('Override Validation - PRD Section 7.3.10', () => {
        it('should reject override that widens numeric limits in restrictive mode', () => {
            hierarchy.setEffectivePolicy({
                limits: { tokens_per_session: 100000 }
            });

            const override = {
                limits: { tokens_per_session: 200000 }
            };

            const result = hierarchy.validateOverride(override, 'restrictive');

            expect(result.valid).toBe(false);
            expect(result.violations.some(v => v.includes('tokens_per_session'))).toBe(true);
        });

        it('should accept override that narrows numeric limits', () => {
            hierarchy.setEffectivePolicy({
                limits: { tokens_per_session: 200000 }
            });

            const override = {
                limits: { tokens_per_session: 50000 }
            };

            const result = hierarchy.validateOverride(override, 'restrictive');

            expect(result.valid).toBe(true);
            expect(result.violations).toHaveLength(0);
        });

        it('should allow admin to widen limits in admin mode', () => {
            hierarchy.setEffectivePolicy({
                limits: { tokens_per_session: 100000 }
            });

            const override = {
                limits: { tokens_per_session: 300000 }
            };

            const result = hierarchy.validateOverride(override, 'admin');

            expect(result.valid).toBe(true);
        });

        it('should reject override adding network hosts in restrictive mode', () => {
            hierarchy.setEffectivePolicy({
                scope: {
                    network: { outbound: ['api.openai.com'], blocked: [] }
                }
            });

            const override = {
                scope: {
                    network: { outbound: ['api.openai.com', 'example.com'], blocked: [] }
                }
            };

            const result = hierarchy.validateOverride(override, 'restrictive');

            expect(result.valid).toBe(false);
            expect(result.violations.some(v => v.includes('example.com'))).toBe(true);
        });

        it('should allow adding deny/block entries in restrictive mode', () => {
            hierarchy.setEffectivePolicy({
                scope: {
                    fs: { allow: [], deny: [] }
                }
            });

            const override = {
                scope: {
                    fs: { allow: [], deny: ['/tmp'] }
                }
            };

            const result = hierarchy.validateOverride(override, 'restrictive');

            expect(result.valid).toBe(true);
        });
    });

    describe('Hash Generation', () => {
        it('should generate consistent hash for merged policy', () => {
            const policy = {
                scope: { fs: { allow: ['./'], deny: [] } },
                limits: { tokens_per_session: 100000 }
            };

            const merged1 = hierarchy.merge({ org: policy });
            const merged2 = hierarchy.merge({ org: policy });

            expect(merged1.hash).toBe(merged2.hash);
        });

        it('should generate different hashes for different policies', () => {
            const policy1 = {
                limits: { tokens_per_session: 100000 }
            };

            const policy2 = {
                limits: { tokens_per_session: 200000 }
            };

            const merged1 = hierarchy.merge({ org: policy1 });
            const merged2 = hierarchy.merge({ org: policy2 });

            expect(merged1.hash).not.toBe(merged2.hash);
        });
    });
});
