'use client';

import { useEffect, useRef } from 'react';
import { useAgentStore } from '@/store/agentStore';
import { StepStatus } from '@/types/agent';

export function useRestoreWorkflow() {
    const restored = useRef(false);

    useEffect(() => {
        if (restored.current) return;
        restored.current = true;

        const { workflow } = useAgentStore.getState();

        // If there's already a workflow in memory with steps, don't overwrite
        if (workflow?.steps && workflow.steps.length > 0) return;

        fetch('/api/workflows/active')
            .then(r => r.json())
            .then(data => {
                if (!data.workflow) return;

                // Check again — user might have clicked history while fetching
                const current = useAgentStore.getState().workflow;
                if (current?.steps && current.steps.length > 0) return;

                const w = data.workflow;
                restoreWorkflowToStore(w);
            })
            .catch(() => { });
    }, []);
}

export function restoreWorkflowToStore(w: {
    id: string;
    goal: string;
    status: string;
    executionMode: string;
    finalOutput?: string;
    createdAt: string;
    steps: {
        stepKey: string; title: string; description: string;
        status: string; output?: string; position: number;
        startedAt?: string; completedAt?: string;
    }[];
    chatMessages: {
        id: string; role: string; content: string; timestamp: string;
    }[];
}) {
    const sortedSteps = [...w.steps].sort((a, b) => a.position - b.position);

    /* Rebuild finalOutput from steps if not stored */
    const finalOutput = w.finalOutput ||
        sortedSteps
            .filter(s => s.output)
            .map(s => `## ${s.title}\n\n${s.output}`)
            .join('\n\n---\n\n');

    useAgentStore.setState({
        workflow: {
            id: w.id,
            goal: w.goal,
            status: 'completed',
            executionMode: (w.executionMode as 'auto' | 'review') ?? 'auto',
            finalOutput: finalOutput || undefined,
            currentStepIndex: sortedSteps.length - 1,
            createdAt: new Date(w.createdAt),
            steps: sortedSteps.map(s => ({
                id: s.stepKey,
                title: s.title,
                description: s.description,
                status: s.status as StepStatus,
                logs: [],
                output: s.output,
                startedAt: s.startedAt ? new Date(s.startedAt) : undefined,
                completedAt: s.completedAt ? new Date(s.completedAt) : undefined,
            })),
        },
        chat: (w.chatMessages ?? []).map(m => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            timestamp: new Date(m.timestamp),
        })),
        isPlanning: false,
        planError: null,
    });
}