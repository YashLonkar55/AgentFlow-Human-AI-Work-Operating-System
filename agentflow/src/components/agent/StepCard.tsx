'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock, Loader2, CheckCircle2, XCircle,
    SkipForward, ChevronDown, RotateCcw, Edit2,
} from 'lucide-react';
import { AgentStep, StepStatus } from '@/types/agent';
import StepLogs from '@/components/agent/StepLogs';
import { cn } from '@/lib/utils';

interface StepCardProps {
    step: AgentStep;
    index: number;
    onRetry?: () => void;
    onSkip?: () => void;
}

const STATUS_CONFIG: Record<StepStatus, {
    icon: React.ReactNode;
    dot: string;
    card: string;
    border: string;
    badge: string;
    label: string;
}> = {
    pending: {
        icon: <Clock className="w-3.5 h-3.5 text-gray-400" />,
        dot: 'bg-gray-300',
        card: 'bg-white/70',
        border: 'border-black/[0.07]',
        badge: 'bg-gray-50 text-gray-400 border-gray-200',
        label: 'Pending',
    },
    running: {
        icon: <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />,
        dot: 'bg-blue-400 animate-pulse',
        card: 'bg-blue-50/70',
        border: 'border-blue-200',
        badge: 'bg-blue-50 text-blue-600 border-blue-200',
        label: 'Running',
    },
    completed: {
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
        dot: 'bg-emerald-400',
        card: 'bg-emerald-50/50',
        border: 'border-emerald-200',
        badge: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        label: 'Done',
    },
    failed: {
        icon: <XCircle className="w-3.5 h-3.5 text-red-500" />,
        dot: 'bg-red-400',
        card: 'bg-red-50/50',
        border: 'border-red-200',
        badge: 'bg-red-50 text-red-600 border-red-200',
        label: 'Failed',
    },
    skipped: {
        icon: <SkipForward className="w-3.5 h-3.5 text-amber-500" />,
        dot: 'bg-amber-400',
        card: 'bg-amber-50/50',
        border: 'border-amber-200',
        badge: 'bg-amber-50 text-amber-600 border-amber-200',
        label: 'Skipped',
    },
};

export default function StepCard({ step, index, onRetry, onSkip }: StepCardProps) {
    const [expanded, setExpanded] = useState(step.status === 'running');
    const cfg = STATUS_CONFIG[step.status];

    /* Auto-expand when step starts running */
    if (step.status === 'running' && !expanded) setExpanded(true);

    const duration = step.startedAt && step.completedAt
        ? Math.round((
            new Date(step.completedAt).getTime() -
            new Date(step.startedAt).getTime()
        ) / 1000)
        : null;

    return (
        <div className={cn(
            'rounded-2xl border transition-all duration-300 shadow-sm overflow-hidden',
            cfg.card,
            cfg.border,
            step.status === 'running' && 'running-pulse',
        )}>

            {/* Header */}
            <div
                className="flex items-center gap-3 px-4 py-3.5 cursor-pointer
                   select-none hover:brightness-[0.98] transition-all"
                onClick={() => setExpanded(!expanded)}
            >
                {/* Index */}
                <span className="text-[10px] font-black text-gray-300 font-mono w-5 text-center flex-shrink-0">
                    {String(index + 1).padStart(2, '0')}
                </span>

                {/* Status dot */}
                <span className={cn('w-2 h-2 rounded-full flex-shrink-0', cfg.dot)} />

                {/* Title */}
                <span className={cn(
                    'text-sm font-semibold flex-1 truncate',
                    step.status === 'pending' ? 'text-gray-400' : 'text-gray-800',
                )}>
                    {step.title}
                </span>

                {/* Right side */}
                <div className="flex items-center gap-2 flex-shrink-0">

                    {/* Duration badge for completed */}
                    {duration !== null && (
                        <span className="text-[10px] font-bold text-gray-400 hidden sm:inline">
                            {duration}s
                        </span>
                    )}

                    {/* Status badge */}
                    <span className={cn(
                        'text-[10px] font-black uppercase tracking-wider px-2 py-0.5',
                        'rounded-full border hidden sm:inline-flex',
                        cfg.badge,
                    )}>
                        {cfg.label}
                    </span>

                    {cfg.icon}

                    {/* Action buttons — HITL controls */}
                    {step.status === 'failed' && onRetry && (
                        <ActionBtn
                            icon={<RotateCcw className="w-3 h-3" />}
                            label="Retry step"
                            className="text-blue-500 hover:bg-blue-50"
                            onClick={onRetry}
                        />
                    )}
                    {step.status === 'pending' && onSkip && (
                        <ActionBtn
                            icon={<Edit2 className="w-3 h-3" />}
                            label="Skip step"
                            onClick={onSkip}
                        />
                    )}

                    <ChevronDown className={cn(
                        'w-3.5 h-3.5 text-gray-400 transition-transform duration-200',
                        expanded && 'rotate-180',
                    )} />
                </div>
            </div>

            {/* Expanded body */}
            <AnimatePresence initial={false}>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 border-t border-black/[0.05]">

                            {/* Description */}
                            <p className="text-xs text-gray-500 leading-relaxed mt-3 mb-3 font-medium">
                                {step.description}
                            </p>

                            {/* Logs */}
                            {step.logs.length > 0 && (
                                <StepLogs
                                    logs={step.logs}
                                    isRunning={step.status === 'running'}
                                />
                            )}

                            {/* Output preview for completed steps */}
                            {step.status === 'completed' && step.output && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-3 rounded-xl border border-emerald-200
                             bg-emerald-50/60 p-3"
                                >
                                    <p className="text-[10px] font-black text-emerald-600
                                uppercase tracking-widest mb-1.5">
                                        Output
                                    </p>
                                    <p className="text-xs text-gray-600 leading-relaxed
                                line-clamp-4 font-medium">
                                        {step.output}
                                    </p>
                                </motion.div>
                            )}

                            {/* Retry button for failed steps */}
                            {step.status === 'failed' && onRetry && (
                                <motion.button
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={(e) => { e.stopPropagation(); onRetry(); }}
                                    className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl
                             bg-blue-50 border border-blue-200 text-blue-600
                             text-xs font-bold hover:bg-blue-100 transition-all"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Retry this step
                                </motion.button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function ActionBtn({
    icon, label, onClick, className,
}: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    className?: string;
}) {
    return (
        <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title={label}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={cn(
                'w-6 h-6 rounded-lg flex items-center justify-center',
                'text-gray-400 hover:text-gray-700 hover:bg-black/[0.06]',
                'transition-all duration-150',
                className,
            )}
        >
            {icon}
        </motion.button>
    );
}