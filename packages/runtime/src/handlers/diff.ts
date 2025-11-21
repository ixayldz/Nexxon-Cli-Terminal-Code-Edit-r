// Diff handler implementation
import { buildUnifiedDiff } from '../diff-adapter.js';
import { registry } from '../llm/provider.js';
import { createCodePrompt } from '../prompts/templates.js';
import fs from 'node:fs';
import path from 'node:path';
import type { RequestEnvelope, ResponseEnvelope } from '@nexxon/shared/src/types.js';
import { NexxonErrorClass, ERROR_CODES } from '../shared.js';

export async function handleDiff(req: RequestEnvelope): Promise<ResponseEnvelope> {
    const start = Date.now();
    const task = req.args.task as string;
    const filePath = req.args.file as string;

    if (!task || !filePath) {
        throw new NexxonErrorClass(
            ERROR_CODES.INVALID_ARGS,
            'generic',
            'Task and file are required',
            req.command,
            req.args,
            { missing: [!task ? 'task' : '', !filePath ? 'file' : ''].filter(Boolean) }
        );
    }

    try {
        // Read current file content
        const fullPath = path.resolve(process.cwd(), filePath);
        let currentContent = '';

        if (fs.existsSync(fullPath)) {
            currentContent = fs.readFileSync(fullPath, 'utf8');
        }

        // Get LLM provider
        const provider = registry.getDefault();

        // Generate new content
        const prompt = createCodePrompt(task, filePath, currentContent);
        let newContent: string;
        try {
            newContent = await provider.complete(prompt, {
                temperature: 0.2,
                maxTokens: 4096
            });
        } catch {
            // Fallback: no-op content (no changes)
            newContent = currentContent;
        }

        // Generate diff
        const diff = buildUnifiedDiff({
            oldPath: filePath,
            newPath: filePath,
            oldContent: currentContent,
            newContent: newContent.trim()
        });

        return {
            api_version: '1.0',
            id: req.id,
            status: 'ok',
            result: {
                patch: diff,
                file: filePath,
                hasChanges: diff.includes('@@'),
                new_content: newContent.trim()
            },
            metrics: { latency_ms: Date.now() - start }
        };
    } catch (error) {
        if (error instanceof NexxonErrorClass) throw error;

        throw new NexxonErrorClass(
            ERROR_CODES.LLM_ERROR,
            'provider',
            error instanceof Error ? error.message : 'Unknown error',
            req.command,
            req.args
        );
    }
}
