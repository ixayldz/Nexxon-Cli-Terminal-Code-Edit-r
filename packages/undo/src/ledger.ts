// Session ledger with SQLite
import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';

export interface Session {
    id: string;
    started_at: string;
    ended_at?: string;
    user_id?: string;
}

export interface ApplyRecord {
    id: string;
    session_id: string;
    ts: string;
    patch_path?: string;
    git_sha?: string;
    files_changed: string[]; // JSON array as string in DB
    backup_path?: string;
}

export class SessionLedger {
    private db: Database.Database;
    private currentSessionId: string | null = null;

    constructor(dbPath?: string) {
        const ledgerPath = dbPath || path.join(process.cwd(), '.nexxon', 'session.sqlite');

        // Ensure directory exists
        const dir = path.dirname(ledgerPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        this.db = new Database(ledgerPath);
        this.initSchema();
    }

    private initSchema(): void {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        user_id TEXT
      );

      CREATE TABLE IF NOT EXISTS apply_records (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        ts TEXT NOT NULL,
        patch_path TEXT,
        git_sha TEXT,
        files_changed TEXT NOT NULL,
        backup_path TEXT,
        FOREIGN KEY(session_id) REFERENCES sessions(id)
      );

      CREATE INDEX IF NOT EXISTS idx_session_ts ON apply_records(session_id, ts DESC);
    `);
    }

    startSession(userId?: string): string {
        const id = randomUUID();
        const stmt = this.db.prepare('INSERT INTO sessions (id, started_at, user_id) VALUES (?, ?, ?)');
        stmt.run(id, new Date().toISOString(), userId || null);
        this.currentSessionId = id;
        return id;
    }

    endSession(sessionId: string): void {
        const stmt = this.db.prepare('UPDATE sessions SET ended_at = ? WHERE id = ?');
        stmt.run(new Date().toISOString(), sessionId);

        if (this.currentSessionId === sessionId) {
            this.currentSessionId = null;
        }
    }

    getCurrentSession(): string {
        if (!this.currentSessionId) {
            this.currentSessionId = this.startSession();
        }
        return this.currentSessionId;
    }

    recordApply(record: Omit<ApplyRecord, 'id' | 'ts'>): string {
        const id = randomUUID();
        const stmt = this.db.prepare(`
      INSERT INTO apply_records (id, session_id, ts, patch_path, git_sha, files_changed, backup_path)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            id,
            record.session_id,
            new Date().toISOString(),
            record.patch_path || null,
            record.git_sha || null,
            JSON.stringify(record.files_changed),
            record.backup_path || null
        );

        return id;
    }

    getLastApplyRecords(count: number): ApplyRecord[] {
        const stmt = this.db.prepare(`
      SELECT * FROM apply_records 
      ORDER BY ts DESC 
      LIMIT ?
    `);

        const rows = stmt.all(count) as any[];
        return rows.map(row => ({
            ...row,
            files_changed: JSON.parse(row.files_changed)
        }));
    }

    getApplyRecordsForSession(sessionId: string): ApplyRecord[] {
        const stmt = this.db.prepare(`
      SELECT * FROM apply_records 
      WHERE session_id = ?
      ORDER BY ts DESC
    `);

        const rows = stmt.all(sessionId) as any[];
        return rows.map(row => ({
            ...row,
            files_changed: JSON.parse(row.files_changed)
        }));
    }

    cleanup(daysToKeep = 14): number {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const stmt = this.db.prepare(`
      DELETE FROM sessions 
      WHERE started_at < ? AND ended_at IS NOT NULL
    `);

        const result = stmt.run(cutoffDate.toISOString());
        return result.changes;
    }

    close(): void {
        this.db.close();
    }
}
