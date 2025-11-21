/**
 * Slash Command Router
 * Handles /command syntax for quick actions
 */

import { matrixTheme, errorText, successText } from '../theme/matrix.js';
import { buildRuntimeRequest, callRuntimeEnvelope } from '../runtimeClient.js';

export interface SlashCommand {
    name: string;
    description: string;
    usage: string;
    handler: (args: string[]) => Promise<void>;
}

export const slashCommands: Record<string, SlashCommand> = {
    help: {
        name: 'help',
        description: 'Show available commands',
        usage: '/help [command]',
        handler: async (args) => {
            if (args.length > 0) {
                const cmdName = args[0];
                if (!cmdName) return;

                const cmd = slashCommands[cmdName];
                if (cmd) {
                    console.log(matrixTheme.primary(`\n/${cmd.name}`));
                    console.log(matrixTheme.dim(`  ${cmd.description}`));
                    console.log(matrixTheme.muted(`  Usage: ${cmd.usage}\n`));
                } else {
                    console.log(errorText(`Unknown command: /${cmdName}`));
                }
            } else {
                console.log(matrixTheme.primary('\n📚 Available Commands:\n'));
                Object.values(slashCommands).forEach(cmd => {
                    console.log(matrixTheme.accent(`  /${cmd.name.padEnd(12)}`), matrixTheme.dim(cmd.description));
                });
                console.log('');
            }
        }
    },

    plan: {
        name: 'plan',
        description: 'Create implementation plan',
        usage: '/plan <task>',
        handler: async (args) => {
            if (args.length === 0) {
                console.log(errorText('Usage: /plan <task description>'));
                return;
            }
            const task = args.join(' ');
            console.log(matrixTheme.primary(`\n${matrixTheme.symbols.loading} Creating plan for: ${task}\n`));

            const req = buildRuntimeRequest('plan', { task });
            const res = await callRuntimeEnvelope(req);

            if (res.status === 'ok') {
                console.log(successText('\n✓ Plan created successfully\n'));
                console.log(JSON.stringify(res.result, null, 2));
            } else {
                console.log(errorText(`\n✗ Error: ${res.error?.message}\n`));
            }
        }
    },

    diff: {
        name: 'diff',
        description: 'Generate file diff',
        usage: '/diff <file>',
        handler: async (args) => {
            if (args.length === 0) {
                console.log(errorText('Usage: /diff <file path>'));
                return;
            }
            const file = args[0];
            console.log(matrixTheme.primary(`\n${matrixTheme.symbols.loading} Generating diff for: ${file}\n`));

            // This would integrate with the diff command
            console.log(matrixTheme.muted('Diff generation coming soon...'));
        }
    },

    model: {
        name: 'model',
        description: 'Switch LLM model',
        usage: '/model <name>',
        handler: async (args) => {
            if (args.length === 0) {
                console.log(errorText('Available models:'));
                console.log(matrixTheme.accent('  • gpt-5.1') + matrixTheme.dim(' (OpenAI)'));
                console.log(matrixTheme.accent('  • claude-4-5-sonnet-20250514') + matrixTheme.dim(' (Anthropic)'));
                console.log(matrixTheme.accent('  • gemini-3-pro') + matrixTheme.dim(' (Google)'));
                return;
            }
            const model = args[0];
            console.log(successText(`\n✓ Switched to model: ${model}\n`));
            // Store in session
        }
    },

    search: {
        name: 'search',
        description: 'Search codebase',
        usage: '/search <query>',
        handler: async (args) => {
            if (args.length === 0) {
                console.log(errorText('Usage: /search <query>'));
                return;
            }
            const query = args.join(' ');
            console.log(matrixTheme.primary(`\n${matrixTheme.symbols.loading} Searching for: ${query}\n`));

            const req = buildRuntimeRequest('search', { q: query, semantic: false });
            const res = await callRuntimeEnvelope(req);

            if (res.status === 'ok') {
                console.log(JSON.stringify(res.result, null, 2));
            } else {
                console.log(errorText(`\n✗ Error: ${res.error?.message}\n`));
            }
        }
    },

    clear: {
        name: 'clear',
        description: 'Clear screen',
        usage: '/clear',
        handler: async () => {
            console.clear();
        }
    },

    exit: {
        name: 'exit',
        description: 'Exit Nexxon',
        usage: '/exit',
        handler: async () => {
            console.log(matrixTheme.gradient('\n👋 Goodbye!\n'));
            process.exit(0);
        }
    }
};

export async function handleSlashCommand(input: string): Promise<boolean> {
    if (!input.startsWith('/')) {
        return false;
    }

    const [cmdName, ...args] = input.slice(1).split(' ').filter(s => s.length > 0);

    if (!cmdName) {
        return true;
    }

    const command = slashCommands[cmdName.toLowerCase()];

    if (command) {
        try {
            await command.handler(args);
        } catch (error: any) {
            console.log(errorText(`\n✗ Command failed: ${error.message}\n`));
        }
        return true;
    } else {
        console.log(errorText(`\nUnknown command: /${cmdName}`));
        console.log(matrixTheme.dim(`Type ${matrixTheme.accent('/help')} for available commands\n`));
        return true;
    }
}
