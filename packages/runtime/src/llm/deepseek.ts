// DeepSeek provider for fast, cheap code generation
export interface DeepSeekOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
}

export class DeepSeekProvider {
    name = 'deepseek';
    private apiKey: string;
    private baseURL: string;

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.DEEPSEEK_API_KEY || '';
        this.baseURL = 'https://api.deepseek.com/v1';
    }

    async complete(prompt: string, opts: DeepSeekOptions = {}): Promise<string> {
        if (!this.apiKey) {
            throw new Error('DeepSeek API key not configured');
        }

        const model = opts.model || 'deepseek-coder';
        const temperature = opts.temperature ?? 0.2;
        const maxTokens = opts.maxTokens || 4096;

        // Policy-aware: check outbound host
        ensureNetworkAllowed('api.deepseek.com');

        const response = await fetch(`${this.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: prompt }],
                temperature,
                max_tokens: maxTokens
            })
        });

        if (!response.ok) {
            throw new Error(`DeepSeek API error: ${response.statusText}`);
        }

        const data = await response.json() as any;
        return data.choices[0]?.message?.content || '';
    }

    async healthCheck(): Promise<boolean> {
        try {
            await this.complete('test', { maxTokens: 5 });
            return true;
        } catch {
            return false;
        }
    }
}
import { ensureNetworkAllowed } from './provider.js';
