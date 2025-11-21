// Anthropic Claude provider
export interface AnthropicMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface AnthropicOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
}

import { ensureNetworkAllowed } from './provider.js';

export class AnthropicProvider {
    name = 'anthropic';
    private apiKey: string;
    private baseURL: string;

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || '';
        this.baseURL = 'https://api.anthropic.com/v1';
    }

    async complete(prompt: string, opts: AnthropicOptions = {}): Promise<string> {
        if (!this.apiKey) {
            throw new Error('Anthropic API key not configured');
        }

        const model = opts.model || 'claude-3-5-sonnet-20241022';
        const temperature = opts.temperature ?? 0.3;
        const maxTokens = opts.maxTokens || 4096;

        // Policy-aware: check outbound host
        ensureNetworkAllowed('api.anthropic.com');

        const response = await fetch(`${this.baseURL}/messages`, {
            method: 'POST',
            headers: {
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model,
                max_tokens: maxTokens,
                temperature,
                messages: [
                    { role: 'user', content: prompt }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`Anthropic API error: ${response.statusText}`);
        }

        const data = await response.json() as any;
        return data.content[0].text;
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
