'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, Sparkles, Bot } from 'lucide-react';
import { useAgentStore } from '@/store/agentStore';

const md = {
    h1: ({ children }: { children?: React.ReactNode }) => (
        <h1 className="font-display text-2xl font-bold text-gray-950 mt-6 mb-3 tracking-tight first:mt-0">{children}</h1>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
        <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2 pb-2 border-b border-black/[0.06] tracking-tight">{children}</h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
        <h3 className="text-base font-bold text-gray-800 mt-4 mb-2">{children}</h3>
    ),
    p: ({ children }: { children?: React.ReactNode }) => (
        <p className="text-sm text-gray-600 leading-[1.75] mb-3">{children}</p>
    ),
    ul: ({ children }: { children?: React.ReactNode }) => (
        <ul className="mb-4 space-y-1.5 ml-1">{children}</ul>
    ),
    ol: ({ children }: { children?: React.ReactNode }) => (
        <ol className="mb-4 space-y-1.5 list-decimal list-inside ml-1">{children}</ol>
    ),
    li: ({ children }: { children?: React.ReactNode }) => (
        <li className="flex items-start gap-2.5 text-sm text-gray-600 leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0 mt-2" />
            <span>{children}</span>
        </li>
    ),
    strong: ({ children }: { children?: React.ReactNode }) => (
        <strong className="font-bold text-gray-900">{children}</strong>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
        <blockquote className="border-l-4 border-violet-300 bg-violet-50/60 pl-4 py-2 my-4 rounded-r-xl">
            <div className="text-sm text-violet-800 italic">{children}</div>
        </blockquote>
    ),
    code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
        if (className?.includes('language-')) return (
            <pre className="bg-gray-950 rounded-xl p-4 my-3 overflow-x-auto">
                <code className="text-xs text-emerald-400 font-mono">{children}</code>
            </pre>
        );
        return (
            <code className="bg-violet-50 text-violet-700 border border-violet-100
                       px-1.5 py-0.5 rounded-md text-xs font-mono font-bold">
                {children}
            </code>
        );
    },
    table: ({ children }: { children?: React.ReactNode }) => (
        <div className="my-4 overflow-x-auto rounded-xl border border-black/[0.07]">
            <table className="w-full text-sm border-collapse">{children}</table>
        </div>
    ),
    thead: ({ children }: { children?: React.ReactNode }) => (
        <thead className="bg-gray-50 border-b border-black/[0.07]">{children}</thead>
    ),
    tr: ({ children }: { children?: React.ReactNode }) => (
        <tr className="hover:bg-gray-50/60 transition-colors">{children}</tr>
    ),
    th: ({ children }: { children?: React.ReactNode }) => (
        <th className="px-4 py-2.5 text-left text-xs font-black text-gray-500 uppercase tracking-wider">{children}</th>
    ),
    td: ({ children }: { children?: React.ReactNode }) => (
        <td className="px-4 py-2.5 text-sm text-gray-600 font-medium border-t border-black/[0.04]">{children}</td>
    ),
    hr: () => (
        <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-black/[0.08] to-transparent" />
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-black/[0.08] to-transparent" />
        </div>
    ),
};

/* ── Glow reveal animation ── */
function GlowReveal({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, filter: 'blur(6px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden"
        >
            <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '250%' }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.05 }}
                className="absolute inset-0 z-10 pointer-events-none"
                style={{
                    background: 'linear-gradient(105deg, transparent 35%, rgba(139,92,246,0.10) 50%, rgba(59,130,246,0.08) 58%, transparent 68%)',
                }}
            />
            {children}
        </motion.div>
    );
}

