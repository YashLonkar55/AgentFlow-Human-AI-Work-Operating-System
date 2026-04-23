import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { openrouter } from '@/lib/ai';

const SYSTEM_PROMPT = `You are AgentFlow's execution AI.
You execute a single step of a larger workflow and produce real, useful output.

You MUST respond in this EXACT format — copy it exactly:

LOG: <what you are starting>
LOG: <progress update>
LOG: <another update>
LOG: <almost done>
OUTPUT_START
<your output here in clean markdown>
OUTPUT_END

MARKDOWN RULES for your output section:
- Use ## for main headings, ### for subheadings
- Use **bold** for key terms
- Use bullet lists (- item) for lists
- Use numbered lists (1. item) for steps
- Use > for key insights
- Minimum 150 words of actual useful content
- Be specific, concrete, and actionable

CRITICAL RULES:
- OUTPUT_START must be on its own line
- OUTPUT_END must be on its own line
- Everything between OUTPUT_START and OUTPUT_END is your actual output
- Do NOT add any text after OUTPUT_END`;

export async function POST(req: NextRequest) {
    try {
        const { goal, step, stepIndex, totalSteps, previousOutputs } = await req.json();

        const context = previousOutputs?.length > 0
            ? `\nContext from previous steps:\n${previousOutputs
                .map((p: { title: string; output: string }) => `[${p.title}]:\n${p.output}`)
                .join('\n\n')}`
            : '';

        const { text } = await generateText({
            model: openrouter('openai/gpt-oss-120b:free'),
            system: SYSTEM_PROMPT,
            prompt: `Overall goal: ${goal}

Executing step ${stepIndex + 1} of ${totalSteps}:
Title: ${step.title}
Description: ${step.description}
${context}

Execute this step now. Follow the format exactly with LOG lines then OUTPUT_START...OUTPUT_END.`,
            maxTokens: 1500,
        });

        console.log('[/api/execute] raw text:', text);

        return NextResponse.json({ text });

    } catch (err) {
        console.error('[/api/execute] error:', err);
        return NextResponse.json(
            { error: 'Execution failed', text: '' },
            { status: 500 },
        );
    }
}