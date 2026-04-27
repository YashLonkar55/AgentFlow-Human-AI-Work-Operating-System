import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const workflows = await prisma.workflow.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 30,
            select: {
                id: true,
                goal: true,
                status: true,
                executionMode: true,
                finalOutput: true,
                createdAt: true,
                steps: {
                    orderBy: { position: 'asc' },
                    select: {
                        id: true, stepKey: true, title: true,
                        description: true, status: true,
                        output: true, position: true,
                        startedAt: true, completedAt: true,
                    },
                },
                chatMessages: {
                    orderBy: { timestamp: 'asc' },
                    select: { id: true, role: true, content: true, timestamp: true },
                },
            },
        });

        return NextResponse.json({ workflows });
    } catch (err) {
        console.error('[GET /api/workflows]', err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { workflow, chatMessages } = await req.json();
        if (!workflow?.goal) {
            return NextResponse.json({ error: 'Invalid workflow data' }, { status: 400 });
        }

        /* Upsert by ID so we never duplicate */
        const saved = await prisma.workflow.upsert({
            where: { id: workflow.id ?? 'new' },
            update: {
                status: workflow.status,
                finalOutput: workflow.finalOutput ?? null,
                executionMode: workflow.executionMode ?? 'auto',
            },
            create: {
                id: workflow.id ?? undefined,
                userId,
                goal: workflow.goal,
                status: workflow.status ?? 'planning',
                executionMode: workflow.executionMode ?? 'auto',
                finalOutput: workflow.finalOutput ?? null,
                steps: {
                    create: (workflow.steps ?? []).map((s: {
                        id: string; title: string; description: string;
                        status: string; output?: string;
                        startedAt?: string; completedAt?: string;
                    }, i: number) => ({
                        stepKey: s.id,
                        title: s.title,
                        description: s.description,
                        status: s.status,
                        output: s.output ?? null,
                        position: i,
                        startedAt: s.startedAt ? new Date(s.startedAt) : null,
                        completedAt: s.completedAt ? new Date(s.completedAt) : null,
                    })),
                },
                chatMessages: {
                    create: (chatMessages ?? []).map((m: {
                        role: string; content: string; timestamp: string;
                    }) => ({
                        role: m.role,
                        content: m.content,
                        timestamp: new Date(m.timestamp),
                    })),
                },
            },
        });

        return NextResponse.json({ id: saved.id });
    } catch (err) {
        console.error('[POST /api/workflows]', err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}