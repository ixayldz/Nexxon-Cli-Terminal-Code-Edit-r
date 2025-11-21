// Performance: LLM response caching
import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

export interface CacheEntry {
    key: string;
    response: string;
    model: string;
    created_at: string;
    hit_count: number;
}

export class LLMCache {
    private db: Database.Database;
    private ttl: number;

    constructor(dbPath?: string, ttl: number = 3600) {
        const cachePath = dbPath || path.join(process.cwd(), '.nexxon', 'llm-cache.db');

        const dir = path.dirname(cachePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        this.db = new Database(cachePath);
        this.ttl = ttl;
        this.initSchema();
    }

    private initSchema(): void {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS llm_cache (
        key TEXT PRIMARY KEY,
        response TEXT NOT NULL,
        model TEXT NOT NULL,
        created_at TEXT NOT NULL,
        hit_count INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_created_at ON llm_cache(created_at);
    `);
    }

    private generateKey(prompt: string, model: string, temperature: number): string {
        const hash = crypto.createHash('sha256');
        hash.update(`${prompt}:${model}:${temperature}`);
        return hash.digest('hex');
    }

    get(prompt: string, model: string, temperature: number): string | null {
        const key = this.generateKey(prompt, model, temperature);
        const stmt = this.db.prepare(`
      SELECT response, created_at FROM llm_cache WHERE key = ?
    `);

        const row = stmt.get(key) as any;

        if (!row) return null;

        // Check if expired
        const createdAt = new Date(row.created_at);
        const now = new Date();
        const ageSeconds = (now.getTime() - createdAt.getTime()) / 1000;

        if (ageSeconds > this.ttl) {
            this.delete(key);
            return null;
        }

        // Increment hit count
        this.db.prepare('UPDATE llm_cache SET hit_count = hit_count + 1 WHERE key = ?').run(key);

        return row.response;
    }

    set(prompt: string, model: string, temperature: number, response: string): void {
        const key = this.generateKey(prompt, model, temperature);
        const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO llm_cache (key, response, model, created_at, hit_count)
      VALUES (?, ?, ?, ?, 0)
    `);

        stmt.run(key, response, model, new Date().toISOString());
    }

    delete(key: string): void {
        this.db.prepare('DELETE FROM llm_cache WHERE key = ?').run(key);
    }

    cleanup(): number {
        const cutoff = new Date();
        cutoff.setSeconds(cutoff.getSeconds() - this.ttl);

        const stmt = this.db.prepare('DELETE FROM llm_cache WHERE created_at < ?');
        const result = stmt.run(cutoff.toISOString());
        return result.changes;
    }

    getStats(): { entries: number; totalHits: number } {
        const stats = this.db.prepare('SELECT COUNT(*) as entries, SUM(hit_count) as totalHits FROM llm_cache').get() as any;
        return {
            entries: stats.entries || 0,
            totalHits: stats.totalHits || 0
        };
    }

    close(): void {
        this.db.close();
    }
}
