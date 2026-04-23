'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    CheckCircle2, Copy, CheckCheck,
    ChevronDown, ChevronUp, List,
    FileText, Sparkles,
} from 'lucide-react';
import { useAgentStore } from '@/store/agentStore';
import { cn } from '@/lib/utils';

/* ── Markdown renderer styles ── */
const mdComponents = {
    h1: ({ children }: { children?: React.ReactNode }) => (
        <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-3 font-display tracking-tight">
            {children}
        </h1>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
        <h2 className="text-lg font-bold text-gray-900 mt-5 mb-2 pb-2
                   border-b border-black/[0.06] tracking-tight">
            {children}
        </h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
        <h3 className="text-base font-bold text-gray-800 mt-4 mb-2">{children}</h3>
    ),
    p: ({ children }: { children?: React.ReactNode }) => (
        <p className="text-sm text-gray-600 leading-relaxed mb-3">{children}</p>
    ),
    ul: ({ children }: { children?: React.ReactNode }) => (
        <ul className="space-y-1.5 mb-4 ml-1">{children}</ul>
    ),
    ol: ({ children }: { children?: React.ReactNode }) => (
        <ol className="space-y-1.5 mb-4 ml-1 list-decimal list-inside">{children}</ol>
    ),
    li: ({ children }: { children?: React.ReactNode }) => (
        <li className="flex items-start gap-2.5 text-sm text-gray-600">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0 mt-2" />
            <span className="leading-relaxed">{children}</span>
        </li>
    ),
    strong: ({ children }: { children?: React.ReactNode }) => (
        <strong className="font-bold text-gray-900">{children}</strong>
    ),
    em: ({ children }: { children?: React.ReactNode }) => (
        <em className="italic text-gray-700">{children}</em>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
        <blockquote className="border-l-4 border-violet-300 bg-violet-50/50
                           pl-4 py-2 my-4 rounded-r-xl">
            <div className="text-sm text-violet-700 italic">{children}</div>
        </blockquote>
    ),
    code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
        const isBlock = className?.includes('language-');
        if (isBlock) {
            return (
                <pre className="bg-gray-950 rounded-xl p-4 my-3 overflow-x-auto">
                    <code className="text-xs text-emerald-400 font-mono leading-relaxed">
                        {children}
                    </code>
                </pre>
            );
        }
        return (
            <code className="bg-gray-100 text-violet-700 px-1.5 py-0.5 rounded-md text-xs font-mono font-bold">
                {children}
            </code>
        );
    },
    hr: () => <hr className="border-black/[0.06] my-5" />,
};

/* ── Step output accordion ── */
function StepOutputCard({
    title, content, index, isExpanded, onToggle,
}: {
    title: string;
    content: string;
    index: number;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    return (
        <div className="rounded-2xl border border-black/[0.07] bg-white shadow-sm overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-3 px-5 py-3.5
                   hover:bg-black/[0.02] transition-colors text-left"
            >
                <span className="w-6 h-6 rounded-full bg-emerald-100 border border-emerald-200
                         flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </span>
                <span className="text-[10px] font-black text-gray-400 font-mono mr-1">
                    {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-sm font-bold text-gray-800 flex-1 truncate">{title}</span>
                {isExpanded
                    ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                }
            </button>

            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 border-t border-black/[0.05]">
                            <div className="mt-4 prose-sm max-w-none">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={mdComponents}
                                >
                                    {content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ── Copy button ── */
function CopyBtn({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => {
                navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }}
            className={cn(
                'flex items-center gap-1.5 text-xs font-bold px-3 py-1.5',
                'rounded-xl border transition-all shadow-sm',
                copied
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                    : 'bg-white border-black/[0.08] text-gray-500 hover:text-gray-800',
            )}
        >
            {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy all'}
        </motion.button>
    );
}

/* ── Main component ── */
export default function FinalOutput({ onViewSteps }: { onViewSteps: () => void }) {
    const { workflow } = useAgentStore();
    const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

    const completedSteps = workflow?.steps.filter(s => s.status === 'completed' && s.output) ?? [];
    const finalOutput = workflow?.finalOutput ?? '';

    const toggle = (i: number) => setExpandedIndex(expandedIndex === i ? null : i);

    return (
        <div className="flex flex-col h-full">

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-6 py-4
                      border-b border-black/[0.05] flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.80)' }}>
                <div className="flex items-center gap-3">
                    {/* Completion badge */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl
                          bg-emerald-50 border border-emerald-200">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">
                            Workflow Complete
                        </span>
                        <span className="text-xs font-bold text-emerald-500">
                            {completedSteps.length}/{workflow?.steps.length} steps
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Toggle back to steps */}
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={onViewSteps}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5
                       rounded-xl border border-black/[0.07] bg-white
                       text-gray-500 hover:text-gray-800 hover:bg-gray-50
                       transition-all shadow-sm"
                    >
                        <List className="w-3.5 h-3.5" />
                        View Steps
                    </motion.button>

                    <CopyBtn text={finalOutput} />
                </div>
            </div>

            {/* ── Content ── */}
            <div className="flex-1 overflow-y-auto">

                {/* Goal header */}
                <div className="px-8 pt-8 pb-6 border-b border-black/[0.04]"
                    style={{ background: 'rgba(255,255,255,0.50)' }}>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                        Original goal
                    </p>
                    <h1 className="text-xl font-bold text-gray-900 font-display tracking-tight leading-snug">
                        {workflow?.goal}
                    </h1>
                </div>

                {/* Tab bar — switch between Full Output and By Step */}
                <OutputTabs
                    completedSteps={completedSteps}
                    finalOutput={finalOutput}
                    expandedIndex={expandedIndex}
                    onToggle={toggle}
                />
            </div>
        </div>
    );
}

/* ── Tabs: Full / By Step ── */
function OutputTabs({
    completedSteps,
    finalOutput,
    expandedIndex,
    onToggle,
}: {
    completedSteps: { id: string; title: string; output?: string }[];
    finalOutput: string;
    expandedIndex: number | null;
    onToggle: (i: number) => void;
}) {
    const [tab, setTab] = useState<'full' | 'steps'>('full');

    return (
        <div className="flex flex-col">

            {/* Tab pills */}
            <div className="flex items-center gap-1 px-8 pt-5 pb-0">
                {(['full', 'steps'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={cn(
                            'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold',
                            'transition-all duration-200',
                            tab === t
                                ? 'bg-gray-900 text-white shadow-sm'
                                : 'text-gray-400 hover:text-gray-700 hover:bg-black/[0.04]',
                        )}
                    >
                        {t === 'full'
                            ? <><FileText className="w-3.5 h-3.5" /> Full Output</>
                            : <><List className="w-3.5 h-3.5" /> By Step ({completedSteps.length})</>
                        }
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">

                {/* ── Full output tab ── */}
                {tab === 'full' && (
                    <motion.div
                        key="full"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="px-8 py-6"
                    >
                        <div className="rounded-2xl bg-white border border-black/[0.07] p-8 shadow-sm">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={mdComponents}
                            >
                                {finalOutput || '*No output generated.*'}
                            </ReactMarkdown>
                        </div>
                    </motion.div>
                )}

                {/* ── By step tab ── */}
                {tab === 'steps' && (
                    <motion.div
                        key="steps"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="px-8 py-6 flex flex-col gap-3"
                    >
                        {completedSteps.map((step, i) => (
                            <StepOutputCard
                                key={step.id}
                                title={step.title}
                                content={step.output ?? ''}
                                index={i}
                                isExpanded={expandedIndex === i}
                                onToggle={() => onToggle(i)}
                            />
                        ))}
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
}