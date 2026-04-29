'use client';

import { useRef, useCallback } from 'react';
import { useAgentStore } from '@/store/agentStore';
import { AgentStep, ExecutionMode } from '@/types/agent';

function makeLog(message: string, level: 'info' | 'success' | 'warning' | 'error' = 'info') {
    return { id: crypto.randomUUID(), timestamp: new Date(), message, level };
}

/* Poll until condition is true */
function waitUntil(
    condition: () => boolean,
    stopped: React.MutableRefObject<boolean>,
    intervalMs = 200,
): Promise<void> {
    return new Promise(resolve => {
        const check = () => {
            if (stopped.current || condition()) resolve();
            else setTimeout(check, intervalMs);
        };
        check();
    });
}

function waitWhilePaused(
    paused: React.MutableRefObject<boolean>,
    stopped: React.MutableRefObject<boolean>,
): Promise<void> {
    return waitUntil(() => !paused.current, stopped);
}

export function useExecutionEngine() {
    const isRunningRef = useRef(false);
    const pausedRef = useRef(false);
    const stoppedRef = useRef(false);
    const abortRef = useRef<AbortController | null>(null);

    const gs = () => useAgentStore.getState();

    /* ── Helper: sync current workflow state to DB ── */
    const syncToDB = useCallback((extras?: { status?: string; finalOutput?: string }) => {
        const w = gs().workflow;
        if (!w) return;
        fetch(`/api/workflows/${w.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ steps: w.steps, ...extras }),
        }).catch(err => console.error('[engine] DB sync failed:', err));
    }, []);

    /* ── Execute one step ── */
    const executeStep = useCallback(async (
        step: AgentStep,
        index: number,
        userFeedback?: string,
    ): Promise<boolean> => {
        const { workflow, updateStep, addLog } = gs();
        if (!workflow) return false;

        updateStep(step.id, { status: 'running', startedAt: new Date(), logs: [], output: undefined });
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
                    userFeedback,   // pass rejection feedback if rerunnning
                }),
                signal: abortRef.current.signal,
            });

            if (!res.ok) throw new Error(`Server error ${res.status}`);

            const data = await res.json();
            const rawText: string = data.text ?? '';

            /* Parse logs */
            const logLines = rawText.match(/^LOG:\s*(.+)$/gm) ?? [];
            for (const line of logLines) {
                const msg = line.replace(/^LOG:\s*/, '').trim();
                if (msg) gs().addLog(step.id, makeLog(msg, 'info'));
                await new Promise(r => setTimeout(r, 250));
            }

            /* Extract output */
            let output = '';
            const strict = rawText.match(/OUTPUT_START\r?\n([\s\S]*?)\r?\nOUTPUT_END/);
            if (strict) output = strict[1].trim();

            if (!output) {
                const loose = rawText.match(/OUTPUT_START([\s\S]*?)OUTPUT_END/);
                if (loose) output = loose[1].trim();
            }

            if (!output) {
                output = rawText
                    .split('\n')
                    .filter(l => {
                        const t = l.trim();
                        return t && !t.startsWith('LOG:') && t !== 'OUTPUT_START' && t !== 'OUTPUT_END';
                    })
                    .join('\n')
                    .trim();
            }

            if (!output) output = rawText.trim() || 'Step completed.';

            /* In review mode — mark as awaiting approval instead of completed */
            const mode = gs().executionMode;
            if (mode === 'review') {
                gs().updateStep(step.id, {
                    status: 'awaiting_approval',
                    output,
                });
                gs().setWorkflowStatus('awaiting_approval');
                syncToDB({ status: 'awaiting_approval' });
            } else {
                gs().updateStep(step.id, {
                    status: 'completed',
                    output,
                    completedAt: new Date(),
                });
                gs().addLog(step.id, makeLog('Completed successfully', 'success'));
                syncToDB();

                return true;
            }

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
    }, [syncToDB]);

    /* ── Main execution loop ── */
    const start = useCallback(async (mode: ExecutionMode) => {
        if (isRunningRef.current) return;

        const { workflow, setWorkflowStatus, setCurrentStep,
            setFinalOutput, setExecutionMode } = gs();
        if (!workflow || workflow.steps.length === 0) return;

        isRunningRef.current = true;
        pausedRef.current = false;
        stoppedRef.current = false;

        setExecutionMode(mode);
        setWorkflowStatus('running');

        for (let i = 0; i < workflow.steps.length; i++) {
            if (stoppedRef.current) break;

            await waitWhilePaused(pausedRef, stoppedRef);
            if (stoppedRef.current) break;

            const currentStep = gs().workflow!.steps[i];
            if (currentStep.status === 'completed' || currentStep.status === 'skipped') continue;

            setCurrentStep(i);

            const ok = await executeStep(currentStep, i);
            if (!ok && !stoppedRef.current) {
                setWorkflowStatus('failed');
                isRunningRef.current = false;
                return;
            }

            /* Review mode — wait for user approval */
            if (mode === 'review' && !stoppedRef.current) {
                await waitUntil(() => {
                    const s = gs().workflow?.steps[i];
                    return s?.status === 'completed' || s?.status === 'skipped';
                }, stoppedRef);

                /* If rejected — rerun same step */
                const afterApproval = gs().workflow?.steps[i];
                if (afterApproval?.status === 'pending') {
                    i--; // rerun this index
                    continue;
                }

                if (stoppedRef.current) break;
                syncToDB();
                gs().setWorkflowStatus('running');
            }

            if (i < workflow.steps.length - 1 && !stoppedRef.current) {
                await new Promise(r => setTimeout(r, 600));
            }
        }

        if (!stoppedRef.current) {
            const finalSteps = gs().workflow!.steps;
            const finalOutput = finalSteps
                .filter(s => s.output)
                .map(s => `## ${s.title}\n\n${s.output}`)
                .join('\n\n---\n\n');


            setFinalOutput(finalOutput);
            setWorkflowStatus('completed');
            syncToDB({ status: 'completed', finalOutput });
            console.log('[engine] workflow completed — synced to DB');
        }

        isRunningRef.current = false;
    }, [executeStep, syncToDB]);

    const pause = useCallback(() => {
        pausedRef.current = true;
        gs().setWorkflowStatus('paused');
    }, []);

    const resume = useCallback(() => {
        pausedRef.current = false;
        gs().setWorkflowStatus('running');
    }, []);

    const stop = useCallback(() => {
        stoppedRef.current = true;
        isRunningRef.current = false;
        pausedRef.current = false;
        abortRef.current?.abort();
        gs().setWorkflowStatus('idle');
    }, []);

    const retryStep = useCallback(async (stepId: string) => {
        const { workflow, updateStep } = gs();
        if (!workflow) return;
        const index = workflow.steps.findIndex(s => s.id === stepId);
        if (index === -1) return;
        updateStep(stepId, { status: 'pending', logs: [], output: undefined });
        const fresh = gs().workflow!.steps[index];
        await executeStep(fresh, index);
    }, [executeStep]);

    const skipStep = useCallback((stepId: string) => {
        gs().updateStep(stepId, { status: 'skipped', completedAt: new Date() });
        gs().addLog(stepId, makeLog('Skipped by user', 'warning'));
        /* Unblock review mode wait if active */
        if (gs().workflow?.status === 'awaiting_approval') {
            gs().setWorkflowStatus('running');
        }
    }, []);

    return { start, pause, resume, stop, retryStep, skipStep };
}