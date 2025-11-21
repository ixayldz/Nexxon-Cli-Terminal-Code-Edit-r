// Vitest global setup
import { beforeEach, afterEach, vi } from 'vitest';

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

// Cleanup after each test
afterEach(() => {
  vi.restoreAllMocks();
});

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
