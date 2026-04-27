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

        // Don't restore if there's already an active workflow in memory
        if (workflow && workflow.status !== 'idle') return;

        fetch('/api/workflows/active')
            .then(r => r.json())
            .then(data => {
                if (!data.workflow) return;
                const w = data.workflow;

                useAgentStore.setState({
                    workflow: {
                        id: w.id,
                        goal: w.goal,
                        status: 'completed',
                        executionMode: w.executionMode ?? 'auto',
                        finalOutput: w.finalOutput,
                        currentStepIndex: w.steps.length - 1,
                        createdAt: new Date(w.createdAt),
                        steps: w.steps
                            .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
                            .map((s: {
                                stepKey: string; title: string; description: string;
                                status: string; output?: string;
                                startedAt?: string; completedAt?: string;
                            }) => ({
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
                    chat: (w.chatMessages ?? []).map((m: {
                        id: string; role: string; content: string; timestamp: string;
                    }) => ({
                        id: m.id,
                        role: m.role as 'user' | 'assistant',
                        content: m.content,
                        timestamp: new Date(m.timestamp),
                    })),
                });
            })
            .catch(() => {
                // Silently fail — user just starts fresh
            });
    }, []);
}