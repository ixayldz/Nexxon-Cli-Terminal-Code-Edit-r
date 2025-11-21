// Test runner handler
import { spawn } from 'node:child_process';
import type { RequestEnvelope, ResponseEnvelope } from '@nexxon/shared/src/types.js';
import { NexxonErrorClass, ERROR_CODES } from '../shared.js';

export async function handleTest(req: RequestEnvelope): Promise<ResponseEnvelope> {
    const start = Date.now();
    const cmd = req.args.cmd as string || 'npm test';
    const timeout = req.args.timeout as number || 300000; // 5 min default

    return new Promise((resolve, reject) => {
        const parts = cmd.split(' ');
        const command = parts[0];
        const args = parts.slice(1);

        if (!command) {
            reject(new NexxonErrorClass(
                ERROR_CODES.INVALID_ARGS,
                'generic',
                'Command is empty',
                req.command,
                req.args
            ));
            return;
        }

        const proc = spawn(command, args, {
            cwd: process.cwd(),
            shell: true,
            timeout
        });

        let stdout = '';
        let stderr = '';

        if (proc.stdout) {
            proc.stdout.on('data', (data: Buffer) => {
                stdout += data.toString();
            });
        }

        if (proc.stderr) {
            proc.stderr.on('data', (data: Buffer) => {
                stderr += data.toString();
            });
        }

        proc.on('close', (code: number | null) => {
            resolve({
                api_version: '1.0',
                id: req.id,
                status: 'ok',
                result: {
                    exit_code: code ?? -1,
                    stdout: stdout.slice(-1000), // Last 1000 chars
                    stderr: stderr.slice(-1000),
                    success: code === 0
                },
                metrics: { latency_ms: Date.now() - start }
            });
        });

        proc.on('error', (error: Error) => {
            reject(new NexxonErrorClass(
                ERROR_CODES.TEST_FAILED,
                'runtime',
                error.message,
                req.command,
                req.args
            ));
        });
    });
}
