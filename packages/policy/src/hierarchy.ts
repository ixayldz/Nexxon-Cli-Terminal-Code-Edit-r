// Policy hierarchy and merging implementation per PRD Section 7.3.9
import crypto from 'node:crypto';

interface PolicyScope {
    fs?: { allow?: string[]; deny?: string[] };
    network?: { outbound?: string[]; blocked?: string[] };
    exec?: { allow?: string[]; confirm?: string[] };
}

interface PolicyLimits {
    tokens_per_session?: number;
    files_read_per_minute?: number;
    bytes_read_per_minute?: number;
}

interface PolicyApproval {
    require_for?: string[];
}

interface PartialPolicy {
    scope?: PolicyScope;
    limits?: PolicyLimits;
    approval?: PolicyApproval;
    [key: string]: any;
}

export interface MergedPolicy extends PartialPolicy {
    hash: string;
}

export class PolicyHierarchy {
    private effectivePolicy: PartialPolicy | null = null;

    /**
     * Merge multiple policies with precedence: Org -> Project -> Session
     * Per PRD 7.3.9: Most restrictive wins for security-sensitive settings
     */
    merge(policies: { org?: PartialPolicy; project?: PartialPolicy; session?: PartialPolicy }): MergedPolicy {
        const { org = {}, project = {}, session = {} } = policies;
        const merged: PartialPolicy = {};

        // Merge scope
        if (org.scope || project.scope || session.scope) {
            merged.scope = {};

            // FS: allow = intersection, deny = union
            const fsAllowLists = [org.scope?.fs?.allow, project.scope?.fs?.allow, session.scope?.fs?.allow].filter((arr): arr is string[] => Array.isArray(arr) && arr.length > 0);
            const fsDeny = [
                ...(org.scope?.fs?.deny || []),
                ...(project.scope?.fs?.deny || []),
                ...(session.scope?.fs?.deny || [])
            ];

            if (fsAllowLists.length > 0 || fsDeny.length > 0) {
                merged.scope.fs = {
                    allow: fsAllowLists.length > 0 ? this.intersection(...fsAllowLists) : [],
                    deny: [...new Set(fsDeny)]
                };
            }

            // Network: outbound = intersection, blocked = union
            const netOutboundLists = [org.scope?.network?.outbound, project.scope?.network?.outbound, session.scope?.network?.outbound].filter((arr): arr is string[] => Array.isArray(arr) && arr.length > 0);
            const netBlocked = [
                ...(org.scope?.network?.blocked || []),
                ...(project.scope?.network?.blocked || []),
                ...(session.scope?.network?.blocked || [])
            ];

            if (netOutboundLists.length > 0 || netBlocked.length > 0) {
                merged.scope.network = {
                    outbound: netOutboundLists.length > 0 ? this.intersection(...netOutboundLists) : [],
                    blocked: [...new Set(netBlocked)]
                };
            }

            // Exec: allow = intersection, confirm = union
            const execAllowLists = [org.scope?.exec?.allow, project.scope?.exec?.allow, session.scope?.exec?.allow].filter((arr): arr is string[] => Array.isArray(arr) && arr.length > 0);
            const execConfirm = [
                ...(org.scope?.exec?.confirm || []),
                ...(project.scope?.exec?.confirm || []),
                ...(session.scope?.exec?.confirm || [])
            ];

            if (execAllowLists.length > 0 || execConfirm.length > 0) {
                merged.scope.exec = {
                    allow: execAllowLists.length > 0 ? this.intersection(...execAllowLists) : [],
                    confirm: [...new Set(execConfirm)]
                };
            }
        }

        // Merge limits: choose minimum (most restrictive)
        if (org.limits || project.limits || session.limits) {
            merged.limits = {};

            const tokenLimits = [
                org.limits?.tokens_per_session,
                project.limits?.tokens_per_session,
                session.limits?.tokens_per_session
            ].filter(v => v !== undefined) as number[];

            if (tokenLimits.length > 0) {
                merged.limits.tokens_per_session = Math.min(...tokenLimits);
            }

            const fileLimits = [
                org.limits?.files_read_per_minute,
                project.limits?.files_read_per_minute,
                session.limits?.files_read_per_minute
            ].filter(v => v !== undefined) as number[];

            if (fileLimits.length > 0) {
                merged.limits.files_read_per_minute = Math.min(...fileLimits);
            }

            const byteLimits = [
                org.limits?.bytes_read_per_minute,
                project.limits?.bytes_read_per_minute,
                session.limits?.bytes_read_per_minute
            ].filter(v => v !== undefined) as number[];

            if (byteLimits.length > 0) {
                merged.limits.bytes_read_per_minute = Math.min(...byteLimits);
            }
        }

        // Merge approval: union (more actions require approval)
        if (org.approval || project.approval || session.approval) {
            const requireFor = [
                ...(org.approval?.require_for || []),
                ...(project.approval?.require_for || []),
                ...(session.approval?.require_for || [])
            ];
            merged.approval = { require_for: [...new Set(requireFor)] };
        }

        this.effectivePolicy = merged;

        return {
            ...merged,
            hash: this.hashPolicy(merged)
        };
    }

