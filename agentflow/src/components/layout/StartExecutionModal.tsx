'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, Zap, CheckSquare, X,
    ChevronRight, Bot, User,
} from 'lucide-react';
import { ExecutionMode } from '@/types/agent';
import { cn } from '@/lib/utils';

interface StartExecutionModalProps {
    open: boolean;
    stepCount: number;
    onStart: (mode: ExecutionMode) => void;
    onClose: () => void;
}

const MODES: {
    id: ExecutionMode;
    icon: React.ReactNode;
    title: string;
    desc: string;
    badge: string;
    badgeCls: string;
    border: string;
    bg: string;
}[] = [
        {
            id: 'auto',
            icon: <Bot className="w-5 h-5" />,
            title: 'Auto-run all steps',
            desc: 'Agent executes all steps back-to-back without interruption. Best for trusted workflows.',
            badge: 'Fastest',
            badgeCls: 'bg-blue-50 text-blue-600 border-blue-200',
            border: 'border-blue-200',
            bg: 'bg-blue-50/40',
        },
        {
            id: 'review',
            icon: <User className="w-5 h-5" />,
            title: 'Review each step',
            desc: 'Agent pauses after every step. You approve or reject the output before it continues.',
            badge: 'Full control',
            badgeCls: 'bg-violet-50 text-violet-600 border-violet-200',
            border: 'border-violet-200',
            bg: 'bg-violet-50/40',
        },
    ];

export default function StartExecutionModal({
    open, stepCount, onStart, onClose,
}: StartExecutionModalProps) {
    const [selected, setSelected] = useState<ExecutionMode>('auto');

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 8 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
                    >
                        <div className="pointer-events-auto w-full max-w-md rounded-3xl
                            bg-white border border-black/[0.08]
                            shadow-[0_24px_80px_rgba(0,0,0,0.14)] overflow-hidden">

                            {/* Header */}
                            <div className="flex items-start justify-between p-6 pb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600
                                    flex items-center justify-center shadow-sm">
                                            <Play className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        <h2 className="text-base font-bold text-gray-900 tracking-tight">
                                            Start Execution
                                        </h2>
                                    </div>
                                    <p className="text-xs text-gray-400 font-medium ml-9">
                                        {stepCount} steps ready to run — choose your mode
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-7 h-7 rounded-xl flex items-center justify-center
                             text-gray-400 hover:text-gray-700 hover:bg-gray-100
                             transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Mode cards */}
                            <div className="px-6 pb-4 flex flex-col gap-3">
                                {MODES.map(m => (
                                    <motion.button
                                        key={m.id}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => setSelected(m.id)}
                                        className={cn(
                                            'w-full text-left rounded-2xl border-2 p-4 transition-all duration-200',
                                            selected === m.id
                                                ? `${m.border} ${m.bg} shadow-sm`
                                                : 'border-black/[0.07] bg-white hover:bg-gray-50/80',
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Icon */}
                                            <div className={cn(
                                                'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
                                                selected === m.id
                                                    ? m.id === 'auto'
                                                        ? 'bg-blue-100 text-blue-600'
                                                        : 'bg-violet-100 text-violet-600'
                                                    : 'bg-gray-100 text-gray-400',
                                            )}>
                                                {m.icon}
                                            </div>

                                            {/* Text */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-sm font-bold text-gray-900">{m.title}</span>
                                                    <span className={cn(
                                                        'text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wide',
                                                        m.badgeCls,
                                                    )}>
                                                        {m.badge}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                                    {m.desc}
                                                </p>
                                            </div>

                                            {/* Radio */}
                                            <div className={cn(
                                                'w-4.5 h-4.5 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all',
                                                selected === m.id
                                                    ? m.id === 'auto'
                                                        ? 'border-blue-500 bg-blue-500'
                                                        : 'border-violet-500 bg-violet-500'
                                                    : 'border-gray-300 bg-white',
                                            )}>
                                                {selected === m.id && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="w-full h-full rounded-full flex items-center justify-center"
                                                    >
                                                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>

                            {/* What happens section */}
                            <div className="mx-6 mb-4 rounded-xl bg-gray-50 border border-black/[0.05] p-3">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                    What happens
                                </p>
                                {selected === 'auto' ? (
                                    <div className="space-y-1">
                                        {[
                                            'All steps execute automatically',
                                            'Failed steps show a retry button',
                                            'You can pause anytime mid-run',
                                            'Full output ready when done',
                                        ].map((t, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <Zap className="w-3 h-3 text-blue-400 flex-shrink-0" />
                                                <span className="text-xs text-gray-600 font-medium">{t}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {[
                                            'Agent runs one step at a time',
                                            'Output shown for your review',
                                            'Approve → next step runs',
                                            'Reject → step reruns with feedback',
                                        ].map((t, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <CheckSquare className="w-3 h-3 text-violet-400 flex-shrink-0" />
                                                <span className="text-xs text-gray-600 font-medium">{t}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="px-6 pb-6 flex gap-2">
                                <button
                                    onClick={onClose}
                                    className="flex-1 h-11 rounded-xl border border-black/[0.08]
                             bg-gray-50 text-sm font-bold text-gray-500
                             hover:bg-gray-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(99,102,241,0.25)' }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onStart(selected)}
                                    className="flex-2 flex-1 h-11 rounded-xl text-sm font-bold text-white
                             bg-gradient-to-r from-blue-500 to-violet-600
                             shadow-sm transition-all flex items-center justify-center gap-2"
                                >
                                    <Play className="w-4 h-4" />
                                    Start {selected === 'auto' ? 'Auto-run' : 'with Review'}
                                    <ChevronRight className="w-4 h-4" />
                                </motion.button>
                            </div>

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}