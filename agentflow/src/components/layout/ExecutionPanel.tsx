'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
    GitBranch, Play, Pause, SkipForward,
    Square, Sparkles, CheckCircle2,
} from 'lucide-react';
import { useAgentStore } from '@/store/agentStore';
import { useExecutionEngine } from '@/hooks/useExecutionEngine';
import StepCard from '@/components/agent/StepCard';
import { cn } from '@/lib/utils';

export default function ExecutionPanel() {
    const { workflow } = useAgentStore();
    const { start, pause, resume, stop, retryStep, skipStep } = useExecutionEngine();

    const steps = workflow?.steps ?? [];
    const status = workflow?.status ?? 'idle';
    const isRunning = status === 'running';
    const isPaused = status === 'paused';
    const isDone = status === 'completed';
    const done = steps.filter(s => s.status === 'completed').length;
    const pct = steps.length ? Math.round((done / steps.length) * 100) : 0;

    return (
        <div className="flex flex-col h-full" style={{ background: 'rgba(255,255,255,0.35)' }}>

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-6 py-4
                      border-b border-black/[0.05] flex-shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-50 to-violet-50
                          border border-violet-100 flex items-center justify-center">
                        <GitBranch className="w-3.5 h-3.5 text-violet-500" />
                    </div>
                    <h2 className="text-sm font-bold text-gray-800">Execution Flow</h2>
                    {steps.length > 0 && (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full
                             bg-violet-50 text-violet-500 border border-violet-100">
                            {done}/{steps.length}
                        </span>
                    )}
                </div>

                {/* Controls — only show when steps exist */}
                {steps.length > 0 && !isDone && (
                    <div className="flex items-center gap-1.5">

                        {/* Start button — shown when idle/paused */}
                        {(status === 'idle' || isPaused) && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={isPaused ? resume : start}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs
                           font-bold bg-gradient-to-r from-blue-500 to-violet-600
                           text-white shadow-sm hover:shadow-md transition-all"
                            >
                                <Play className="w-3.5 h-3.5" />
                                {isPaused ? 'Resume' : 'Start Execution'}
                            </motion.button>
                        )}

                        {/* Pause button — shown when running */}
                        {isRunning && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={pause}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs
                           font-bold bg-amber-50 border border-amber-200
                           text-amber-600 hover:bg-amber-100 transition-all shadow-sm"
                            >
                                <Pause className="w-3.5 h-3.5" />
                                Pause
                            </motion.button>
                        )}

                        {/* Stop button */}
                        {(isRunning || isPaused) && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={stop}
                                title="Stop execution"
                                className="w-8 h-8 rounded-xl flex items-center justify-center
                           bg-red-50 border border-red-200 text-red-500
                           hover:bg-red-100 transition-all shadow-sm"
                            >
                                <Square className="w-3.5 h-3.5" />
                            </motion.button>
                        )}

                        {/* Skip current step */}
                        {isRunning && (
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    const running = steps.find(s => s.status === 'running');
                                    if (running) skipStep(running.id);
                                }}
                                title="Skip current step"
                                className="w-8 h-8 rounded-xl flex items-center justify-center
                           bg-white border border-black/[0.07] text-gray-400
                           hover:text-gray-700 hover:border-black/[0.12]
                           transition-all shadow-sm"
                            >
                                <SkipForward className="w-3.5 h-3.5" />
                            </motion.button>
                        )}
                    </div>
                )}
            </div>

            {/* ── Progress bar ── */}
            <AnimatePresence>
                {steps.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-shrink-0 px-6 py-2.5 border-b border-black/[0.04]"
                    >
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                Progress
                            </span>
                            <span className="text-[10px] font-bold text-gray-500">{pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-black/[0.05] overflow-hidden">
                            <motion.div
                                className={cn(
                                    'h-full rounded-full',
                                    isDone
                                        ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                                        : 'bg-gradient-to-r from-blue-400 to-violet-500',
                                )}
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Step list ── */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
                <AnimatePresence mode="popLayout">

                    {steps.length === 0 ? (
                        <EmptyState key="empty" isPlanning={!!workflow} />

                    ) : isDone ? (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-8 text-center mb-5"
                        >
                            <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50
                              border border-emerald-200 flex items-center justify-center mb-3 shadow-sm">
                                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                            </div>
                            <p className="text-sm font-bold text-emerald-700 mb-1">All steps completed!</p>
                            <p className="text-xs text-gray-400 font-medium">
                                Check the output panel for results →
                            </p>
                        </motion.div>

                    ) : null}

                    {/* Always render step cards */}
                    {steps.length > 0 && (
                        <div className="flex flex-col gap-3">
                            {steps.map((step, i) => (
                                <motion.div
                                    key={step.id}
                                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{
                                        duration: 0.35,
                                        delay: i * 0.06,
                                        ease: [0.16, 1, 0.3, 1],
                                    }}
                                >
                                    <StepCard
                                        step={step}
                                        index={i}
                                        onRetry={() => retryStep(step.id)}
                                        onSkip={() => skipStep(step.id)}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function EmptyState({ isPlanning }: { isPlanning: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[55vh] text-center px-8"
        >
            {isPlanning ? (
                <>
                    <div className="flex flex-col gap-3 w-full max-w-sm mb-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i}
                                className="shimmer h-[68px] rounded-2xl border border-black/[0.05]"
                                style={{ opacity: 1.1 - i * 0.18 }}
                            />
                        ))}
                    </div>
                    <p className="text-xs font-semibold text-gray-400">AI is planning your steps…</p>
                </>
            ) : (
                <>
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-50 to-violet-50
                          border border-violet-100 flex items-center justify-center mb-5 shadow-sm">
                        <Sparkles className="w-7 h-7 text-violet-400" />
                    </div>
                    <p className="text-base font-bold text-gray-700 mb-2">No workflow running</p>
                    <p className="text-sm text-gray-400 leading-relaxed max-w-xs font-medium">
                        Enter a goal in the sidebar and hit{' '}
                        <span className="text-violet-500 font-bold">Run Agent</span>{' '}
                        to watch AI plan and execute your task step by step.
                    </p>
                </>
            )}
        </motion.div>
    );
}