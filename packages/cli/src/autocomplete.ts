/**
 * Auto-completion for slash commands and file paths
 */

import fs from 'node:fs';
import path from 'node:path';

// Slash commands will be imported dynamically to avoid circular dependency
const slashCommandNames = ['help', 'plan', 'diff', 'model', 'search', 'clear', 'exit'];

export function createCompleter() {
    return function completer(line: string): [string[], string] {
        // Slash command completion
        if (line.startsWith('/')) {
            const commandOptions = slashCommandNames.map(name => `/${name}`);
            const matches = commandOptions.filter(cmd => cmd.startsWith(line));

            return [matches, line];
        }

        // File path completion (basic)
        if (line.includes('@')) {
            const parts = line.split('@');
            const pathPart = parts[parts.length - 1];

            if (!pathPart) {
                return [[], line];
            }

            try {
                const dir = path.dirname(pathPart) || '.';
                const base = path.basename(pathPart);

                if (fs.existsSync(dir)) {
                    const files = fs.readdirSync(dir)
                        .filter(f => f.startsWith(base))
                        .map(f => path.join(dir, f));

                    return [files, pathPart];
                }
            } catch {
                // Ignore errors
            }
        }

        return [[], line];
    };
}
