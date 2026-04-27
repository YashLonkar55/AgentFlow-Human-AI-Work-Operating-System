import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateText } from 'ai';
import { openrouter } from '@/lib/ai';
import { withRetry } from '@/lib/retry';

const SYSTEM_PROMPT = `You are AgentFlow's coordination AI — an intelligent assistant
that helps users supervise, understand, and guide AI workflows in real time.

Be concise — 2-4 sentences max unless explaining something complex.
Sound like a smart colleague, not a formal assistant.

When modifying steps, include at the END:
MODIFY_STEP: {"stepId": "step_X", "title": "New title", "description": "New description"}
ADD_STEP: {"title": "Step title", "description": "Step description", "afterStepId": "step_X"}
SKIP_STEP: {"stepId": "step_X"}`;

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { message, workflow, chatHistory } = await req.json();
        if (!message?.trim()) {
            return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
        }

        const stepsSummary = workflow?.steps?.map((s: {
            id: string; title: string; status: string; output?: string;
        }) => {
            const preview = s.output ? ` | Output: ${s.output.slice(0, 100)}...` : '';
            return `  - [${s.id}] "${s.title}" — ${s.status}${preview}`;
        }).join('\n') ?? 'No steps yet';

        const workflowContext = workflow
            ? `WORKFLOW: "${workflow.goal}" | Status: ${workflow.status} | ${workflow.steps?.filter((s: { status: string }) => s.status === 'completed').length ?? 0}/${workflow.steps?.length ?? 0} done\nSteps:\n${stepsSummary}`
            : 'No active workflow.';

        const history = (chatHistory ?? []).slice(-8)
            .map((m: { role: string; content: string }) =>
                `${m.role === 'user' ? 'User' : 'Agent'}: ${m.content}`)
            .join('\n');

        const { text } = await withRetry(() =>
            generateText({
                model: openrouter('deepseek/deepseek-v3.2'),
                system: SYSTEM_PROMPT,
                prompt: `${workflowContext}\n\n${history ? `Recent:\n${history}\n` : ''}User: ${message}`,
                maxOutputTokens: 600,
            })
        );

        let cleanResponse = text;
        let command: { type: string; payload: Record<string, string> } | null = null;

        const modifyMatch = text.match(/MODIFY_STEP:\s*({[^}]+})/);
        const addMatch = text.match(/ADD_STEP:\s*({[^}]+})/);
        const skipMatch = text.match(/SKIP_STEP:\s*({[^}]+})/);

        try {
            if (modifyMatch) {
                command = { type: 'MODIFY_STEP', payload: JSON.parse(modifyMatch[1]) };
                cleanResponse = text.replace(/MODIFY_STEP:\s*{[^}]+}/, '').trim();
            } else if (addMatch) {
                command = { type: 'ADD_STEP', payload: JSON.parse(addMatch[1]) };
                cleanResponse = text.replace(/ADD_STEP:\s*{[^}]+}/, '').trim();
            } else if (skipMatch) {
                command = { type: 'SKIP_STEP', payload: JSON.parse(skipMatch[1]) };
                cleanResponse = text.replace(/SKIP_STEP:\s*{[^}]+}/, '').trim();
            }
        } catch { /* ignore parse errors */ }

        return NextResponse.json({ response: cleanResponse, command });

    } catch (err: unknown) {
        console.error('[/api/chat] error:', err instanceof Error ? err.message : err);
        return NextResponse.json(
            { error: 'Chat failed', response: 'Sorry, I ran into an error.' },
            { status: 500 },
        );
    }
}