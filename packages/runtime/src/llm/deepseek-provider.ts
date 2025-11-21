// DeepSeek LLM Provider implementation (OpenAI-compatible API)
import { LLMProvider, CompletionOptions, ensureNetworkAllowed } from './provider.js';

export class DeepSeekProvider implements LLMProvider {
    name = 'deepseek';
    private apiKey: string;
    private baseURL: string;

    constructor(apiKey?: string, baseURL?: string) {
        this.apiKey = apiKey || process.env.DEEPSEEK_API_KEY || '';
        this.baseURL = baseURL || 'https://api.deepseek.com/v1';
    }

    async complete(prompt: string, opts: CompletionOptions = {}): Promise<string> {
        const model = opts.model || 'deepseek-chat';
        const temperature = opts.temperature ?? 0.3;
        const maxTokens = opts.maxTokens || 4096;

        // Policy-aware: check outbound host
        ensureNetworkAllowed('api.deepseek.com');

        const response = await fetch(`${this.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: prompt }],
                temperature,
                max_tokens: maxTokens
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`DeepSeek API error: ${response.statusText} - ${errorText}`);
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
