#!/usr/bin/env node

/**
 * Nexxon CLI - Global Entry Point
 * Starts interactive terminal UI
 */

import { startInteractiveCLI } from '../packages/cli/dist/interactive.js';

startInteractiveCLI().catch(err => {
    console.error('Failed to start Nexxon:', err.message);
    process.exit(1);
});
