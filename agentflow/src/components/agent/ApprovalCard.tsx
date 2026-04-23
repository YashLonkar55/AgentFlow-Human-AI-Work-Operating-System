'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    CheckCircle2, XCircle, MessageSquare,
    ThumbsUp, ThumbsDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApprovalCardProps {
    stepTitle: string;
    output: string;
    onApprove: () => void;
    onReject: (feedback: string) => void;
}

export default function ApprovalCard({
    stepTitle, output, onApprove, onReject,
}: ApprovalCardProps) {
    const [mode, setMode] = useState<'idle' | 'rejecting'>('idle');
    const [feedback, setFeedback] = useState('');

    return (
        <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="rounded-2xl border-2 border-violet-200 bg-violet-50/40
                 shadow-sm overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-violet-200/60">
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-xs font-black text-violet-700 uppercase tracking-wider">
                    Awaiting your approval
                </span>
                <span className="ml-auto text-xs font-semibold text-violet-500 truncate max-w-[140px]">
                    {stepTitle}
                </span>
            </div>

            {/* Output preview */}
            <div className="px-4 py-3 max-h-40 overflow-y-auto">
                <p className="text-xs text-gray-600 leading-relaxed font-medium whitespace-pre-wrap line-clamp-6">
                    {output}
                </p>
            </div>

            {/* Reject feedback input */}
            {mode === 'rejecting' && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="px-4 pb-3 border-t border-violet-200/60"
                >
                    <p className="text-xs font-bold text-gray-600 mt-3 mb-2">
                        What should be different?
                    </p>
                    <textarea
                        value={feedback}
                        onChange={e => setFeedback(e.target.value)}
                        placeholder="e.g. Make it more detailed, focus on X aspect..."
                        rows={2}
                        className="w-full text-xs rounded-xl border border-black/[0.08]
                       bg-white px-3 py-2 text-gray-700 placeholder:text-gray-300
                       focus:outline-none focus:ring-2 focus:ring-violet-200
                       resize-none font-medium"
                    />
                </motion.div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 px-4 pb-4 pt-2">
                {mode === 'idle' ? (
                    <>
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={onApprove}
                            className="flex-1 flex items-center justify-center gap-2 h-9
                         rounded-xl bg-emerald-500 text-white text-xs font-bold
                         hover:bg-emerald-600 transition-all shadow-sm"
                        >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            Approve — continue
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setMode('rejecting')}
                            className="flex-1 flex items-center justify-center gap-2 h-9
                         rounded-xl bg-red-50 border border-red-200
                         text-red-600 text-xs font-bold
                         hover:bg-red-100 transition-all"
                        >
                            <ThumbsDown className="w-3.5 h-3.5" />
                            Reject — redo
                        </motion.button>
                    </>
                ) : (
                    <>
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                                onReject(feedback || 'Please redo this step with more detail.');
                                setMode('idle');
                                setFeedback('');
                            }}
                            className="flex-1 flex items-center justify-center gap-2 h-9
                         rounded-xl bg-red-500 text-white text-xs font-bold
                         hover:bg-red-600 transition-all shadow-sm"
                        >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject & redo
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setMode('idle')}
                            className="h-9 px-4 rounded-xl border border-black/[0.07]
                         bg-white text-gray-500 text-xs font-bold
                         hover:bg-gray-50 transition-all"
                        >
                            Back
                        </motion.button>
                    </>
                )}
            </div>
        </motion.div>
    );
}