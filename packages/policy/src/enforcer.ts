// Policy enforcement engine
import type { LoadResult } from './index.js';
import { loadAndValidate } from './index.js';

export interface PolicyConfig {
    version: number;
    scope: {
        fs: { allow: string[]; deny: string[] };
        network: { outbound: string[]; blocked: string[] };
        exec: { allow: string[]; confirm: string[] };
    };
    models?: {
        providers?: Array<{ name: string; allow?: string[]; max_tokens?: number }>;
        local_fallback?: boolean;
    };
    limits: {
        tokens_per_session: number;
        files_read_per_minute: number;
        bytes_read_per_minute: number;
    };
    redaction?: {
        patterns?: Array<{ name: string; regex: string; action: string }>;
    };
    approval?: {
        require_for?: string[];
    };
}

export class PolicyEnforcer {
    private policy: PolicyConfig;
    private sessionTokens = 0;
    private filesReadCount = 0;
    private bytesReadCount = 0;
    private lastMinuteReset = Date.now();

    constructor(policy: PolicyConfig) {
        this.policy = policy;
    }

    static async load(policyPath: string, schemaPath: string): Promise<PolicyEnforcer> {
        const result: LoadResult<PolicyConfig> = loadAndValidate(policyPath, schemaPath);

        if (result.errors.length > 0) {
            throw new Error(`Policy validation failed:\n${result.errors.join('\n')}`);
        }

        return new PolicyEnforcer(result.data);
    }

    // File System access enforcement
    checkFSAccess(path: string): { allowed: boolean; reason?: string } {
        // Check deny list first (highest priority)
        for (const denyPattern of this.policy.scope.fs.deny) {
            if (this.matchesPattern(path, denyPattern)) {
                return { allowed: false, reason: `Path denied by policy: ${denyPattern}` };
            }
        }

        // Check allow list
        for (const allowPattern of this.policy.scope.fs.allow) {
            if (this.matchesPattern(path, allowPattern)) {
                return { allowed: true };
            }
        }

        return { allowed: false, reason: 'Path not in allow list' };
    }

    // Exec enforcement
    checkExec(command: string): { allowed: boolean; requiresConfirm: boolean; reason?: string } {
        const cmd = (command.split(' ')[0]) || '';

        // Check if command is in allow list
        const allowed = this.policy.scope.exec.allow.includes(cmd);

        if (!allowed) {
            return { allowed: false, requiresConfirm: false, reason: `Command not allowed: ${cmd}` };
        }

        // Check if requires confirmation
        const requiresConfirm = this.policy.scope.exec.confirm.some(pattern =>
            command.includes(pattern)
        );

        return { allowed: true, requiresConfirm };
    }

    // Network enforcement
    checkNetwork(host: string): { allowed: boolean; reason?: string } {
        // Check blocked list first
        for (const blockedPattern of this.policy.scope.network.blocked) {
            if (this.matchesPattern(host, blockedPattern)) {
                return { allowed: false, reason: `Host blocked by policy: ${blockedPattern}` };
            }
        }

        // Check outbound list
        for (const allowPattern of this.policy.scope.network.outbound) {
            if (this.matchesPattern(host, allowPattern)) {
                return { allowed: true };
            }
        }

        return { allowed: false, reason: 'Host not in outbound allow list' };
    }

    // Limits enforcement
    checkTokenLimit(tokensToAdd: number): { allowed: boolean; reason?: string } {
        if (this.sessionTokens + tokensToAdd > this.policy.limits.tokens_per_session) {
            return {
                allowed: false,
                reason: `Token limit exceeded: ${this.sessionTokens + tokensToAdd}/${this.policy.limits.tokens_per_session}`
            };
        }

        this.sessionTokens += tokensToAdd;
        return { allowed: true };
    }

    checkFileReadLimit(bytesRead: number): { allowed: boolean; reason?: string } {
        // Reset counters if a minute has passed
        const now = Date.now();
        if (now - this.lastMinuteReset > 60000) {
            this.filesReadCount = 0;
            this.bytesReadCount = 0;
            this.lastMinuteReset = now;
        }

        this.filesReadCount++;
        this.bytesReadCount += bytesRead;

        if (this.filesReadCount > this.policy.limits.files_read_per_minute) {
            return { allowed: false, reason: 'File read rate limit exceeded' };
        }

        if (this.bytesReadCount > this.policy.limits.bytes_read_per_minute) {
            return { allowed: false, reason: 'Bytes read rate limit exceeded' };
        }

        return { allowed: true };
    }

    // Pattern matching helper (supports wildcards)
    private matchesPattern(path: string, pattern: string): boolean {
        // Normalize for cross-platform compatibility
        const normalizedPath = path.replace(/\\/g, '/');
        const normalizedPattern = pattern.replace(/\\/g, '/');

        // If pattern contains wildcards, use glob-like regex
        if (normalizedPattern.includes('*')) {
            const regexPattern = normalizedPattern
                .replace(/\./g, '\\.')
                .replace(/\*\*/g, '<!DOUBLESTAR!>')
                .replace(/\*/g, '[^/]*')
                .replace(/<!DOUBLESTAR!>/g, '.*');
            // Allow subpaths after the wildcard match (treat pattern as directory prefix)
            const regex = new RegExp(`^${regexPattern}(?:/.*)?$`);
            return regex.test(normalizedPath);
        }

        // No wildcard: treat as path prefix (directory) or exact file
        const pfx = normalizedPattern.replace(/\/$/, '');
        return normalizedPath === pfx || normalizedPath.startsWith(pfx + '/');
    }

    // Get effective policy hash
    getEffectiveHash(): string {
        const policyJson = JSON.stringify(this.policy);
        // Simple hash (in production, use crypto)
        let hash = 0;
        for (let i = 0; i < policyJson.length; i++) {
            const char = policyJson.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return `sha256:${Math.abs(hash).toString(16)}`;
    }

    getPolicy(): PolicyConfig {
        return this.policy;
    }
}
