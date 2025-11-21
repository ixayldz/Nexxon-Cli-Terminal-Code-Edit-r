import { describe, it, expect } from 'vitest';
import { NexxonErrorClass, createErrorResponse, ERROR_CODES } from '../index.js';

describe('NexxonErrorClass', () => {
    it('should create error with all required fields', () => {
        const error = new NexxonErrorClass(
            ERROR_CODES.POLICY_DENIED,
            'policy',
            'Test error message',
            'test_command',
            { arg1: 'value1' }
        );

        expect(error.code).toBe(ERROR_CODES.POLICY_DENIED);
        expect(error.category).toBe('policy');
        expect(error.message).toBe('Test error message');
        expect(error.context.command).toBe('test_command');
        expect(error.context.args).toEqual({ arg1: 'value1' });
    });

    it('should include timestamp in context', () => {
        const error = new NexxonErrorClass(
            ERROR_CODES.RUNTIME_ERROR,
            'runtime',
            'Test',
            'cmd',
            {}
        );

        expect(error.context.timestamp).toBeDefined();
        expect(new Date(error.context.timestamp).getTime()).toBeGreaterThan(0);
    });

    it('should set retry metadata correctly', () => {
        const error = new NexxonErrorClass(
            ERROR_CODES.PROVIDER_TIMEOUT,
            'provider',
            'Timeout',
            'plan',
            {}
        );

        expect(error.retry).toBeDefined();
        expect(error.retry.retryable).toBe(true);
        expect(error.retry.retryAfter).toBeGreaterThan(0);
    });

    it('should mark non-retryable errors correctly', () => {
        const error = new NexxonErrorClass(
            ERROR_CODES.POLICY_DENIED,
            'policy',
            'Denied',
            'test',
            {}
        );

        expect(error.retry.retryable).toBe(false);
    });

    it('should include help documentation', () => {
        const error = new NexxonErrorClass(
            ERROR_CODES.PROVIDER_UNAVAILABLE,
            'provider',
            'Provider down',
            'plan',
            {}
        );

        expect(error.help).toBeDefined();
        expect(error.help.docs).toContain('http');
        expect(error.help.suggestions).toBeInstanceOf(Array);
        expect(error.help.suggestions.length).toBeGreaterThan(0);
    });
});

describe('createErrorResponse', () => {
    it('should create properly formatted error response', () => {
        const error = new NexxonErrorClass(
            ERROR_CODES.INVALID_ARGS,
            'generic',
            'Missing argument',
            'plan',
            {}
        );

        const response = createErrorResponse('test-id-123', error);

        expect(response.api_version).toBe('1.0');
        expect(response.id).toBe('test-id-123');
        expect(response.status).toBe('error');
        expect(response.error).toBeDefined();
        expect(response.error?.code).toBe(ERROR_CODES.INVALID_ARGS.toString());
        expect(response.error?.message).toBe('Missing argument');
    });

    it('should include error details in response', () => {
        const error = new NexxonErrorClass(
            ERROR_CODES.POLICY_DENIED,
            'policy',
            'Access denied',
            'apply',
            { file: 'secret.txt' },
            { rule: 'fs.deny', path: '/secrets' }
        );

        const response = createErrorResponse('req-456', error);

        expect(response.error?.details).toBeDefined();
        expect(response.error?.details?.rule).toBe('fs.deny');
    });
});
