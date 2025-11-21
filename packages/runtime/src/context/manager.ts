// Context management with sliding window and RAG
import type { ApplyRecord } from '@nexxon/undo/src/ledger.js';
import type { SearchResult } from '@nexxon/vector/src/index.js';

export interface ContextWindow {
    maxTokens: number;
    recentHistory: ApplyRecord[];
    semanticMatches: SearchResult[];
    summary?: string;
}

export class ContextManager {
    private maxTokens: number;
    private windowSize: number;

    constructor(maxTokens: number = 8000) {
        this.maxTokens = maxTokens;
        this.windowSize = 3; // Keep last 3 applies
    }

    // Estimate token count (rough approximation)
    private estimateTokens(text: string): number {
        return Math.ceil(text.length / 4);
    }

    // Build context with sliding window
    async buildContext(
        task: string,
        recentHistory: ApplyRecord[],
        vectorSearch?: any
    ): Promise<string> {
        const parts: string[] = [];
        let tokenCount = 0;

        // 1. Add task description
        parts.push(`Task: ${task}\n`);
        tokenCount += this.estimateTokens(task);

        // 2. Add semantic matches if available
        if (vectorSearch) {
            try {
                const matches = await vectorSearch.search(task, 3);
                if (matches.length > 0) {
                    parts.push('\nRelevant Code:\n');
                    for (const match of matches) {
                        const chunk = `File: ${match.file_path}\n${match.chunk_text}\n`;
                        const chunkTokens = this.estimateTokens(chunk);

                        if (tokenCount + chunkTokens < this.maxTokens * 0.5) {
                            parts.push(chunk);
                            tokenCount += chunkTokens;
                        }
                    }
                }
            } catch (error) {
                console.warn('Vector search failed:', error);
            }
        }

        // 3. Add recent history (sliding window)
        const recentApplies = recentHistory.slice(-this.windowSize);
        if (recentApplies.length > 0) {
            parts.push('\nRecent Changes:\n');
            for (const apply of recentApplies) {
                const entry = `${apply.ts}: Modified ${apply.files_changed.join(', ')}\n`;
                const entryTokens = this.estimateTokens(entry);

                if (tokenCount + entryTokens < this.maxTokens * 0.8) {
                    parts.push(entry);
                    tokenCount += entryTokens;
                }
            }
        }

        return parts.join('\n');
    }

    // Truncate context if too long
    truncate(context: string): string {
        const tokens = this.estimateTokens(context);

        if (tokens <= this.maxTokens) {
            return context;
        }

        // Simple truncation (keep beginning and end)
        const chars = this.maxTokens * 4;
        const half = Math.floor(chars / 2);

        return context.slice(0, half) + '\n\n[... truncated ...]\n\n' + context.slice(-half);
    }

    getStats(context: string): { tokens: number; withinBudget: boolean } {
        const tokens = this.estimateTokens(context);
        return {
            tokens,
            withinBudget: tokens <= this.maxTokens
        };
    }
}
