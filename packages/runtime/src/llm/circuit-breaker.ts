// Circuit Breaker implementation for provider failure handling - PRD 7.2.6
export enum CircuitState {
    CLOSED = 'CLOSED',
    OPEN = 'OPEN',
    HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerConfig {
    failureThreshold: number;
    cooldownMs: number;
    halfOpenRequests: number;
}

export class CircuitBreaker {
    private state: CircuitState = CircuitState.CLOSED;
    private failures = 0;
    private successes = 0;
    private lastFailureTime: number | null = null;
    private halfOpenAttempts = 0;

    constructor(
        private providerName: string,
        private config: CircuitBreakerConfig = {
            failureThreshold: 5,
            cooldownMs: 60000, // 1 minute
            halfOpenRequests: 2
        }
    ) { }

    async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (this.state === CircuitState.OPEN) {
            if (this.shouldAttemptReset()) {
                this.state = CircuitState.HALF_OPEN;
                this.halfOpenAttempts = 0;
                console.log(`[CircuitBreaker] ${this.providerName}: Transitioning to HALF_OPEN`);
            } else {
                throw new Error(`Circuit breaker is OPEN for provider: ${this.providerName}`);
            }
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    private onSuccess(): void {
        this.failures = 0;

        if (this.state === CircuitState.HALF_OPEN) {
            this.successes++;
            if (this.successes >= this.config.halfOpenRequests) {
                this.state = CircuitState.CLOSED;
                this.successes = 0;
                console.log(`[CircuitBreaker] ${this.providerName}: Transitioned to CLOSED`);
            }
        }
    }

    private onFailure(): void {
        this.failures++;
        this.lastFailureTime = Date.now();

        if (this.state === CircuitState.HALF_OPEN) {
            this.state = CircuitState.OPEN;
            console.log(`[CircuitBreaker] ${this.providerName}: Transitioned back to OPEN`);
            return;
        }

        if (this.failures >= this.config.failureThreshold) {
            this.state = CircuitState.OPEN;
            console.log(`[CircuitBreaker] ${this.providerName}: Transitioned to OPEN (${this.failures} failures)`);
        }
    }

    private shouldAttemptReset(): boolean {
        if (this.lastFailureTime === null) return false;
        return Date.now() - this.lastFailureTime >= this.config.cooldownMs;
    }

    getState(): CircuitState {
        return this.state;
    }

    getMetrics() {
        return {
            state: this.state,
            failures: this.failures,
            successes: this.successes,
            lastFailureTime: this.lastFailureTime
        };
    }

    reset(): void {
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        this.successes = 0;
        this.halfOpenAttempts = 0;
        this.lastFailureTime = null;
    }
}