/* ── Main panel ── */
export default function LiveOutputPanel() {
    const { workflow } = useAgentStore();
    const bottomRef = useRef<HTMLDivElement>(null);

    const completedSteps = workflow?.steps.filter(
        s => (s.status === 'completed' || s.status === 'awaiting_approval') && s.output,
    ) ?? [];

    const runningStep = workflow?.steps.find(s => s.status === 'running');
    const hasContent = completedSteps.length > 0;
    const isRunning = workflow?.status === 'running';

    /* Auto-scroll as content grows */
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [completedSteps.length, runningStep?.logs.length]);

    return (
        <div className="flex flex-col h-full" style={{ background: 'rgba(255,255,255,0.5)' }}>

            {/* Header */}
            <div
                className="flex items-center justify-between px-6 py-4
                   border-b border-black/[0.06] flex-shrink-0 bg-white/80 backdrop-blur-sm"
            >
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50
                          border border-emerald-100 flex items-center justify-center">
                        <FileText className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <h2 className="text-sm font-bold text-gray-800">Live Output</h2>
                    {hasContent && (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full
                             bg-emerald-50 text-emerald-600 border border-emerald-100">
                            {completedSteps.length} step{completedSteps.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                <AnimatePresence>
                    {isRunning && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full
                         bg-violet-50 border border-violet-200"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                            <span className="text-[10px] font-black text-violet-600 uppercase tracking-wider">
                                Live
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Content — full width, no max-w constraint */}
            <div className="flex-1 overflow-y-auto">
                {!hasContent && !isRunning ? (
                    <EmptyOutputState hasWorkflow={!!workflow} />
                ) : (
                    <div className="px-10 py-8 w-full">

                        {/* Goal */}
                        {workflow && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-10 pb-8 border-b border-black/[0.05]"
                            >
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                    Goal
                                </p>
                                <h1 className="text-2xl font-bold text-gray-900 font-display tracking-tight leading-snug">
                                    {workflow.goal}
                                </h1>
                            </motion.div>
                        )}

                        {/* Completed step outputs */}
                        <AnimatePresence>
                            {completedSteps.map((step, i) => (
                                <motion.div
                                    key={step.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                    className="mb-10"
                                >
                                    {/* Step label row */}
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-6 h-6 rounded-full bg-emerald-100 border border-emerald-200
                      flex items-center justify-center flex-shrink-0">
                                            <span className="text-[9px] font-black text-emerald-600">
                                                {String(i + 1).padStart(2, '0')}
                                            </span>
                                        </div>
                                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                            {step.title}
                                        </span>
                                        <div className="flex-1 h-px bg-black/[0.05]" />
                                    </div>

                                    {/* ✅ GlowReveal wrapping fully-rendered ReactMarkdown — never raw text */}
                                    <div className="bg-white rounded-2xl border border-black/[0.06] px-8 py-6 shadow-sm">
                                        <GlowReveal>
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={md as Record<string, unknown>}
                                            >
                                                {step.output ?? ''}
                                            </ReactMarkdown>
                                        </GlowReveal>
                                    </div>

                                    {i < completedSteps.length - 1 && (
                                        <div className="mt-10 flex items-center gap-3">
                                            <div className="flex-1 h-px bg-black/[0.04]" />
                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                                            <div className="flex-1 h-px bg-black/[0.04]" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Currently running step */}
                        <AnimatePresence>
                            {runningStep && (
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="mt-4"
                                >
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200
                                    flex items-center justify-center flex-shrink-0">
                                            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                        </div>
                                        <span className="text-xs font-black text-blue-500 uppercase tracking-widest">
                                            {runningStep.title}
                                        </span>
                                        <div className="flex-1 h-px bg-blue-100" />
                                    </div>

                                    <div className="bg-white rounded-2xl border border-blue-100 px-8 py-6 shadow-sm">
                                        <div className="flex items-center gap-3 mb-5">
                                            <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100
                                      flex items-center justify-center">
                                                <Bot className="w-3.5 h-3.5 text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-blue-600">Executing step…</p>
                                                {runningStep.logs.length > 0 && (
                                                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                                                        {runningStep.logs[runningStep.logs.length - 1]?.message}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Shimmer lines */}
                                        <div className="space-y-3">
                                            {[100, 88, 94, 72, 85].map((w, i) => (
                                                <div
                                                    key={i}
                                                    className="shimmer h-3 rounded-full"
                                                    style={{ width: `${w}%`, opacity: 1.1 - i * 0.12 }}
                                                />
                                            ))}
                                        </div>
                                        <motion.div
                                            className="mt-5 h-1 rounded-full bg-gradient-to-r from-blue-200 via-violet-300 to-blue-200"
                                            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                            style={{ backgroundSize: '200% 100%' }}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div ref={bottomRef} className="h-20" />
                    </div>
                )}
            </div>
        </div>
    );
}

function EmptyOutputState({ hasWorkflow }: { hasWorkflow: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full text-center px-8"
        >
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50
                      border border-emerald-100 flex items-center justify-center mb-5 shadow-sm">
                <Sparkles className="w-7 h-7 text-emerald-400" />
            </div>
            <p className="text-base font-bold text-gray-700 mb-2">Output will appear here</p>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs font-medium">
                {hasWorkflow
                    ? 'Hit Start in the right panel — output streams in as each step completes'
                    : 'Enter a goal in the sidebar, plan steps, then start execution'
                }
            </p>
        </motion.div>
    );
}