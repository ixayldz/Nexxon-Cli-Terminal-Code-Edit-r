import { describe, it, expect } from 'vitest';
import { ERROR_CODES } from '../error-codes.js';

describe('ERROR_CODES', () => {
    it('should define all required error codes from PRD Section 19', () => {
        expect(ERROR_CODES.POLICY_DENIED).toBeDefined();
        expect(ERROR_CODES.POLICY_INVALID_OVERRIDE).toBeDefined();
        expect(ERROR_CODES.POLICY_MERGE_CONFLICT).toBeDefined();
        expect(ERROR_CODES.PROVIDER_UNAVAILABLE).toBeDefined();
        expect(ERROR_CODES.PROVIDER_TIMEOUT).toBeDefined();
        expect(ERROR_CODES.PROVIDER_QUOTA_EXCEEDED).toBeDefined();
        expect(ERROR_CODES.PROVIDER_AUTH_FAILED).toBeDefined();
        expect(ERROR_CODES.DIFF_APPLY_CONFLICT).toBeDefined();
        expect(ERROR_CODES.TEST_FAILED).toBeDefined();
        expect(ERROR_CODES.INDEX_CORRUPT).toBeDefined();
        expect(ERROR_CODES.NETWORK_UNREACHABLE).toBeDefined();
    });

    it('should have numeric codes in correct ranges', () => {
        // Policy errors: 4000-4999
        expect(ERROR_CODES.POLICY_DENIED).toBeGreaterThanOrEqual(4000);
        expect(ERROR_CODES.POLICY_DENIED).toBeLessThan(5000);

        // Provider errors: 5000-5999
        expect(ERROR_CODES.PROVIDER_UNAVAILABLE).toBeGreaterThanOrEqual(5000);
        expect(ERROR_CODES.PROVIDER_UNAVAILABLE).toBeLessThan(6000);

        // Runtime errors: 6000-6999
        expect(ERROR_CODES.DIFF_APPLY_CONFLICT).toBeGreaterThanOrEqual(6000);
        expect(ERROR_CODES.DIFF_APPLY_CONFLICT).toBeLessThan(7000);

        // Network errors: 7000-7999
        expect(ERROR_CODES.NETWORK_UNREACHABLE).toBeGreaterThanOrEqual(7000);
        expect(ERROR_CODES.NETWORK_UNREACHABLE).toBeLessThan(8000);
    });

    it('should have unique error codes', () => {
        const codes = Object.values(ERROR_CODES);
        const uniqueCodes = new Set(codes);
        expect(uniqueCodes.size).toBe(codes.length);
    });
});
