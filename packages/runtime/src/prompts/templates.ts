// Plan generation prompt template

export function createPlanPrompt(task: string, context: string): string {
    return `You are an expert software engineer helping with code planning.

TASK: ${task}

CODE CONTEXT:
${context}

Generate a step-by-step plan to accomplish this task. Be specific and actionable.

Return your response as JSON in this exact format:
{
  "plan_steps": [
    "Step 1: Description of first step",
    "Step 2: Description of second step",
    ...
  ],
  "files_to_modify": ["path/to/file1.ts", "path/to/file2.ts"],
  "confidence": "high|medium|low"
}

Only respond with valid JSON, no additional text.`;
}

export function createCodePrompt(task: string, filePath: string, currentContent: string): string {
    return `You are an expert software engineer helping with code generation.

TASK: ${task}

FILE: ${filePath}

CURRENT CONTENT:
\`\`\`
${currentContent}
\`\`\`

Generate the COMPLETE updated file content to accomplish the task. 
Include ALL existing code that should remain unchanged.
Make only the necessary modifications.

Return ONLY the complete file content, no explanations, no markdown code blocks.`;
}
