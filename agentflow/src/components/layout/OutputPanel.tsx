'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Copy, CheckCheck, ChevronDown, Sparkles } from 'lucide-react';
import { useAgentStore } from '@/store/agentStore';
import { cn } from '@/lib/utils';

export default function OutputPanel() {
    const { workflow } = useAgentStore();
    const completedSteps = workflow?.steps.filter(s => s.status === 'completed' && s.output) ?? [];
    const finalOutput = workflow?.finalOutput;

    return (
        <div className="flex flex-col h-full" style={{ background: 'rgba(255,255,255,0.55)' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4
                      border-b border-black/[0.05] flex-shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50
                          border border-emerald-100 flex items-center justify-center">
                        <FileText className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <h2 className="text-sm font-bold text-gray-800">Output</h2>
                    {completedSteps.length > 0 && (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full
                             bg-emerald-50 text-emerald-600 border border-emerald-100">
                            {completedSteps.length}
                        </span>
                    )}
                </div>
                {finalOutput && <CopyButton text={finalOutput} />}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
                <AnimatePresence>
                    {completedSteps.length === 0 && !finalOutput ? (
                        <EmptyOutput key="empty" />
                    ) : (
                        <>
                            {completedSteps.map((step, i) => (
                                <motion.div
                                    key={step.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                                >
                                    <StepOutputCard title={step.title} content={step.output!} />
                                </motion.div>
                            ))}

                            {finalOutput && (
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="rounded-2xl border border-emerald-200 bg-gradient-to-br
                             from-emerald-50 to-teal-50 p-4 shadow-sm"
                                >
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-5 h-5 rounded-lg bg-emerald-400 flex items-center justify-center">
                                            <Sparkles className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">
                                            Final Result
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
                                        {finalOutput}
                                    </p>
                                </motion.div>
                            )}
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function StepOutputCard({ title, content }: { title: string; content: string }) {
    const [open, setOpen] = useState(true);

    return (
        <div className="rounded-2xl border border-black/[0.07] bg-white shadow-sm overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-4 py-3
                   hover:bg-black/[0.02] transition-colors"
            >
                <span className="text-xs font-bold text-gray-600 truncate text-left">{title}</span>
                <ChevronDown className={cn(
                    'w-3.5 h-3.5 text-gray-400 flex-shrink-0 ml-2 transition-transform duration-200',
                    open && 'rotate-180',
                )} />
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 pt-0 border-t border-black/[0.05]">
                            <p className="text-xs text-gray-500 leading-relaxed mt-3 whitespace-pre-wrap font-medium">
                                {content}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={copy}
            className={cn(
                'flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all shadow-sm',
                copied
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                    : 'bg-white border-black/[0.08] text-gray-500 hover:text-gray-800',
            )}
        >
            {copied ? <CheckCheck className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy'}
        </motion.button>
    );
}

function EmptyOutput() {
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-[55vh] text-center px-6"
        >
            <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50
                      border border-emerald-100 flex items-center justify-center mb-4 shadow-sm">
                <FileText className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-sm font-bold text-gray-600 mb-2">No output yet</p>
            <p className="text-xs text-gray-400 leading-relaxed font-medium">
                Step results and the final summary will appear here as the agent executes
            </p>
        </motion.div>
    );
}