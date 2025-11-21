// LLM Provider abstraction

export interface CompletionOptions {
    model?: string;
    temperature?: number;  // Not supported in GPT-5 family
    maxTokens?: number;
    timeout?: number;
    // GPT-5.1 specific options
    reasoning?: {
        effort?: 'none' | 'low' | 'medium' | 'high';
    };
    verbosity?: 'low' | 'medium' | 'high';
}

export interface LLMProvider {
    name: string;
    complete(prompt: string, opts?: CompletionOptions): Promise<string>;
    healthCheck(): Promise<boolean>;
}

// Policy enforcement helper (injected by runtime)
let networkGuard: ((host: string) => void) | null = null;
export function setNetworkGuard(fn: (host: string) => void) {
    networkGuard = fn;
}
export function ensureNetworkAllowed(host: string): void {
    if (networkGuard) networkGuard(host);
}

// OpenAI Provider implementation (GPT-5.1 with Responses API)
export class OpenAIProvider implements LLMProvider {
    name = 'openai';
    private apiKey: string;
    private baseURL: string;

    constructor(apiKey?: string, baseURL?: string) {
        this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
        this.baseURL = baseURL || 'https://api.openai.com/v1';
    }

    async complete(prompt: string, opts: CompletionOptions = {}): Promise<string> {
        const model = opts.model || 'gpt-5.1';  // GPT-5.1 flagship model
        const maxTokens = opts.maxTokens || 4096;

        // GPT-5.1 specific parameters
        const reasoningEffort = opts.reasoning?.effort || 'none';  // Default is 'none' for faster responses
        const verbosity = opts.verbosity || 'medium';  // Default verbosity

        ensureNetworkAllowed('api.openai.com');

        // Use Responses API for GPT-5.1 (not Chat Completions)
        const endpoint = model.startsWith('gpt-5') ? '/responses' : '/chat/completions';

        let requestBody: any;

        if (model.startsWith('gpt-5')) {
            // GPT-5.1 uses Responses API
            requestBody = {
                model,
                input: prompt,
                max_output_tokens: maxTokens,
                reasoning: {
                    effort: reasoningEffort
                },
                text: {
                    verbosity: verbosity
                }
            };
        } else {
            // Fallback to Chat Completions for older models
            requestBody = {
                model,
                messages: [{ role: 'user', content: prompt }],
                temperature: opts.temperature ?? 0.3,
                max_tokens: maxTokens
            };
        }

        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API error: ${response.statusText} - ${errorText}`);
        }

        const data = await response.json() as any;

        // Parse response based on API type
        if (model.startsWith('gpt-5')) {
            // Responses API returns output_text
            return data.output_text || data.text || '';
        } else {
            // Chat Completions API
            return data.choices[0]?.message?.content || '';
        }
    }

    async healthCheck(): Promise<boolean> {
        try {
            await this.complete('test', { maxTokens: 5, reasoning: { effort: 'none' } });
            return true;
        } catch {
            return false;
        }
    }
}

// Provider Registry
import { CircuitBreaker } from './circuit-breaker.js';
import { LocalLLMProvider } from './local-provider.js';

export class ProviderRegistry {
    private providers: Map<string, LLMProvider> = new Map();
    private circuitBreakers: Map<string, CircuitBreaker> = new Map();
    private defaultProvider: string | null = null;

    register(provider: LLMProvider, breakerConfig?: any): void {
        this.providers.set(provider.name, provider);
        this.circuitBreakers.set(provider.name, new CircuitBreaker(provider.name, breakerConfig));

        if (!this.defaultProvider) {
            this.defaultProvider = provider.name;
        }
    }

    getProvider(name: string): LLMProvider {
        const provider = this.providers.get(name);
        if (!provider) {
            throw new Error(`Provider not found: ${name}. Available: ${this.listProviders().join(', ')}`);
        }
        return provider;
    }

    async callWithCircuitBreaker<T>(providerName: string, fn: () => Promise<T>): Promise<T> {
        const breaker = this.circuitBreakers.get(providerName);
        if (!breaker) {
            throw new Error(`Circuit breaker not found for provider: ${providerName}`);
        }
        return breaker.execute(fn);
    }

    getDefault(): LLMProvider {
        if (!this.defaultProvider) {
            throw new Error('No providers registered. Please configure an LLM provider.');
        }
        return this.getProvider(this.defaultProvider);
    }

    setDefault(name: string): void {
        if (!this.providers.has(name)) {
            throw new Error(`Cannot set default: provider ${name} not registered`);
        }
        this.defaultProvider = name;
    }

    listProviders(): string[] {
        return Array.from(this.providers.keys());
    }

    hasProvider(name: string): boolean {
        return this.providers.has(name);
    }

    getProviderCount(): number {
        return this.providers.size;
    }

    getCircuitBreakerStatus(providerName: string) {
        return this.circuitBreakers.get(providerName)?.getMetrics();
    }

    getAllCircuitBreakerStatus() {
        const status: Record<string, any> = {};
        for (const [name, breaker] of this.circuitBreakers) {
            status[name] = breaker.getMetrics();
        }
        return status;
    }
}

// Singleton registry
export const registry = new ProviderRegistry();

// Simple mock provider for local/dev fallback
class MockProvider implements LLMProvider {
    name = 'mock';
    async complete(prompt: string): Promise<string> {
        // Produce minimal, deterministic output for planning/codegen
        if (/Generate a step-by-step plan/i.test(prompt)) {
            return JSON.stringify({
                plan_steps: [
                    'Understand the task and constraints',
                    'Locate relevant files',
                    'Apply small, safe code changes',
                    'Run tests and iterate'
                ],
                files_to_modify: [],
                confidence: 'low'
            });
        }
        // For code prompts, just echo content back (no changes)
        return '';
    }
    async healthCheck(): Promise<boolean> { return true; }
}

// Auto-register providers by environment
const haveOpenAI = !!process.env.OPENAI_API_KEY;
const haveAnthropic = !!process.env.ANTHROPIC_API_KEY;
const haveGemini = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

if (haveOpenAI) {
    registry.register(new OpenAIProvider());
}

if (haveAnthropic) {
    const { AnthropicProvider } = await import('./anthropic-provider.js');
    registry.register(new AnthropicProvider());
}

if (haveGemini) {
    const { GeminiProvider } = await import('./gemini-provider.js');
    registry.register(new GeminiProvider());
}

// Always register local provider as an option for on-device mode
registry.register(new LocalLLMProvider());

// If nothing configured, ensure a mock provider exists and is default
if (registry.getProviderCount() === 0) {
    registry.register(new MockProvider());
}
