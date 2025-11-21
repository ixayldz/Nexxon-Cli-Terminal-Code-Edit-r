// Local LLM Provider (Ollama integration)
import { LLMProvider, CompletionOptions } from './provider.js';

export class LocalLLMProvider implements LLMProvider {
    name = 'local';
    private baseURL: string;
    private defaultModel: string;

    constructor(baseURL?: string, defaultModel?: string) {
        this.baseURL = baseURL || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        this.defaultModel = defaultModel || process.env.LOCAL_MODEL || 'codellama';
    }

    async complete(prompt: string, opts: CompletionOptions = {}): Promise<string> {
        const model = opts.model || this.defaultModel;
        const temperature = opts.temperature ?? 0.3;

        // Local provider - no policy network check needed for localhost
        const response = await fetch(`${this.baseURL}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model,
                prompt,
                temperature,
                stream: false
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Local LLM error: ${response.statusText} - ${errorText}`);
        }

        const data = await response.json() as any;
        return data.response || '';
    }

    async healthCheck(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseURL}/api/tags`);
            return response.ok;
        } catch {
            return false;
        }
    }
}
