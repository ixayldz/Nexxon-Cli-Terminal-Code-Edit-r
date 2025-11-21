/**
 * Interactive REPL Mode
 * Main entry point for interactive terminal UI
 */

import readline from 'node:readline';
import { spawn } from 'node:child_process';
import { showWelcomeScreen } from './ui/welcome.js';
import { matrixTheme, errorText, successText } from './theme/matrix.js';
import { handleSlashCommand } from './commands/slash-router.js';
import { createCompleter } from './autocomplete.js';
import { checkRuntimeStatus } from './runtimeClient.js';

let history: string[] = [];

export async function startInteractiveCLI(): Promise<void> {
    // Show welcome screen
    await showWelcomeScreen();

    // Start runtime if needed
    await ensureRuntimeRunning();

    // Create readline interface
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        completer: createCompleter(),
        prompt: matrixTheme.prompt(),
        historySize: 100
    });

    // Display initial prompt
    rl.prompt();

    // Handle user input
    rl.on('line', async (input: string) => {
        const trimmed = input.trim();

        if (trimmed.length === 0) {
            rl.prompt();
            return;
        }

        // Add to history
        history.push(trimmed);

        // Handle slash commands
        if (await handleSlashCommand(trimmed)) {
            rl.prompt();
            return;
        }

        // Handle natural language input
        await handleNaturalLanguage(trimmed);

        rl.prompt();
    });

    // Handle Ctrl+C
    rl.on('SIGINT', () => {
        console.log(matrixTheme.gradient('\n\n👋 Goodbye!\n'));
        process.exit(0);
    });

    // Handle errors
    rl.on('error', (err) => {
        console.error(errorText(`\nError: ${err.message}\n`));
        rl.prompt();
    });
}

async function ensureRuntimeRunning(): Promise<void> {
    try {
        const isRunning = await checkRuntimeStatus();

        if (!isRunning) {
            console.log(matrixTheme.symbols.loading, matrixTheme.dim('Starting runtime server...'));

            // Start runtime in background
            const runtime = spawn('node', ['packages/runtime/dist/server.js'], {
                detached: true,
                stdio: 'ignore',
                cwd: process.cwd()
            });

            runtime.unref();

            // Wait for runtime to be ready
            await waitForRuntime();

            console.log(matrixTheme.symbols.success, successText('Runtime ready\n'));
        } else {
            console.log(matrixTheme.symbols.success, matrixTheme.dim('Runtime already running\n'));
        }
    } catch (error: any) {
        console.log(matrixTheme.symbols.warning, matrixTheme.warning(`Warning: ${error.message}`));
        console.log(matrixTheme.dim('You may need to start runtime manually: npm run dev:runtime\n'));
    }
}

async function waitForRuntime(maxWait: number = 5000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
        try {
            if (await checkRuntimeStatus()) {
                return;
            }
        } catch {
            // Keep waiting
        }
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    throw new Error('Runtime failed to start within 5 seconds');
}

async function handleNaturalLanguage(input: string): Promise<void> {
    console.log(matrixTheme.dim('\n💬 Natural language mode - interpret as AI request'));
    console.log(matrixTheme.muted('  (This feature will use the default model to interpret your request)\n'));

    // TODO: Send to LLM for interpretation and action
    console.log(matrixTheme.primary(`You said: "${input}"`));
    console.log(matrixTheme.dim('(Natural language processing coming soon...)\n'));
}
