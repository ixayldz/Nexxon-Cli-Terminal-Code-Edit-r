// Vector database using SQLite with VSS extension
import sqlite3 from 'sqlite3';
import path from 'node:path';
import fs from 'node:fs';

export interface VectorDocument {
    id?: number;
    file_path: string;
    chunk_id: number;
    chunk_text: string;
    embedding: number[];
}

export interface SearchResult {
    file_path: string;
    chunk_text: string;
    distance: number;
}

export class VectorDB {
    private db: sqlite3.Database;
    private dimensions: number;

    constructor(dbPath?: string, dimensions: number = 1536) {
        const vectorDbPath = dbPath || path.join(process.cwd(), '.nexxon', 'vectors.db');

        // Ensure directory exists
        const dir = path.dirname(vectorDbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        this.dimensions = dimensions;
        this.db = new sqlite3.Database(vectorDbPath);
        this.initSchema();
    }

    private initSchema(): void {
        // Create virtual table for vector search
        this.db.run(`
      CREATE VIRTUAL TABLE IF NOT EXISTS code_vectors USING vss0(
        embedding(${this.dimensions})
      )
    `);

        // Create metadata table
        this.db.run(`
      CREATE TABLE IF NOT EXISTS vector_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path TEXT NOT NULL,
        chunk_id INTEGER NOT NULL,
        chunk_text TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(file_path, chunk_id)
      )
    `);

        this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_file_path ON vector_metadata(file_path)
    `);
    }

    async insert(doc: VectorDocument): Promise<number> {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                // Insert metadata
                const metaStmt = this.db.prepare(`
          INSERT OR REPLACE INTO vector_metadata (file_path, chunk_id, chunk_text, created_at)
          VALUES (?, ?, ?, ?)
        `);

                const dbRef = this.db;
                metaStmt.run(
                    doc.file_path,
                    doc.chunk_id,
                    doc.chunk_text,
                    new Date().toISOString(),
                    function (this: any, err: any) {
                        if (err) {
                            reject(err);
                            return;
                        }

                        const rowid = this.lastID as number;

                        // Insert vector
                        const vectorStmt = dbRef.prepare(`
              INSERT INTO code_vectors(rowid, embedding)
              VALUES (?, ?)
            `);

                        const embeddingBlob = Buffer.from(new Float32Array(doc.embedding).buffer);

                        vectorStmt.run(rowid, embeddingBlob, (err: any) => {
                            if (err) reject(err);
                            else resolve(rowid);
                        });

                        vectorStmt.finalize();
                    }
                );

                metaStmt.finalize();
            });
        });
    }

    async search(queryEmbedding: number[], topK: number = 5): Promise<SearchResult[]> {
        return new Promise((resolve, reject) => {
            const embeddingBlob = Buffer.from(new Float32Array(queryEmbedding).buffer);

            const query = `
        SELECT 
          m.file_path,
          m.chunk_text,
          v.distance
        FROM code_vectors v
        INNER JOIN vector_metadata m ON v.rowid = m.id
        WHERE vss_search(v.embedding, ?)
        LIMIT ?
      `;

            this.db.all(query, [embeddingBlob, topK], (err, rows: any[]) => {
                if (err) {
                    reject(err);
                    return;
                }

                const results: SearchResult[] = rows.map(row => ({
                    file_path: row.file_path,
                    chunk_text: row.chunk_text,
                    distance: row.distance
                }));

                resolve(results);
            });
        });
    }

    async deleteByFile(filePath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                // Get rowids to delete
                this.db.all(
                    'SELECT id FROM vector_metadata WHERE file_path = ?',
                    [filePath],
                    (err, rows: any[]) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        if (rows.length === 0) {
                            resolve();
                            return;
                        }

                        const rowids = rows.map(r => r.id);
                        const placeholders = rowids.map(() => '?').join(',');

                        // Delete from both tables
                        this.db.run(`DELETE FROM code_vectors WHERE rowid IN (${placeholders})`, rowids);
                        this.db.run(`DELETE FROM vector_metadata WHERE id IN (${placeholders})`, rowids, (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    }
                );
            });
        });
    }

    close(): void {
        this.db.close();
    }
}
