// Main vector search implementation
import { EmbeddingService } from './embedder.js';
import { VectorDB, type SearchResult } from './vectordb.js';
import fs from 'node:fs';

export interface ChunkOptions {
    maxChunkSize?: number;
    overlap?: number;
}

export interface IndexOptions {
    files: string[];
    chunkSize?: number;
}

export class VectorSearch {
    private embedder: EmbeddingService;
    private vectorDb: VectorDB;
    private maxChunkSize: number;

    constructor() {
        this.embedder = new EmbeddingService();
        this.vectorDb = new VectorDB(undefined, this.embedder.getDimensions());
        this.maxChunkSize = 500; // tokens
    }

    // Chunk text into smaller pieces
    private chunkText(text: string, maxLength: number = 500): string[] {
        const lines = text.split('\n');
        const chunks: string[] = [];
        let currentChunk: string[] = [];
        let currentLength = 0;

        for (const line of lines) {
            const lineLength = line.length;

            if (currentLength + lineLength > maxLength && currentChunk.length > 0) {
                chunks.push(currentChunk.join('\n'));
                currentChunk = [line];
                currentLength = lineLength;
            } else {
                currentChunk.push(line);
                currentLength += lineLength;
            }
        }

        if (currentChunk.length > 0) {
            chunks.push(currentChunk.join('\n'));
        }

        return chunks.length > 0 ? chunks : [text];
    }

    async indexFile(filePath: string): Promise<number> {
        // Delete existing vectors for this file
        await this.vectorDb.deleteByFile(filePath);

        // Read file
        const content = fs.readFileSync(filePath, 'utf8');

        // Chunk content
        const chunks = this.chunkText(content, this.maxChunkSize);

        // Generate embeddings
        const embeddings = await this.embedder.embedBatch(chunks);

        // Store in vector DB
        let count = 0;
        for (let i = 0; i < chunks.length; i++) {
            const chunkText = chunks[i] ?? '';
            const emb = embeddings[i]?.embedding ?? new Array(this.embedder.getDimensions()).fill(0);
            await this.vectorDb.insert({
                file_path: filePath,
                chunk_id: i,
                chunk_text: chunkText,
                embedding: emb
            });
            count++;
        }

        return count;
    }

    async indexFiles(files: string[]): Promise<{ indexed: number; chunks: number }> {
        let totalChunks = 0;

        for (const file of files) {
            try {
                const chunks = await this.indexFile(file);
                totalChunks += chunks;
            } catch (error) {
                console.error(`Failed to index ${file}:`, error);
            }
        }

        return {
            indexed: files.length,
            chunks: totalChunks
        };
    }

    async search(query: string, topK: number = 5): Promise<SearchResult[]> {
        // Generate query embedding
        const { embedding } = await this.embedder.embed(query);

        // Search vector DB
        return this.vectorDb.search(embedding, topK);
    }

    close(): void {
        this.vectorDb.close();
    }
}

export { type SearchResult } from './vectordb.js';
