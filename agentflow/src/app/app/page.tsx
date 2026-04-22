'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Zap } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import ExecutionPanel from '@/components/layout/ExecutionPanel';
import OutputPanel from '@/components/layout/OutputPanel';
import CustomCursor from '@/components/landing/CustomCursor';
import { useAgentStore } from '@/store/agentStore';

export default function AppPage() {
    const router = useRouter();

    return (
        <>
            <CustomCursor />

            {/* Background */}
            <div className="app-mesh-bg" />

            {/* Top bar */}
            <motion.header
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3 border-b border-black/[0.05]"
                style={{
                    background: 'rgba(255,255,255,0.75)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                }}
            >
                {/* Left — logo */}
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600
                          flex items-center justify-center shadow-sm">
                        <Zap className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm font-bold text-gray-900 tracking-tight">AgentFlow</span>
                    <span className="hidden md:inline-flex items-center text-xs font-medium
                           px-2 py-0.5 rounded-full bg-violet-50 text-violet-600
                           border border-violet-100 ml-1">
                        Workspace
                    </span>
                </div>

                {/* Center — live status pill */}
                <StatusPill />

                {/* Right — back */}
                <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => router.push('/')}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-500
                     hover:text-gray-900 px-3 py-1.5 rounded-xl
                     hover:bg-black/[0.04] transition-all"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                </motion.button>
            </motion.header>

            {/* 3-panel layout */}
            <div className="relative z-10 flex h-screen pt-[48px] overflow-hidden">

                {/* Left — Sidebar */}
                <motion.div
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                    className="flex-shrink-0 border-r border-black/[0.05]"
                    style={{ width: 'var(--sidebar-width)' }}
                >
                    <Sidebar />
                </motion.div>

                {/* Center — Execution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                    className="flex-1 min-w-0 border-r border-black/[0.05]"
                >
                    <ExecutionPanel />
                </motion.div>

                {/* Right — Output */}
                <motion.div
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="flex-shrink-0"
                    style={{ width: 'var(--output-width)' }}
                >
                    <OutputPanel />
                </motion.div>

            </div>
        </>
    );
}

/* ── Status pill — reads live from Zustand store ── */
function StatusPill() {
    const { workflow, isPlanning } = useAgentStore();

    const status = isPlanning
        ? 'planning'
        : workflow?.status ?? 'idle';

    const CONFIG: Record<string, {
        dot: string; label: string; text: string; bg: string;
    }> = {
        idle: { dot: 'bg-gray-300', label: 'No active workflow', text: 'text-gray-400', bg: 'bg-white' },
        planning: { dot: 'bg-blue-400 animate-pulse', label: 'Planning steps…', text: 'text-blue-600', bg: 'bg-blue-50' },
        running: { dot: 'bg-violet-400 animate-pulse', label: 'Agent running', text: 'text-violet-600', bg: 'bg-violet-50' },
        paused: { dot: 'bg-amber-400', label: 'Paused', text: 'text-amber-600', bg: 'bg-amber-50' },
        completed: { dot: 'bg-emerald-400', label: 'Workflow complete', text: 'text-emerald-600', bg: 'bg-emerald-50' },
        failed: { dot: 'bg-red-400', label: 'Run failed', text: 'text-red-600', bg: 'bg-red-50' },
    };

    const c = CONFIG[status] ?? CONFIG.idle;

    return (
        <motion.div
            key={status}
            initial={{ opacity: 0, scale: 0.88, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={`hidden md:flex items-center gap-2 text-xs font-semibold
                  px-3.5 py-1.5 rounded-full border border-black/[0.07]
                  shadow-sm ${c.text} ${c.bg}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
            {c.label}

            {/* Step counter — only shows when there are steps */}
            {workflow?.steps.length ? (
                <span className="text-gray-300 font-normal">
                    · {workflow.steps.filter(s => s.status === 'completed').length}/
                    {workflow.steps.length}
                </span>
            ) : null}
        </motion.div>
    );
}