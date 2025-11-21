// Google Gemini LLM Provider implementation
import { LLMProvider, CompletionOptions, ensureNetworkAllowed } from './provider.js';

export class GeminiProvider implements LLMProvider {
    name = 'gemini';
    private apiKey: string;
    private baseURL: string;

    constructor(apiKey?: string, baseURL?: string) {
        this.apiKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
        this.baseURL = baseURL || 'https://generativelanguage.googleapis.com/v1beta';
    }

    async complete(prompt: string, opts: CompletionOptions = {}): Promise<string> {
        const model = opts.model || 'gemini-3-pro';  // Gemini 3.0 Pro
        const temperature = opts.temperature ?? 0.3;
        const maxTokens = opts.maxTokens || 4096;

        // Policy-aware: check outbound host
        ensureNetworkAllowed('generativelanguage.googleapis.com');

        const response = await fetch(`${this.baseURL}/models/${model}:generateContent?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature,
                    maxOutputTokens: maxTokens,
                    candidateCount: 1
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API error: ${response.statusText} - ${errorText}`);
        }

        const data = await response.json() as any;
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
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