    /**
     * Validate override against effective policy per PRD 7.3.10
     */
    validateOverride(
        override: PartialPolicy,
        mode: 'restrictive' | 'admin'
    ): { valid: boolean; violations: string[] } {
        const violations: string[] = [];

        if (!this.effectivePolicy) {
            return { valid: true, violations: [] };
        }

        const allowWidening = mode === 'admin';

        // Validate numeric limits (can only narrow, unless admin)
        if (override.limits) {
            const effective = this.effectivePolicy.limits || {};

            if (override.limits.tokens_per_session !== undefined && effective.tokens_per_session !== undefined) {
                if (!allowWidening && override.limits.tokens_per_session > effective.tokens_per_session) {
                    violations.push(`tokens_per_session: override value exceeds effective limit (${override.limits.tokens_per_session} > ${effective.tokens_per_session})`);
                }
            }

            if (override.limits.files_read_per_minute !== undefined && effective.files_read_per_minute !== undefined) {
                if (!allowWidening && override.limits.files_read_per_minute > effective.files_read_per_minute) {
                    violations.push(`files_read_per_minute: override value exceeds effective limit`);
                }
            }

            if (override.limits.bytes_read_per_minute !== undefined && effective.bytes_read_per_minute !== undefined) {
                if (!allowWidening && override.limits.bytes_read_per_minute > effective.bytes_read_per_minute) {
                    violations.push(`bytes_read_per_minute: override value exceeds effective limit`);
                }
            }
        }

        // Validate network: can only restrict outbound (unless admin)
        if (override.scope?.network?.outbound) {
            const effectiveOutbound = this.effectivePolicy.scope?.network?.outbound || [];
            const newHosts = override.scope.network.outbound.filter(h => !effectiveOutbound.includes(h));

            if (!allowWidening && newHosts.length > 0) {
                violations.push(`network.outbound: attempting to add hosts not in effective policy: ${newHosts.join(', ')}`);
            }
        }

        // Validate FS allow: can only narrow (unless admin)
        if (override.scope?.fs?.allow) {
            const effectiveAllow = this.effectivePolicy.scope?.fs?.allow || [];
            const newPaths = override.scope.fs.allow.filter(p => !effectiveAllow.includes(p));

            if (!allowWidening && newPaths.length > 0) {
                violations.push(`fs.allow: attempting to add paths not in effective policy: ${newPaths.join(', ')}`);
            }
        }

        return {
            valid: violations.length === 0,
            violations
        };
    }

    /**
     * Set current effective policy for validation
     */
    setEffectivePolicy(policy: PartialPolicy): void {
        this.effectivePolicy = policy;
    }

    private intersection(...arrays: string[][]): string[] {
        if (arrays.length === 0) return [];
        if (arrays.length === 1) return arrays[0] ?? [];

        return arrays.reduce((acc, arr) => acc.filter(item => arr.includes(item)));
    }

    private hashPolicy(policy: PartialPolicy): string {
        // Sort keys recursively for consistent hashing
        const sortedPolicy = this.sortObjectKeys(policy);
        const policyJson = JSON.stringify(sortedPolicy);
        return 'sha256:' + crypto.createHash('sha256').update(policyJson).digest('hex').slice(0, 16);
    }

    private sortObjectKeys(obj: any): any {
        if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
            return obj;
        }

        const sorted: any = {};
        Object.keys(obj).sort().forEach(key => {
            sorted[key] = this.sortObjectKeys(obj[key]);
        });
        return sorted;
    }
}
