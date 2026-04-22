import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { openrouter } from '@/lib/ai';

const SYSTEM_PROMPT = `You are AgentFlow's execution AI.
You execute a single step of a larger workflow and produce real, useful output.

You MUST respond in this EXACT format — no deviations:

LOG: <what you are starting to do>
LOG: <a progress update>
LOG: <another update>
LOG: <almost done>
OUTPUT_START
<your detailed, useful output for this step>
OUTPUT_END

Rules:
- Exactly 4 LOG lines, each under 10 words
- OUTPUT_START and OUTPUT_END must be on their own lines
- Output must be the actual deliverable — specific, detailed, and useful
- Use previous step outputs as context to build on`;

export async function POST(req: NextRequest) {
    try {
        const { goal, step, stepIndex, totalSteps, previousOutputs } = await req.json();

        const context = previousOutputs?.length > 0
            ? `\nContext from previous steps:\n${previousOutputs
                .map((p: { title: string; output: string }) => `[${p.title}]:\n${p.output}`)
                .join('\n\n')}`
            : '';

        const result = streamText({
            model: openrouter('openai/gpt-5-nano'),
            system: SYSTEM_PROMPT,
            prompt: `Overall goal: ${goal}

Now executing step ${stepIndex + 1} of ${totalSteps}:
Title: ${step.title}
Description: ${step.description}
${context}

Execute this step now and produce real output.`,
            maxTokens: 1500,
        });

        return result.toTextStreamResponse();

    } catch (err) {
        console.error('[/api/execute] error:', err);
        return new Response(
            JSON.stringify({ error: 'Execution failed' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
    }
}