'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogEntry } from '@/types/agent';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/utils';

const LEVEL: Record<string, { text: string; prefix: string; bg: string }> = {
    info: { text: 'text-gray-500', prefix: '›', bg: '' },
    success: { text: 'text-emerald-600', prefix: '✓', bg: '' },
    warning: { text: 'text-amber-600', prefix: '⚠', bg: '' },
    error: { text: 'text-red-600', prefix: '✕', bg: '' },
};

export default function StepLogs({ logs, isRunning }: { logs: LogEntry[]; isRunning: boolean }) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs.length]);

    return (
        <div className="rounded-xl border border-black/[0.07] bg-gray-950 overflow-hidden shadow-sm">
            {/* Terminal chrome */}
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/[0.06] bg-gray-900">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                <span className="text-[10px] text-white/25 ml-2 font-mono font-bold">logs</span>
            </div>

            <div className="max-h-36 overflow-y-auto p-3 font-mono text-[11px] space-y-1.5">
                <AnimatePresence initial={false}>
                    {logs.map((log) => {
                        const l = LEVEL[log.level] ?? LEVEL.info;
                        return (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.15 }}
                                className="flex items-start gap-2"
                            >
                                <span className="text-white/20 flex-shrink-0 tabular-nums">
                                    {formatTime(new Date(log.timestamp))}
                                </span>
                                <span className={cn('flex-shrink-0 font-bold', l.text)}>{l.prefix}</span>
                                <span className={cn(l.text, 'leading-relaxed break-all')}>{log.message}</span>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {isRunning && (
                    <div className="flex items-center gap-2">
                        <span className="text-white/20 tabular-nums">{formatTime(new Date())}</span>
                        <span className="text-blue-400/70 cursor-blink" />
                    </div>
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}