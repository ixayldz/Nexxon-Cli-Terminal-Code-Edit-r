// Embedding service using OpenAI API
export interface EmbeddingOptions {
    model?: string;
    apiKey?: string;
}

export interface EmbeddingResult {
    embedding: number[];
    tokens: number;
}

export class EmbeddingService {
    private apiKey: string;
    private model: string;
    private baseURL: string;

    constructor(options: EmbeddingOptions = {}) {
        this.apiKey = options.apiKey || process.env.OPENAI_API_KEY || '';
        this.model = options.model || 'text-embedding-3-small';
        this.baseURL = 'https://api.openai.com/v1';
    }

    async embed(text: string): Promise<EmbeddingResult> {
        if (!this.apiKey) {
            throw new Error('OpenAI API key not configured for embeddings');
        }

        const response = await fetch(`${this.baseURL}/embeddings`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.model,
                input: text
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI embedding API error: ${response.statusText}`);
        }

        const data = await response.json() as any;
        return {
            embedding: data.data[0].embedding,
            tokens: data.usage.total_tokens
        };
    }

    async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
        if (!this.apiKey) {
            throw new Error('OpenAI API key not configured for embeddings');
        }

        const response = await fetch(`${this.baseURL}/embeddings`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.model,
                input: texts
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI embedding API error: ${response.statusText}`);
        }

        const data = await response.json() as any;
        return data.data.map((item: any) => ({
            embedding: item.embedding,
            tokens: data.usage.total_tokens / texts.length
        }));
    }

    getDimensions(): number {
        // text-embedding-3-small uses 1536 dimensions
        return this.model === 'text-embedding-3-small' ? 1536 : 768;
    }
}
