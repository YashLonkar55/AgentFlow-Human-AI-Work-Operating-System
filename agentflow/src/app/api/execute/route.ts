import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateText } from 'ai';
import { openrouter } from '@/lib/ai';
import { withRetry } from '@/lib/retry';

const SYSTEM_PROMPT = `You are an AI execution agent. Execute the given task step and produce detailed, useful output.

Format your response EXACTLY like this:

LOG: Starting task
LOG: Processing information
LOG: Generating output
LOG: Finalizing results
OUTPUT_START
[Your detailed markdown output here]
OUTPUT_END

Use markdown formatting in your output: ## headings, **bold**, bullet points, numbered lists.`;

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { goal, step, stepIndex, totalSteps, previousOutputs, userFeedback } = await req.json();

        if (!goal || !step) {
            return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
        }

        const context = previousOutputs?.length > 0
            ? `Previous work:\n${previousOutputs
                .map((p: { title: string; output: string }) => `${p.title}: ${p.output?.slice(0, 300)}`)
                .join('\n')}`
            : '';

        const feedbackLine = userFeedback
            ? `\nUser feedback on previous attempt: ${userFeedback}`
            : '';

        const { text } = await withRetry(() =>
            generateText({
                model: openrouter('deepseek/deepseek-v3.2'),
                system: SYSTEM_PROMPT,
                prompt: `Goal: ${goal}\nStep ${stepIndex + 1}/${totalSteps}: ${step.title}\nWhat to do: ${step.description}\n${context}${feedbackLine}\n\nExecute this step now.`,
                maxOutputTokens: 1500,
            }),
            { maxAttempts: 3, baseDelayMs: 2000 },
        );

        return NextResponse.json({ text });

    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Execution failed';
        console.error('[/api/execute] error:', msg);
        return NextResponse.json({ error: msg, text: '' }, { status: 500 });
    }
}