import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['packages/**/src/__tests__/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['packages/**/src/**/*.ts'],
            exclude: ['packages/**/src/__tests__/**', 'packages/**/dist/**']
        }
    },
    resolve: {
        alias: {
            '@nexxon/shared': path.resolve(__dirname, 'packages/shared/src'),
            '@nexxon/policy': path.resolve(__dirname, 'packages/policy/src'),
            '@nexxon/audit': path.resolve(__dirname, 'packages/audit/src'),
            '@nexxon/ui': path.resolve(__dirname, 'packages/ui/src'),
            '@nexxon/diff': path.resolve(__dirname, 'packages/diff/src')
        }
    }
});
