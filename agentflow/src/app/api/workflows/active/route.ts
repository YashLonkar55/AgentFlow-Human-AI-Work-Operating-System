import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/* Returns the most recent completed workflow for the logged-in user */
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ workflow: null });

        const workflow = await prisma.workflow.findFirst({
            where: { userId, status: 'completed' },
            orderBy: { createdAt: 'desc' },
            include: {
                steps: {
                    orderBy: { position: 'asc' },
                },
                chatMessages: {
                    orderBy: { timestamp: 'asc' },
                },
            },
        });

        return NextResponse.json({ workflow });
    } catch (err) {
        console.error('[GET /api/workflows/active]', err);
        return NextResponse.json({ workflow: null });
    }
}