import { ERROR_CODES } from './error-codes.js';
import type { ResponseEnvelope } from './types.js';

// Per PRD Section 19: Error Response Format
export interface NexxonError {
    code: number;
    category: 'policy' | 'provider' | 'runtime' | 'network' | 'generic';
    message: string;
    details?: Record<string, unknown>;
    retry: {
        retryable: boolean;
        retryAfter?: number; // seconds
        fallback?: 'local_model' | 'next_provider';
    };
    context: {
        command: string;
        args: object;
        timestamp: string; // ISO-8601
    };
    help: {
        docs: string; // URL to relevant docs
        suggestions: string[]; // Actionable steps
    };
}

export class NexxonErrorClass extends Error implements NexxonError {
    public code: number;
    public category: 'policy' | 'provider' | 'runtime' | 'network' | 'generic';
    public retry: NexxonError['retry'];
    public context: NexxonError['context'];
    public help: NexxonError['help'];
    public details?: Record<string, unknown>;

    constructor(
        code: number,
        category: 'policy' | 'provider' | 'runtime' | 'network' | 'generic',
        message: string,
        command: string = 'unknown',
        args: Record<string, unknown> = {},
        details?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'NexxonError';
        this.code = code;
        this.category = category;
        this.details = details;

        // Set context
        this.context = {
            command,
            args,
            timestamp: new Date().toISOString()
        };

        // Set retry metadata based on error code
        this.retry = this.determineRetryability(code);

        // Set help documentation
        this.help = this.generateHelp(code, category);
    }

    private determineRetryability(code: number): NexxonError['retry'] {
        const retryableErrors = [
            ERROR_CODES.PROVIDER_TIMEOUT,
            ERROR_CODES.PROVIDER_UNAVAILABLE,
            ERROR_CODES.NETWORK_UNREACHABLE,
            ERROR_CODES.DNS_RESOLUTION_FAILED,
            ERROR_CODES.RUNTIME_ERROR
        ];

        if ((retryableErrors as number[]).includes(code)) {
            return {
                retryable: true,
                retryAfter: code === ERROR_CODES.PROVIDER_TIMEOUT ? 5 : 10,
                fallback: code === ERROR_CODES.PROVIDER_UNAVAILABLE ? 'next_provider' : undefined
            };
        }

        return { retryable: false };
    }

    private generateHelp(code: number, category: string): NexxonError['help'] {
        const docs = `https://docs.nexxon.dev/errors/${code}`;
        let suggestions: string[] = [];

        switch (code) {
            case ERROR_CODES.POLICY_DENIED:
                suggestions = [
                    'Check policy.yaml configuration',
                    'Verify file/command/host is in allow list',
                    'Use --admin-override if you have appropriate role'
                ];
                break;
            case ERROR_CODES.PROVIDER_TIMEOUT:
                suggestions = [
                    'Check network connection',
                    'Verify API endpoint is reachable',
                    'Try again in a few seconds'
                ];
                break;
            case ERROR_CODES.PROVIDER_AUTH_FAILED:
                suggestions = [
                    'Check API key is set correctly',
                    'Verify API key has not expired',
                    'Ensure API key has required permissions'
                ];
                break;
            case ERROR_CODES.PROVIDER_UNAVAILABLE:
                suggestions = [
                    'Try a different provider',
                    'Enable local fallback in policy',
                    'Check provider status page'
                ];
                break;
            case ERROR_CODES.NETWORK_UNREACHABLE:
                suggestions = [
                    'Check internet connection',
                    'Verify network policy allows outbound',
                    'Try enabling local-only mode'
                ];
                break;
            case ERROR_CODES.DIFF_APPLY_CONFLICT:
                suggestions = [
                    'Review conflicts manually',
                    'Run undo to revert',
                    'Apply changes incrementally'
                ];
                break;
            default:
                suggestions = ['Check logs for details', 'Retry the command', 'Contact support if issue persists'];
        }

        return { docs, suggestions };
    }
}

export function createErrorResponse(id: string, error: NexxonErrorClass): ResponseEnvelope {
    return {
        api_version: '1.0',
        id,
        status: 'error',
        error: {
            code: error.code.toString(),
            message: error.message,
            details: error.details
        }
    };
}
