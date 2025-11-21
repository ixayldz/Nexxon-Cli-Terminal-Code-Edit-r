// Log handler - read and return audit entries
import fs from 'node:fs';
import path from 'node:path';
import type { RequestEnvelope, ResponseEnvelope } from '@nexxon/shared/src/types.js';
import { NexxonErrorClass, ERROR_CODES } from '../shared.js';

export async function handleLog(req: RequestEnvelope): Promise<ResponseEnvelope> {
    const start = Date.now();
    const limit = (req.args.limit as number) || 50;

    try {
        const logPath = path.join(process.cwd(), '.nexxon', 'audit.log');

        if (!fs.existsSync(logPath)) {
            return {
                api_version: '1.0',
                id: req.id,
                status: 'ok',
                result: { entries: [] },
                metrics: { latency_ms: Date.now() - start }
            };
        }

        const content = fs.readFileSync(logPath, 'utf8');
        const lines = content.trim().split('\n').filter(line => line.trim());

        // Parse JSONL
        const entries = lines
            .map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return null;
                }
            })
            .filter(entry => entry !== null)
            .slice(-limit); // Last N entries

        return {
            api_version: '1.0',
            id: req.id,
            status: 'ok',
            result: { entries },
            metrics: { latency_ms: Date.now() - start }
        };
    } catch (error) {
        if (error instanceof NexxonErrorClass) throw error;

        throw new NexxonErrorClass(
            ERROR_CODES.RUNTIME_ERROR,
            'runtime',
            error instanceof Error ? error.message : 'Unknown error',
            req.command,
            req.args
        );
    }
}
