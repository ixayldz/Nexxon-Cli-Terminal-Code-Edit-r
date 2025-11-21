// Anthropic (Claude) LLM Provider implementation
import { LLMProvider, CompletionOptions, ensureNetworkAllowed } from './provider.js';

export class AnthropicProvider implements LLMProvider {
    name = 'anthropic';
    private apiKey: string;
    private baseURL: string;

    constructor(apiKey?: string, baseURL?: string) {
        this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || '';
        this.baseURL = baseURL || 'https://api.anthropic.com/v1';
    }

    async complete(prompt: string, opts: CompletionOptions = {}): Promise<string> {
        const model = opts.model || 'claude-4-5-sonnet-20250514';  // Claude 4.5 Sonnet
        const temperature = opts.temperature ?? 0.3;
        const maxTokens = opts.maxTokens || 4096;

        // Policy-aware: check outbound host
        ensureNetworkAllowed('api.anthropic.com');

        const response = await fetch(`${this.baseURL}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
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
            throw new Error(`Anthropic API error: ${response.statusText} - ${errorText}`);
        }

        const data = await response.json() as any;
        return data.content[0]?.text || '';
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
