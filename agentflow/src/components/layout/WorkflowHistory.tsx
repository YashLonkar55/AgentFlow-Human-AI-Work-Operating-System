'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    History, ChevronRight, Clock,
    CheckCircle2, XCircle, Loader2,
    Trash2, GitBranch,
} from 'lucide-react';
import { useAgentStore } from '@/store/agentStore';
import { StepStatus } from '@/types/agent';
import { cn } from '@/lib/utils';

interface HistoryWorkflow {
    id: string;
    goal: string;
    status: string;
    createdAt: string;
    executionMode: string;
    finalOutput?: string;
    steps: {
        id: string; stepKey: string; title: string;
        description: string; status: string;
        output?: string; position: number;
        startedAt?: string; completedAt?: string;
    }[];
    chatMessages: {
        id: string; role: string;
        content: string; timestamp: string;
    }[];
}

/* Truncate goal into a readable title like ChatGPT does */
function workflowTitle(goal: string): string {
    const cleaned = goal.trim().replace(/\n/g, ' ');
    return cleaned.length > 48 ? cleaned.slice(0, 48) + '…' : cleaned;
}

/* Group by date like ChatGPT — Today, Yesterday, Last 7 days, Older */
function groupByDate(workflows: HistoryWorkflow[]) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const week = new Date(today.getTime() - 7 * 86400000);

    const groups: Record<string, HistoryWorkflow[]> = {
        'Today': [],
        'Yesterday': [],
        'Last 7 days': [],
        'Older': [],
    };

    for (const w of workflows) {
        const d = new Date(w.createdAt);
        if (d >= today) groups['Today'].push(w);
        else if (d >= yesterday) groups['Yesterday'].push(w);
        else if (d >= week) groups['Last 7 days'].push(w);
        else groups['Older'].push(w);
    }

    return groups;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
    completed: <CheckCircle2 className="w-3 h-3 text-emerald-500" />,
    failed: <XCircle className="w-3 h-3 text-red-400" />,
    planning: <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />,
    running: <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />,
    idle: <GitBranch className="w-3 h-3 text-gray-400" />,
};

export default function WorkflowHistory({ onClose }: { onClose: () => void }) {
    const [workflows, setWorkflows] = useState<HistoryWorkflow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    const fetchWorkflows = () => {
        setLoading(true);
        setError(null);
        fetch('/api/workflows')
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(d => {
                setWorkflows(d.workflows ?? []);
                setLoading(false);
            })
            .catch(err => {
                console.error('[history] fetch error:', err);
                setError('Failed to load history');
                setLoading(false);
            });
    };

    useEffect(() => { fetchWorkflows(); }, []);

    const loadWorkflow = (w: HistoryWorkflow) => {
        useAgentStore.setState({
            workflow: {
                id: w.id,
                goal: w.goal,
                status: 'completed',
                executionMode: (w.executionMode as 'auto' | 'review') ?? 'auto',
                finalOutput: w.finalOutput,
                currentStepIndex: w.steps.length - 1,
                createdAt: new Date(w.createdAt),
                steps: w.steps
                    .sort((a, b) => a.position - b.position)
                    .map(s => ({
                        id: s.stepKey,
                        title: s.title,
                        description: s.description,
                        status: s.status as StepStatus,
                        logs: [],
                        output: s.output,
                        startedAt: s.startedAt ? new Date(s.startedAt) : undefined,
                        completedAt: s.completedAt ? new Date(s.completedAt) : undefined,
                    })),
            },
            chat: w.chatMessages.map(m => ({
                id: m.id,
                role: m.role as 'user' | 'assistant',
                content: m.content,
                timestamp: new Date(m.timestamp),
            })),
            isPlanning: false,
            planError: null,
        });
        onClose();
    };

    const deleteWorkflow = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeleting(id);
        try {
            await fetch(`/api/workflows/${id}`, { method: 'DELETE' });
            setWorkflows(prev => prev.filter(w => w.id !== id));

            /* If deleting the active workflow, reset store */
            const active = useAgentStore.getState().workflow;
            if (active?.id === id) useAgentStore.getState().resetWorkflow();
        } catch (err) {
            console.error('[history] delete error:', err);
        } finally {
            setDeleting(null);
        }
    };

    const groups = groupByDate(workflows);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full"
        >
            {/* Header */}
            <div className="flex items-center gap-2 px-4 pt-3 pb-3
                      border-b border-black/[0.05] flex-shrink-0">
                <History className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">
                    History
                </span>
                <button
                    onClick={onClose}
                    className="ml-auto text-[10px] font-bold text-gray-400
                     hover:text-gray-700 transition-colors px-2 py-1
                     rounded-lg hover:bg-gray-100"
                >
                    Close
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto py-2">

                {loading && (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
                    </div>
                )}

                {error && (
                    <div className="text-center py-12 px-4">
                        <p className="text-xs text-red-500 font-medium mb-3">{error}</p>
                        <button
                            onClick={fetchWorkflows}
                            className="text-xs font-bold text-gray-500 hover:text-gray-800
                         px-3 py-1.5 rounded-lg bg-gray-100 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {!loading && !error && workflows.length === 0 && (
                    <div className="text-center py-16 px-6">
                        <History className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                        <p className="text-xs font-bold text-gray-400 mb-1">No workflows yet</p>
                        <p className="text-[11px] text-gray-300 font-medium leading-relaxed">
                            Your workflows will appear here as you create them
                        </p>
                    </div>
                )}

                {/* Grouped list */}
                {!loading && !error && Object.entries(groups).map(([label, items]) => {
                    if (items.length === 0) return null;
                    return (
                        <div key={label} className="mb-2">
                            {/* Date group label */}
                            <p className="text-[10px] font-black text-gray-400 uppercase
                            tracking-widest px-4 py-2">
                                {label}
                            </p>

                            {items.map((w, i) => {
                                const isActive = useAgentStore.getState().workflow?.id === w.id;
                                return (
                                    <motion.div
                                        key={w.id}
                                        initial={{ opacity: 0, x: -6 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        onClick={() => loadWorkflow(w)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') loadWorkflow(w); }}
                                        className={cn(
                                            'w-full text-left px-4 py-2.5 flex items-center gap-2.5 cursor-pointer',
                                            'group transition-colors hover:bg-black/[0.03]',
                                            isActive && 'bg-violet-50/60',
                                        )}
                                    >
                                        {/* Status icon */}
                                        <div className="flex-shrink-0 mt-0.5">
                                            {STATUS_ICON[w.status] ?? STATUS_ICON.idle}
                                        </div>

                                        {/* Title */}
                                        <div className="flex-1 min-w-0">
                                            <p className={cn(
                                                'text-xs font-semibold truncate leading-snug',
                                                isActive ? 'text-violet-700' : 'text-gray-700',
                                            )}>
                                                {workflowTitle(w.goal)}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                                                {w.steps.length} steps · {
                                                    new Date(w.createdAt).toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })
                                                }
                                            </p>
                                        </div>

                                        {/* Delete button — shows on hover */}
                                        <motion.button
                                            onClick={e => deleteWorkflow(e, w.id)}
                                            className={cn(
                                                'flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center',
                                                'opacity-0 group-hover:opacity-100 transition-opacity',
                                                'text-gray-400 hover:text-red-500 hover:bg-red-50',
                                            )}
                                            title="Delete"
                                        >
                                            {deleting === w.id
                                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                                : <Trash2 className="w-3 h-3" />
                                            }
                                        </motion.button>
                                    </motion.div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}