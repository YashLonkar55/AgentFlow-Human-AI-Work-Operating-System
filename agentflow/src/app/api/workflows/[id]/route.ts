import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { status, finalOutput, steps } = await req.json();
        const { id } = await params;

        /* Verify ownership */
        const existing = await prisma.workflow.findFirst({ where: { id, userId } });
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        /* Update workflow */
        await prisma.workflow.update({
            where: { id },
            data: {
                ...(status !== undefined && { status }),
                ...(finalOutput !== undefined && { finalOutput }),
            },
        });

        /* Upsert steps — delete old ones and recreate */
        if (steps?.length) {
            await prisma.step.deleteMany({ where: { workflowId: id } });
            await prisma.step.createMany({
                data: steps.map((s: {
                    id: string; title: string; description: string;
                    status: string; output?: string;
                    startedAt?: string; completedAt?: string;
                }, i: number) => ({
                    workflowId: id,
                    stepKey: s.id,
                    title: s.title,
                    description: s.description,
                    status: s.status,
                    output: s.output ?? null,
                    position: i,
                    startedAt: s.startedAt ? new Date(s.startedAt) : null,
                    completedAt: s.completedAt ? new Date(s.completedAt) : null,
                })),
            });
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('[PATCH /api/workflows/[id]]', err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        await prisma.workflow.deleteMany({ where: { id, userId } });
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('[DELETE /api/workflows/[id]]', err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}