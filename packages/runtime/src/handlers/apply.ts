// Enhanced apply handler with session tracking and backups
import fs from 'node:fs';
import path from 'node:path';
import type { RequestEnvelope, ResponseEnvelope } from '@nexxon/shared/src/types.js';
// Accept any ledger-like implementation to avoid type coupling with dist/src
type LedgerLike = { getCurrentSession: () => string; recordApply: (r: { session_id: string; files_changed: string[]; backup_path?: string; patch_path?: string; git_sha?: string }) => string };
import { NexxonErrorClass, ERROR_CODES } from '../shared.js';

export async function handleApply(req: RequestEnvelope, ledger: LedgerLike): Promise<ResponseEnvelope> {
    const start = Date.now();
    const filePath = req.args.file as string;
    const content = req.args.content as string;
    const dryRun = req.args.dry_run as boolean ?? false;

    if (!filePath || content === undefined) {
        throw new NexxonErrorClass(
            ERROR_CODES.INVALID_ARGS,
            'generic',
            'File path and content are required',
            req.command,
            req.args,
            { missing: [!filePath ? 'file' : '', content === undefined ? 'content' : ''].filter(Boolean) }
        );
    }

    try {
        const fullPath = path.resolve(process.cwd(), filePath);

        // Create backup
        const backupData: Record<string, string> = {};
        if (fs.existsSync(fullPath)) {
            backupData[filePath] = fs.readFileSync(fullPath, 'utf8');
        }

        // Save backup to file
        const backupDir = path.join(process.cwd(), '.nexxon', 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const backupPath = path.join(backupDir, `backup-${Date.now()}.json`);
        fs.writeFileSync(backupPath, JSON.stringify(backupData), 'utf8');

        if (!dryRun) {
            // Ensure directory exists
            const dir = path.dirname(fullPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Write new content
            fs.writeFileSync(fullPath, content, 'utf8');

            // Record in session ledger
            ledger.recordApply({
                session_id: ledger.getCurrentSession(),
                files_changed: [filePath],
                backup_path: backupPath
            });
        }

        return {
            api_version: '1.0',
            id: req.id,
            status: 'ok',
            result: {
                applied: !dryRun,
                file: filePath,
                hadBackup: Object.keys(backupData).length > 0,
                backupPath: !dryRun ? backupPath : undefined
            },
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
