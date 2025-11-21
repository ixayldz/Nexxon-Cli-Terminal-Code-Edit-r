// Plan handler implementation
import type { RequestEnvelope, ResponseEnvelope } from '@nexxon/shared/src/types.js';
import { registry } from '../llm/provider.js';
import { createPlanPrompt } from '../prompts/templates.js';
import { ContextManager } from '../context/manager.js';
import { NexxonErrorClass, ERROR_CODES } from '../shared.js';

export async function handlePlan(req: RequestEnvelope): Promise<ResponseEnvelope> {
    const start = Date.now();
    const task = req.args.task as string;
    const model = req.args.model as string | undefined;

    if (!task) {
        throw new NexxonErrorClass(
            ERROR_CODES.INVALID_ARGS,
            'generic',
            'Task description is required',
            req.command,
            req.args,
            { missing: ['task'] }
        );
    }

    try {
        // Build context for the planning task
        const contextManager = new ContextManager();
        const context = await contextManager.buildContext(task, []);

        // Get LLM provider
        const provider = model ? registry.getProvider(model) : registry.getDefault();

        // Create plan prompt
        const prompt = createPlanPrompt(task, context);

        // Call LLM to generate plan (with fallback)
        let response = '';
        try {
            response = await provider.complete(prompt, {
                temperature: 0.3,
                maxTokens: 4096
            });
        } catch (e) {
            // Fallback minimal JSON plan if provider fails
            response = JSON.stringify({
                plan_steps: [
                    'Analyze the task requirements',
                    'Identify files to change',
                    'Implement minimal solution',
                    'Run tests and validate'
                ],
                files_to_modify: [],
                confidence: 'low'
            });
        }

        // Parse JSON response
        let planResult;
        try {
            // Try to extract JSON from response (may have markdown code blocks)
            const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) ||
                response.match(/```\n([\s\S]*?)\n```/) ||
                [null, response];

            const jsonStr = jsonMatch[1] || response;
            planResult = JSON.parse(jsonStr.trim());

            // Validate required fields
            if (!planResult.plan_steps || !Array.isArray(planResult.plan_steps)) {
                throw new Error('Invalid plan format: missing plan_steps array');
            }

        } catch (parseError) {
            // Fallback: if JSON parsing fails, create a basic plan structure
            console.warn('Failed to parse LLM response as JSON:', parseError);
            planResult = {
                plan_steps: [
                    'Step 1: Analyze the task requirements',
                    'Step 2: Identify files that need modification',
                    'Step 3: Implement changes incrementally',
                    'Step 4: Test the changes'
                ],
                files_to_modify: [],
                confidence: 'low',
                note: 'Plan generated with fallback due to JSON parsing error',
                raw_response: response.slice(0, 500) // Include truncated response for debugging
            };
        }

        return {
            api_version: '1.0',
            id: req.id,
            status: 'ok',
            result: planResult,
            metrics: { latency_ms: Date.now() - start }
        };
    } catch (error) {
        if (error instanceof NexxonErrorClass) throw error;

        throw new NexxonErrorClass(
            ERROR_CODES.LLM_ERROR,
            'provider',
            error instanceof Error ? error.message : 'Unknown error',
            req.command,
            req.args
        );
    }
}
