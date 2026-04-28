'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2, Clock, Loader2,
    XCircle, SkipForward, List,
} from 'lucide-react';
import { useAgentStore } from '@/store/agentStore';
import { AgentStep, StepStatus } from '@/types/agent';
import { cn } from '@/lib/utils';

const DOT: Record<StepStatus, string> = {
    pending: 'bg-gray-200 border-gray-300',
    running: 'bg-blue-400 border-blue-300 animate-pulse',
    completed: 'bg-emerald-400 border-emerald-300',
    failed: 'bg-red-400 border-red-300',
    skipped: 'bg-amber-400 border-amber-300',
    awaiting_approval: 'bg-yellow-400 border-yellow-300 animate-pulse',
    rejected: 'bg-rose-400 border-rose-300',
};

const ICON: Record<StepStatus, React.ReactNode> = {
    pending: <Clock className="w-3 h-3 text-gray-300" />,
    running: <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />,
    completed: <CheckCircle2 className="w-3 h-3 text-emerald-500" />,
    failed: <XCircle className="w-3 h-3 text-red-500" />,
    skipped: <SkipForward className="w-3 h-3 text-amber-500" />,
    awaiting_approval: <Clock className="w-3 h-3 text-yellow-500" />,
    rejected: <XCircle className="w-3 h-3 text-rose-500" />,
};

function StepRow({ step, index, isLast }: {
    step: AgentStep; index: number; isLast: boolean;
}) {
    const isActive = step.status === 'running';

    return (
        <div className="flex gap-3">
            {/* Timeline */}
            <div className="flex flex-col items-center flex-shrink-0">
                <div className={cn(
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                    'transition-all duration-500',
                    DOT[step.status],
                )}>
                    {ICON[step.status]}
                </div>
                {!isLast && (
                    <div className={cn(
                        'w-0.5 flex-1 my-1 rounded-full transition-all duration-500',
                        step.status === 'completed' ? 'bg-emerald-300' : 'bg-gray-200',
                    )} style={{ minHeight: 16 }} />
                )}
            </div>

            {/* Content */}
            <div className={cn(
                'flex-1 pb-4 min-w-0',
                !isLast && 'border-b border-black/[0.04]',
            )}>
                <p className={cn(
                    'text-xs font-bold truncate transition-colors duration-300',
                    isActive ? 'text-blue-700' :
                        step.status === 'completed' ? 'text-gray-800' :
                            step.status === 'failed' ? 'text-red-600' :
                                step.status === 'skipped' ? 'text-amber-600' :
                                    'text-gray-400',
                )}>
                    {step.title}
                </p>

                {/* Running log preview */}
                <AnimatePresence>
                    {isActive && step.logs.length > 0 && (
                        <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-[10px] text-blue-500 font-medium mt-0.5 truncate"
                        >
                            {step.logs[step.logs.length - 1]?.message}
                        </motion.p>
                    )}
                </AnimatePresence>

                {/* Completed duration */}
                {step.status === 'completed' && step.startedAt && step.completedAt && (
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                        {Math.round((
                            new Date(step.completedAt).getTime() -
                            new Date(step.startedAt).getTime()
                        ) / 1000)}s
                    </p>
                )}
            </div>
        </div>
    );
}

export default function OutputPanel() {
    const { workflow } = useAgentStore();
    const steps = workflow?.steps ?? [];
    const done = steps.filter(s => s.status === 'completed').length;

    return (
        <div className="flex flex-col h-full" style={{
            background: 'rgba(255,255,255,0.55)',
            width: 260,
        }}>

            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-4 border-b border-black/[0.05] flex-shrink-0">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-50 to-blue-50
                        border border-violet-100 flex items-center justify-center">
                    <List className="w-3 h-3 text-violet-500" />
                </div>
                <span className="text-xs font-bold text-gray-700">Steps</span>
                {steps.length > 0 && (
                    <span className="ml-auto text-[10px] font-bold text-gray-400">
                        {done}/{steps.length}
                    </span>
                )}
            </div>

            {/* Mini progress */}
            {steps.length > 0 && (
                <div className="px-4 py-2 border-b border-black/[0.04]">
                    <div className="h-1 rounded-full bg-black/[0.05] overflow-hidden">
                        <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-blue-400 to-violet-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${steps.length ? (done / steps.length) * 100 : 0}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                    </div>
                </div>
            )}

            {/* Step timeline */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
                {steps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <List className="w-8 h-8 text-gray-200 mb-3" />
                        <p className="text-xs text-gray-300 font-medium">
                            Steps will appear here after planning
                        </p>
                    </div>
                ) : (
                    <div>
                        {steps.map((step, i) => (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <StepRow
                                    step={step}
                                    index={i}
                                    isLast={i === steps.length - 1}
                                />
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}