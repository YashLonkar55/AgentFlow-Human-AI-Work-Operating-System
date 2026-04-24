'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, Pause, Square, SkipForward,
    CheckCircle2, XCircle, Clock,
    Loader2, SkipForward as SkipIcon,
    GitBranch, Sparkles, FileText,
    ChevronDown,
} from 'lucide-react';
import { useAgentStore } from '@/store/agentStore';
import { useExecutionEngine } from '@/hooks/useExecutionEngine';
import { AgentStep, ExecutionMode, StepStatus } from '@/types/agent';
import StartExecutionModal from '@/components/layout/StartExecutionModal';
import ApprovalCard from '@/components/agent/ApprovalCard';
import { cn } from '@/lib/utils';

/* ── Status config ── */
const STATUS = {
    pending: {
        dot: 'bg-gray-300',
        text: 'text-gray-400',
        bar: 'bg-gray-200',
        label: 'Pending',
        icon: <Clock className="w-3 h-3" />,
    },
    running: {
        dot: 'bg-blue-400 animate-pulse',
        text: 'text-blue-600',
        bar: 'bg-gradient-to-r from-blue-400 to-violet-500',
        label: 'Running',
        icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    completed: {
        dot: 'bg-emerald-400',
        text: 'text-emerald-600',
        bar: 'bg-emerald-400',
        label: 'Done',
        icon: <CheckCircle2 className="w-3 h-3" />,
    },
    failed: {
        dot: 'bg-red-400',
        text: 'text-red-600',
        bar: 'bg-red-400',
        label: 'Failed',
        icon: <XCircle className="w-3 h-3" />,
    },
    skipped: {
        dot: 'bg-amber-400',
        text: 'text-amber-600',
        bar: 'bg-amber-400',
        label: 'Skipped',
        icon: <SkipIcon className="w-3 h-3" />,
    },
    awaiting_approval: {
        dot: 'bg-violet-400 animate-pulse',
        text: 'text-violet-600',
        bar: 'bg-violet-400',
        label: 'Review',
        icon: <CheckCircle2 className="w-3 h-3" />,
    },
    rejected: {
        dot: 'bg-red-400',
        text: 'text-red-600',
        bar: 'bg-red-400',
        label: 'Rejected',
        icon: <XCircle className="w-3 h-3" />,
    },
} as Record<StepStatus, {
    dot: string; text: string; bar: string; label: string; icon: React.ReactNode;
}>;

/* ── Compact step card ── */
function CompactStepCard({
    step, index, onRetry, onSkip,
}: {
    step: AgentStep;
    index: number;
    onRetry: () => void;
    onSkip: () => void;
}) {
    const [hovered, setHovered] = useState(false);
    const cfg = STATUS[step.status] ?? STATUS.pending;

    const isRunning = step.status === 'running';
    const isCompleted = step.status === 'completed';
    const isFailed = step.status === 'failed';
    const duration = step.startedAt && step.completedAt
        ? Math.round((new Date(step.completedAt).getTime() - new Date(step.startedAt).getTime()) / 1000)
        : null;

    return (
        <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            className={cn(
                'rounded-2xl transition-all duration-300 overflow-hidden',
                isRunning && 'border-spin',
                !isRunning && 'border border-black/[0.07]',
                isCompleted && 'step-glow-completed',
                isFailed && 'shadow-[0_0_0_1.5px_rgba(239,68,68,0.5),0_0_12px_rgba(239,68,68,0.15)]',
                'bg-white',
            )}
        >
            {/* Main row */}
            <div className="flex items-center gap-3 px-3.5 py-3">
                {/* Index + status icon */}
                <div className="relative flex-shrink-0">
                    <div className={cn(
                        'w-7 h-7 rounded-xl flex items-center justify-center',
                        isRunning ? 'bg-blue-50' :
                            isCompleted ? 'bg-emerald-50' :
                                isFailed ? 'bg-red-50' : 'bg-gray-50',
                    )}>
                        <span className={cn('', cfg.text)}>{cfg.icon}</span>
                    </div>
                </div>

                {/* Title + progress */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <span className={cn(
                            'text-xs font-bold truncate',
                            step.status === 'pending' ? 'text-gray-400' : 'text-gray-800',
                        )}>
                            {step.title}
                        </span>
                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                            {duration !== null && (
                                <span className="text-[10px] font-bold text-gray-400">{duration}s</span>
                            )}
                            <span className={cn(
                                'text-[10px] font-black uppercase tracking-wide',
                                cfg.text,
                            )}>
                                {cfg.label}
                            </span>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
                        <motion.div
                            className={cn('h-full rounded-full', cfg.bar)}
                            initial={{ width: 0 }}
                            animate={{
                                width: isCompleted || step.status === 'skipped' ? '100%'
                                    : isRunning ? '65%'
                                        : isFailed ? '100%'
                                            : '0%',
                            }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                    </div>
                </div>
            </div>

            {/* Hover expand — description + actions */}
            <AnimatePresence>
                {hovered && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden border-t border-black/[0.05]"
                    >
                        <div className="px-3.5 py-3 bg-gray-50/60">
                            <p className="text-[11px] text-gray-500 leading-relaxed font-medium mb-2.5">
                                {step.description}
                            </p>

                            {/* Output preview for completed */}
                            {isCompleted && step.output && (
                                <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-2.5 mb-2.5">
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1">
                                        Output preview
                                    </p>
                                    <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-3">
                                        {step.output.replace(/#{1,6}\s/g, '').replace(/\*\*/g, '').slice(0, 180)}…
                                    </p>
                                </div>
                            )}

                            {/* Running — latest log */}
                            {isRunning && step.logs.length > 0 && (
                                <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-2.5 mb-2.5">
                                    <p className="text-[11px] text-blue-600 font-medium">
                                        {step.logs[step.logs.length - 1]?.message}
                                    </p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-1.5">
                                {isFailed && (
                                    <button
                                        onClick={e => { e.stopPropagation(); onRetry(); }}
                                        className="text-[10px] font-black px-2.5 py-1.5 rounded-lg
                               bg-blue-50 border border-blue-200 text-blue-600
                               hover:bg-blue-100 transition-all uppercase tracking-wide"
                                    >
                                        Retry
                                    </button>
                                )}
                                {(step.status === 'pending' || isRunning) && (
                                    <button
                                        onClick={e => { e.stopPropagation(); onSkip(); }}
                                        className="text-[10px] font-black px-2.5 py-1.5 rounded-lg
                               bg-gray-100 border border-gray-200 text-gray-500
                               hover:bg-gray-200 transition-all uppercase tracking-wide"
                                    >
                                        Skip
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

/* ── Main panel ── */
export default function ExecutionPanel({
    onViewOutput, showOutputToggle,
}: {
    onViewOutput?: () => void;
    showOutputToggle?: boolean;
}) {
    const { workflow } = useAgentStore();
    const { start, pause, resume, stop, retryStep, skipStep } = useExecutionEngine();
    const [showModal, setShowModal] = useState(false);

    const steps = workflow?.steps ?? [];
    const status = workflow?.status ?? 'idle';
    const isRunning = status === 'running';
    const isPaused = status === 'paused';
    const isDone = status === 'completed';
    const isAwaiting = status === 'awaiting_approval';
    const done = steps.filter(s => s.status === 'completed').length;
    const pct = steps.length ? Math.round((done / steps.length) * 100) : 0;

    const awaitingStep = steps.find(s => s.status === 'awaiting_approval');

    const handleStart = (mode: ExecutionMode) => {
        setShowModal(false);
        start(mode);
    };

    return (
        <>
            <StartExecutionModal
                open={showModal}
                stepCount={steps.length}
                onStart={handleStart}
                onClose={() => setShowModal(false)}
            />

            <div
                className="flex flex-col h-full"
                style={{ background: 'rgba(255,255,255,0.80)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-4
                        border-b border-black/[0.06] flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-50 to-violet-50
                            border border-violet-100 flex items-center justify-center">
                            <GitBranch className="w-3 h-3 text-violet-500" />
                        </div>
                        <span className="text-xs font-bold text-gray-800">Steps</span>
                        {steps.length > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full
                               bg-violet-50 text-violet-500 border border-violet-100">
                                {done}/{steps.length}
                            </span>
                        )}
                    </div>

                    {/* Mode badge */}
                    {workflow?.executionMode && status !== 'idle' && (
                        <span className={cn(
                            'text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wide',
                            workflow.executionMode === 'auto'
                                ? 'bg-blue-50 text-blue-500 border-blue-200'
                                : 'bg-violet-50 text-violet-500 border-violet-200',
                        )}>
                            {workflow.executionMode}
                        </span>
                    )}
                </div>

                {/* Progress bar */}
                {steps.length > 0 && (
                    <div className="px-4 py-2.5 border-b border-black/[0.04] flex-shrink-0">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                Progress
                            </span>
                            <div className="flex items-center gap-2">
                                {isAwaiting && (
                                    <span className="text-[10px] font-black text-violet-500 animate-pulse">
                                        Awaiting approval
                                    </span>
                                )}
                                <span className="text-[10px] font-bold text-gray-500">{pct}%</span>
                            </div>
                        </div>
                        <div className="h-1 rounded-full bg-black/[0.05] overflow-hidden">
                            <motion.div
                                className={cn(
                                    'h-full rounded-full',
                                    isDone ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                                        : isAwaiting ? 'bg-gradient-to-r from-violet-400 to-purple-400'
                                            : 'bg-gradient-to-r from-blue-400 to-violet-500',
                                )}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                            />
                        </div>
                    </div>
                )}

                {/* Execution controls */}
                {steps.length > 0 && !isDone && (
                    <div className="px-4 py-2.5 border-b border-black/[0.04] flex gap-1.5 flex-shrink-0">
                        {/* Start */}
                        {status === 'idle' && (
                            <motion.button
                                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                onClick={() => setShowModal(true)}
                                className="flex-1 flex items-center justify-center gap-1.5 h-8
                           rounded-xl text-xs font-bold
                           bg-gradient-to-r from-blue-500 to-violet-600
                           text-white shadow-sm"
                            >
                                <Play className="w-3.5 h-3.5" />
                                Start
                            </motion.button>
                        )}

                        {/* Resume */}
                        {isPaused && (
                            <motion.button
                                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                onClick={resume}
                                className="flex-1 flex items-center justify-center gap-1.5 h-8
                           rounded-xl text-xs font-bold
                           bg-gradient-to-r from-blue-500 to-violet-600
                           text-white shadow-sm"
                            >
                                <Play className="w-3.5 h-3.5" />
                                Resume
                            </motion.button>
                        )}

                        {/* Pause */}
                        {isRunning && (
                            <motion.button
                                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                onClick={pause}
                                className="flex-1 flex items-center justify-center gap-1.5 h-8
                           rounded-xl text-xs font-bold
                           bg-amber-50 border border-amber-200 text-amber-600"
                            >
                                <Pause className="w-3.5 h-3.5" />
                                Pause
                            </motion.button>
                        )}

                        {/* Stop */}
                        {(isRunning || isPaused || isAwaiting) && (
                            <motion.button
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={stop}
                                className="w-8 h-8 rounded-xl flex items-center justify-center
                           bg-red-50 border border-red-200 text-red-500"
                            >
                                <Square className="w-3.5 h-3.5" />
                            </motion.button>
                        )}

                        {/* Skip current */}
                        {isRunning && (
                            <motion.button
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    const r = steps.find(s => s.status === 'running');
                                    if (r) skipStep(r.id);
                                }}
                                className="w-8 h-8 rounded-xl flex items-center justify-center
                           bg-white border border-black/[0.07] text-gray-400"
                            >
                                <SkipForward className="w-3.5 h-3.5" />
                            </motion.button>
                        )}
                    </div>
                )}

                {/* View Output button */}
                {showOutputToggle && onViewOutput && (
                    <div className="px-4 py-2.5 border-b border-black/[0.04] flex-shrink-0">
                        <motion.button
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={onViewOutput}
                            className="w-full flex items-center justify-center gap-2 h-8
                         rounded-xl text-xs font-bold
                         bg-gradient-to-r from-emerald-500 to-teal-500
                         text-white shadow-sm"
                        >
                            <FileText className="w-3.5 h-3.5" />
                            View Full Output
                        </motion.button>
                    </div>
                )}

                {/* Step list */}
                <div className="flex-1 overflow-y-auto px-3 py-3">
                    <AnimatePresence mode="popLayout">

                        {steps.length === 0 ? (
                            <EmptySteps key="empty" hasWorkflow={!!workflow} />
                        ) : (
                            <div className="flex flex-col gap-2">

                                {/* Approval card */}
                                {isAwaiting && awaitingStep && (
                                    <motion.div
                                        key="approval"
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-1"
                                    >
                                        <ApprovalCard
                                            stepTitle={awaitingStep.title}
                                            output={awaitingStep.output ?? ''}
                                            onApprove={() => useAgentStore.getState().approveStep(awaitingStep.id)}
                                            onReject={fb => useAgentStore.getState().rejectStep(awaitingStep.id, fb)}
                                        />
                                    </motion.div>
                                )}

                                {/* Step cards */}
                                {steps.map((step, i) => (
                                    <CompactStepCard
                                        key={step.id}
                                        step={step}
                                        index={i}
                                        onRetry={() => retryStep(step.id)}
                                        onSkip={() => skipStep(step.id)}
                                    />
                                ))}

                                {/* Completion banner */}
                                {isDone && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-2 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50
                               border border-emerald-200 p-4 text-center"
                                    >
                                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                                        <p className="text-xs font-bold text-emerald-700">All steps done!</p>
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
}

function EmptySteps({ hasWorkflow }: { hasWorkflow: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh]
                    text-center px-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50
                      border border-violet-100 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5 text-violet-400" />
            </div>
            <p className="text-xs font-bold text-gray-600 mb-1.5">
                {hasWorkflow ? 'Planning steps…' : 'No steps yet'}
            </p>
            <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                {hasWorkflow
                    ? 'AI is building your workflow'
                    : 'Enter a goal and hit Run Agent'
                }
            </p>
        </div>
    );
}