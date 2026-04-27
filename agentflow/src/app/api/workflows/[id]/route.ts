import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/* PATCH — update workflow status/steps/output as it progresses */
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } },
) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { status, finalOutput, steps } = await req.json();
        const { id } = params;

        /* Verify ownership */
        const existing = await prisma.workflow.findFirst({
            where: { id, userId },
        });
        if (!existing) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        /* Update workflow status/output */
        await prisma.workflow.update({
            where: { id },
            data: {
                ...(status && { status }),
                ...(finalOutput && { finalOutput }),
            },
        });

        /* Update steps if provided */
        if (steps?.length) {
            for (const s of steps) {
                await prisma.step.updateMany({
                    where: { workflowId: id, stepKey: s.id },
                    data: {
                        status: s.status,
                        output: s.output ?? null,
                        startedAt: s.startedAt ? new Date(s.startedAt) : null,
                        completedAt: s.completedAt ? new Date(s.completedAt) : null,
                    },
                });
            }
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('[PATCH /api/workflows/[id]]', err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

/* DELETE — remove a workflow */
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } },
) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = params;

        await prisma.workflow.deleteMany({
            where: { id, userId },
        });

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('[DELETE /api/workflows/[id]]', err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}