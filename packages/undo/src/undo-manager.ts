// Git-aware undo implementation
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ApplyRecord } from './ledger.js';

export interface UndoOptions {
    steps: number;
}

export interface UndoResult {
    reverted: boolean;
    steps: number;
    method: 'git' | 'snapshot';
    conflicts?: string[];
}

export class UndoManager {
    private cwd: string;

    constructor(cwd?: string) {
        this.cwd = cwd || process.cwd();
    }

    async isGitRepo(): Promise<boolean> {
        return new Promise((resolve) => {
            const proc = spawn('git', ['rev-parse', '--git-dir'], { cwd: this.cwd });
            proc.on('close', (code) => {
                resolve(code === 0);
            });
        });
    }

    async undoWithGit(record: ApplyRecord): Promise<UndoResult> {
        const conflicts: string[] = [];

        for (const file of record.files_changed) {
            const fullPath = path.resolve(this.cwd, file);

            // Try git restore
            const restoreResult = await new Promise<boolean>((resolve) => {
                const args = record.git_sha
                    ? ['restore', '--source', record.git_sha, file]
                    : ['restore', file];

                const proc = spawn('git', args, { cwd: this.cwd });
                proc.on('close', (code) => resolve(code === 0));
            });

            if (!restoreResult) {
                conflicts.push(file);
            }
        }

        return {
            reverted: conflicts.length === 0,
            steps: 1,
            method: 'git',
            conflicts: conflicts.length > 0 ? conflicts : undefined
        };
    }

    async undoWithSnapshot(record: ApplyRecord): Promise<UndoResult> {
        const conflicts: string[] = [];

        if (!record.backup_path || !fs.existsSync(record.backup_path)) {
            return {
                reverted: false,
                steps: 0,
                method: 'snapshot',
                conflicts: ['Backup not found']
            };
        }

        // Read backup (JSON with file contents)
        const backupData = JSON.parse(fs.readFileSync(record.backup_path, 'utf8'));

        for (const file of record.files_changed) {
            const fullPath = path.resolve(this.cwd, file);

            if (backupData[file] !== undefined) {
                try {
                    fs.writeFileSync(fullPath, backupData[file], 'utf8');
                } catch (error) {
                    conflicts.push(file);
                }
            } else {
                conflicts.push(file);
            }
        }

        return {
            reverted: conflicts.length === 0,
            steps: 1,
            method: 'snapshot',
            conflicts: conflicts.length > 0 ? conflicts : undefined
        };
    }

    async undo(records: ApplyRecord[]): Promise<UndoResult> {
        const isGit = await this.isGitRepo();
        let totalReverted = 0;
        const allConflicts: string[] = [];

        for (const record of records.reverse()) {
            const result = isGit
                ? await this.undoWithGit(record)
                : await this.undoWithSnapshot(record);

            if (result.reverted) {
                totalReverted++;
            }

            if (result.conflicts) {
                allConflicts.push(...result.conflicts);
            }
        }

        return {
            reverted: totalReverted === records.length,
            steps: totalReverted,
            method: isGit ? 'git' : 'snapshot',
            conflicts: allConflicts.length > 0 ? allConflicts : undefined
        };
    }
}
