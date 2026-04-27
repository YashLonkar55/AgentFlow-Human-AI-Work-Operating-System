import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateText } from 'ai';
import { openrouter } from '@/lib/ai';
import { withRetry } from '@/lib/retry';
import { validateGoal } from '@/lib/env';

const SYSTEM_PROMPT = `You are AgentFlow's task planning AI.
Given a user's goal, break it into 4–7 clear, actionable steps.

Respond ONLY with a valid JSON array. No markdown fences, no explanation, no preamble.
Each step must follow this exact schema:
{
  "id": "step_1",
  "title": "Short action title (max 6 words)",
  "description": "One or two sentences describing what this step does and why."
}

Rules:
- 4 steps minimum, 7 maximum
- Titles must be action-oriented (start with a verb)
- Descriptions must be concrete, not vague
- IDs must be step_1, step_2, step_3 ... in order
- Output raw JSON only — no backtick wrapper of any kind`;

export async function POST(req: NextRequest) {
  try {
    /* Auth check */
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const goal = validateGoal(body.goal);

    const { text } = await withRetry(() =>
      generateText({
        model: openrouter('deepseek/deepseek-v3.2'),
        system: SYSTEM_PROMPT,
        prompt: `Goal: ${goal}`,
        maxTokens: 1024,
      })
    );

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new SyntaxError('No JSON array found in response');

    const steps = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(steps) || steps.length === 0) {
      throw new Error('Model returned empty steps');
    }

    const validated = steps.map((s: {
      id?: string; title?: string; description?: string;
    }, i: number) => ({
      id: s.id ?? `step_${i + 1}`,
      title: s.title ?? `Step ${i + 1}`,
      description: s.description ?? '',
    }));

    return NextResponse.json({ steps: validated });

  } catch (err: unknown) {
    console.error('[/api/plan] error:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate plan.' },
      { status: 500 },
    );
  }
}