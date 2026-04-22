'use client';

import { useRef, useCallback } from 'react';
import { useAgentStore } from '@/store/agentStore';
import { AgentStep } from '@/types/agent';

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function makeLog(message: string, level: 'info' | 'success' | 'warning' | 'error' = 'info') {
    return { id: crypto.randomUUID(), timestamp: new Date(), message, level };
}

/* Wait while paused — polls every 150ms */
function waitWhilePaused(pausedRef: React.MutableRefObject<boolean>, stoppedRef: React.MutableRefObject<boolean>) {
    return new Promise<void>(resolve => {
        const check = () => {
            if (stoppedRef.current || !pausedRef.current) resolve();
            else setTimeout(check, 150);
        };
        check();
    });
}

/* ─────────────────────────────────────────────
   Hook
───────────────────────────────────────────── */
export function useExecutionEngine() {
    const isRunningRef = useRef(false);
    const pausedRef = useRef(false);
    const stoppedRef = useRef(false);
    const abortRef = useRef<AbortController | null>(null);

    /* Always read fresh state from Zustand inside async functions */
    const gs = () => useAgentStore.getState();

    /* ── Execute a single step ── */
    const executeStep = useCallback(async (step: AgentStep, index: number): Promise<boolean> => {
        const { workflow, updateStep, addLog } = gs();
        if (!workflow) return false;

        updateStep(step.id, { status: 'running', startedAt: new Date() });
        addLog(step.id, makeLog(`Starting: ${step.title}`));

        try {
            abortRef.current = new AbortController();

            const previousOutputs = workflow.steps
                .slice(0, index)
                .filter(s => s.output)
                .map(s => ({ title: s.title, output: s.output }));

            const res = await fetch('/api/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    goal: workflow.goal,
                    step: { title: step.title, description: step.description },
                    stepIndex: index,
                    totalSteps: workflow.steps.length,
                    previousOutputs,
                }),
                signal: abortRef.current.signal,
            });

            if (!res.ok) throw new Error(`Server error ${res.status}`);
            if (!res.body) throw new Error('Empty response body');

            /* ── Stream parsing ── */
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let output = '';
            let inOutput = false;
            let rawText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                rawText += chunk;
                buffer += chunk;

                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';

                for (const line of lines) {
                    const t = line.trim();
                    if (!t) continue;

                    if (t.startsWith('LOG: ')) {
                        gs().addLog(step.id, makeLog(t.slice(5), 'info'));
                    } else if (t === 'OUTPUT_START') {
                        inOutput = true;
                    } else if (t === 'OUTPUT_END') {
                        inOutput = false;
                    } else if (inOutput) {
                        output += line + '\n';
                    }
                }
            }

            /* Handle leftover buffer */
            if (buffer.trim()) {
                if (inOutput) output += buffer + '\n';
            }

            /* Fallback — if model ignored our format, use raw text */
            if (!output.trim()) {
                output = rawText
                    .replace(/LOG:.*\n?/g, '')
                    .replace(/OUTPUT_START\n?/g, '')
                    .replace(/OUTPUT_END\n?/g, '')
                    .trim() || 'Step completed.';
            }

            gs().updateStep(step.id, {
                status: 'completed',
                output: output.trim(),
                completedAt: new Date(),
            });
            gs().addLog(step.id, makeLog('Completed successfully', 'success'));
            return true;

        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') {
                gs().updateStep(step.id, { status: 'pending' });
                return false;
            }
            gs().updateStep(step.id, { status: 'failed' });
            gs().addLog(step.id, makeLog(
                `Failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
                'error',
            ));
            return false;
        }
    }, []);

    /* ── Start execution loop ── */
    const start = useCallback(async () => {
        if (isRunningRef.current) return;

        const { workflow, setWorkflowStatus, setCurrentStep, setFinalOutput } = gs();
        if (!workflow || workflow.steps.length === 0) return;

        isRunningRef.current = true;
        pausedRef.current = false;
        stoppedRef.current = false;
        setWorkflowStatus('running');

        for (let i = 0; i < workflow.steps.length; i++) {
            if (stoppedRef.current) break;

            /* Wait if paused */
            await waitWhilePaused(pausedRef, stoppedRef);
            if (stoppedRef.current) break;

            /* Always read fresh step from store */
            const currentStep = gs().workflow!.steps[i];
            if (currentStep.status === 'completed' || currentStep.status === 'skipped') continue;

            setCurrentStep(i);
            const ok = await executeStep(currentStep, i);

            if (!ok && !pausedRef.current && !stoppedRef.current) {
                setWorkflowStatus('failed');
                isRunningRef.current = false;
                return;
            }

            /* Brief pause between steps */
            if (i < workflow.steps.length - 1 && !stoppedRef.current) {
                await new Promise(r => setTimeout(r, 700));
            }
        }

        if (!stoppedRef.current) {
            /* Assemble final output from all step outputs */
            const finalSteps = gs().workflow!.steps;
            const finalOutput = finalSteps
                .filter(s => s.output)
                .map(s => `## ${s.title}\n\n${s.output}`)
                .join('\n\n---\n\n');

            setFinalOutput(finalOutput);
            setWorkflowStatus('completed');
        }

        isRunningRef.current = false;
    }, [executeStep]);

    /* ── Pause ── */
    const pause = useCallback(() => {
        pausedRef.current = true;
        gs().setWorkflowStatus('paused');
    }, []);

    /* ── Resume ── */
    const resume = useCallback(() => {
        pausedRef.current = false;
        gs().setWorkflowStatus('running');
        /* The loop's waitWhilePaused will automatically unblock */
    }, []);

    /* ── Stop (reset to idle) ── */
    const stop = useCallback(() => {
        stoppedRef.current = true;
        isRunningRef.current = false;
        pausedRef.current = false;
        abortRef.current?.abort();
        gs().setWorkflowStatus('idle');
    }, []);

    /* ── Retry a failed step ── */
    const retryStep = useCallback(async (stepId: string) => {
        const { workflow, updateStep } = gs();
        if (!workflow) return;

        const index = workflow.steps.findIndex(s => s.id === stepId);
        if (index === -1) return;

        /* Reset the step */
        updateStep(stepId, {
            status: 'pending',
            logs: [],
            output: undefined,
        });

        const fresh = gs().workflow!.steps[index];
        await executeStep(fresh, index);
    }, [executeStep]);

    /* ── Skip a step ── */
    const skipStep = useCallback((stepId: string) => {
        gs().updateStep(stepId, { status: 'skipped', completedAt: new Date() });
        gs().addLog(stepId, makeLog('Skipped by user', 'warning'));
    }, []);

    return { start, pause, resume, stop, retryStep, skipStep };
}