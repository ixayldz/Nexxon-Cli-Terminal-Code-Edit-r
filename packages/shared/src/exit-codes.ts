// Exit codes per PRD Section 19
export const ExitCodes = {
    SUCCESS: 0,
    GENERIC_ERROR: 1,
    POLICY_DENIED: 2,
    TESTS_FAILED: 3,
    INVALID_ARGS: 4
} as const;

export type ExitCode = typeof ExitCodes[keyof typeof ExitCodes];
