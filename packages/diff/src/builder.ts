// Multi-file diff builder
import { buildUnifiedDiff } from './index.js';
import fs from 'node:fs';
import path from 'node:path';

export interface FileDiff {
    path: string;
    oldContent: string;
    newContent: string;
    diff: string;
}

export interface MultiFileDiffOptions {
    files: Array<{ path: string; content: string }>;
    cwd?: string;
}

export class MultiFileDiffBuilder {
    private diffs: FileDiff[] = [];
    private cwd: string;

    constructor(cwd?: string) {
        this.cwd = cwd || process.cwd();
    }

    addFile(filePath: string, newContent: string): void {
        const fullPath = path.resolve(this.cwd, filePath);
        let oldContent = '';

        if (fs.existsSync(fullPath)) {
            oldContent = fs.readFileSync(fullPath, 'utf8');
        }

        const diff = buildUnifiedDiff({
            oldPath: filePath,
            newPath: filePath,
            oldContent,
            newContent: newContent.trim()
        });

        this.diffs.push({
            path: filePath,
            oldContent,
            newContent: newContent.trim(),
            diff
        });
    }

    build(): string {
        if (this.diffs.length === 0) {
            return '';
        }

        return this.diffs.map(d => d.diff).join('\n');
    }

    getDiffs(): FileDiff[] {
        return this.diffs;
    }

    getFilesChanged(): string[] {
        return this.diffs.map(d => d.path);
    }

    hasChanges(): boolean {
        return this.diffs.some(d => d.diff.includes('@@'));
    }

    getStats(): { files: number; additions: number; deletions: number } {
        let additions = 0;
        let deletions = 0;

        for (const fileDiff of this.diffs) {
            const lines = fileDiff.diff.split('\n');
            for (const line of lines) {
                if (line.startsWith('+') && !line.startsWith('+++')) additions++;
                if (line.startsWith('-') && !line.startsWith('---')) deletions++;
            }
        }

        return {
            files: this.diffs.length,
            additions,
            deletions
        };
    }
}
