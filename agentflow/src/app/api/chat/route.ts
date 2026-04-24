import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { openrouter } from '@/lib/ai';

const SYSTEM_PROMPT = `You are AgentFlow's coordination AI — an intelligent assistant
that helps users supervise, understand, and guide AI workflows in real time.

You have full visibility into:
- The user's original goal
- All planned steps and their current status
- Outputs produced so far
- The full conversation history

Your capabilities:
1. EXPLAIN — answer questions about what's happening, why, and what comes next
2. ADVISE — suggest improvements, flag issues, recommend changes
3. MODIFY — when user wants to change a step, respond with a special command

When the user wants to modify a step, include this at the END of your response:
MODIFY_STEP: {"stepId": "step_X", "title": "New title", "description": "New description"}

When the user wants to add a new step, include:
ADD_STEP: {"title": "Step title", "description": "Step description", "afterStepId": "step_X"}

When the user wants to skip a step, include:
SKIP_STEP: {"stepId": "step_X"}

Rules:
- Be concise — 2-4 sentences max unless explaining something complex
- Be direct and actionable
- Only include MODIFY_STEP / ADD_STEP / SKIP_STEP when the user explicitly asks for it
- Never include multiple commands in one response
- Sound like a smart colleague, not a formal assistant`;

export async function POST(req: NextRequest) {
    try {
        const { message, workflow, chatHistory } = await req.json();

        // Build workflow context
        const stepsSummary = workflow?.steps?.map((s: {
            id: string; title: string; status: string; output?: string;
        }) => {
            const outputPreview = s.output
                ? `\n   Output preview: ${s.output.slice(0, 150)}...`
                : '';
            return `  - [${s.id}] "${s.title}" — ${s.status}${outputPreview}`;
        }).join('\n') ?? 'No steps yet';

        const workflowContext = workflow ? `
CURRENT WORKFLOW STATE:
Goal: "${workflow.goal}"
Status: ${workflow.status}
Execution mode: ${workflow.executionMode ?? 'auto'}
Progress: ${workflow.steps?.filter((s: { status: string }) => s.status === 'completed').length ?? 0}/${workflow.steps?.length ?? 0} steps completed

Steps:
${stepsSummary}
` : 'No active workflow.';

        // Build message history for context
        const history = (chatHistory ?? []).slice(-10).map((m: {
            role: string; content: string;
        }) => `${m.role === 'user' ? 'User' : 'Agent'}: ${m.content}`).join('\n');

        const prompt = `${workflowContext}

${history ? `Recent conversation:\n${history}\n` : ''}
User: ${message}`;

        const { text } = await generateText({
            model: openrouter('openai/gpt-5-nano'),
            system: SYSTEM_PROMPT,
            prompt,
            maxTokens: 600,
        });

        // Parse any commands from the response
        let cleanResponse = text;
        let command: { type: string; payload: Record<string, string> } | null = null;

        const modifyMatch = text.match(/MODIFY_STEP:\s*({[^}]+})/);
        const addMatch = text.match(/ADD_STEP:\s*({[^}]+})/);
        const skipMatch = text.match(/SKIP_STEP:\s*({[^}]+})/);

        if (modifyMatch) {
            try {
                command = { type: 'MODIFY_STEP', payload: JSON.parse(modifyMatch[1]) };
                cleanResponse = text.replace(/MODIFY_STEP:\s*{[^}]+}/, '').trim();
            } catch { /* ignore parse error */ }
        } else if (addMatch) {
            try {
                command = { type: 'ADD_STEP', payload: JSON.parse(addMatch[1]) };
                cleanResponse = text.replace(/ADD_STEP:\s*{[^}]+}/, '').trim();
            } catch { /* ignore parse error */ }
        } else if (skipMatch) {
            try {
                command = { type: 'SKIP_STEP', payload: JSON.parse(skipMatch[1]) };
                cleanResponse = text.replace(/SKIP_STEP:\s*{[^}]+}/, '').trim();
            } catch { /* ignore parse error */ }
        }

        return NextResponse.json({ response: cleanResponse, command });

    } catch (err) {
        console.error('[/api/chat] error:', err);
        return NextResponse.json(
            { error: 'Chat failed', response: 'Sorry, I ran into an error. Please try again.' },
            { status: 500 },
        );
    }
}