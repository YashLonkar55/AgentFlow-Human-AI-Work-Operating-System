import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { planningModel } from '@/lib/ai';

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
    const { goal } = await req.json();

    if (!goal || typeof goal !== 'string' || goal.trim().length < 3) {
      return NextResponse.json(
        { error: 'Goal must be at least 3 characters.' },
        { status: 400 },
      );
    }

    const { text } = await generateText({
      model: planningModel,
      system: SYSTEM_PROMPT,
      prompt: `Goal: ${goal.trim()}`,
      maxTokens: 1024,
    });

    console.log('[/api/plan] raw response:', text);

    // Extract JSON array — handles any extra text Gemma adds around it
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new SyntaxError(`No JSON array found in response: ${text}`);
    }

    const steps = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(steps) || steps.length === 0) {
      throw new Error('Model returned empty or invalid steps array');
    }

    // Validate each step has required fields
    const validated = steps.map((s: { id?: string; title?: string; description?: string }, i: number) => ({
      id:          s.id          ?? `step_${i + 1}`,
      title:       s.title       ?? `Step ${i + 1}`,
      description: s.description ?? '',
    }));

    return NextResponse.json({ steps: validated });

  } catch (err: unknown) {
    console.error('[/api/plan] error:', err instanceof Error ? err.message : err);

    return NextResponse.json(
      {
        error: err instanceof SyntaxError
          ? 'AI returned a malformed plan — please try again.'
          : err instanceof Error
            ? err.message
            : 'Failed to generate plan.',
      },
      { status: 500 },
    );
  }
}