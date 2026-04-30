'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, RotateCcw, MessageSquare,
  Lightbulb, ChevronDown, Send, AlertCircle,
} from 'lucide-react';
import { useAgentStore } from '@/store/agentStore';
import { cn } from '@/lib/utils';
import ChatWindow from '@/components/chat/ChatWindow';
import { History } from 'lucide-react';
import WorkflowHistory from '@/components/layout/WorkflowHistory';


const SUGGESTIONS = [
  'Analyze this dataset and give insights',
  'Research and summarize AI trends in 2025',
  'Write and review a technical blog post',
  'Plan a product launch strategy',
  'Create a competitive analysis report',
];

const STATUS_MAP: Record<string, {
  label: string; dot: string; bg: string; text: string;
}> = {
  idle: { label: 'Ready', dot: 'bg-gray-300', bg: 'bg-gray-50', text: 'text-gray-400' },
  planning: { label: 'Planning', dot: 'bg-blue-400 animate-pulse', bg: 'bg-blue-50', text: 'text-blue-600' },
  running: { label: 'Running', dot: 'bg-violet-400 animate-pulse', bg: 'bg-violet-50', text: 'text-violet-600' },
  paused: { label: 'Paused', dot: 'bg-amber-400', bg: 'bg-amber-50', text: 'text-amber-600' },
  completed: { label: 'Completed', dot: 'bg-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  failed: { label: 'Failed', dot: 'bg-red-400', bg: 'bg-red-50', text: 'text-red-600' },
};

export default function Sidebar() {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const {
    workflow, isPlanning, planError,
    planWorkflow, resetWorkflow, setPlanError,
  } = useAgentStore();

  const status = workflow?.status ?? 'idle';
  const statusConf = STATUS_MAP[status] ?? STATUS_MAP.idle;
  const canSubmit = !!input.trim() && !isPlanning && status !== 'running';

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await planWorkflow(input.trim());
  };

  return (
    <div className="flex flex-col h-full overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.55)' }}>

      {/* ── Top bar — just history toggle ── */}
      <div className="flex items-center justify-between px-4 pt-3 pb-3
                border-b border-black/[0.05]">
        <span className="text-xs font-bold text-gray-700">Workspace</span>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setShowHistory(!showHistory)}
          className={cn(
            'w-7 h-7 rounded-xl flex items-center justify-center border transition-all',
            showHistory
              ? 'bg-violet-50 border-violet-200 text-violet-500'
              : 'bg-white border-black/[0.07] text-gray-400 hover:text-gray-700',
          )}
          title="Workflow history"
        >
          <History className="w-3.5 h-3.5" />
        </motion.button>
      </div>

      {/* ── History panel (replaces main content when open) ── */}
      <AnimatePresence mode="wait">
        {showHistory ? (
          <motion.div
            key="history"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 min-h-0"
          >
            <WorkflowHistory onClose={() => setShowHistory(false)} />
          </motion.div>
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col flex-1 min-h-0 overflow-hidden"
          >

            {/* Status pill */}
            <div className="px-4 pt-3 pb-3">
              <div className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl border border-black/[0.05]',
                statusConf.bg,
              )}>
                <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', statusConf.dot)} />
                <span className={cn('text-xs font-semibold', statusConf.text)}>{statusConf.label}</span>
                {workflow && (
                  <span className="ml-auto text-xs text-gray-400">
                    {workflow.steps.filter(s => s.status === 'completed').length}/
                    {workflow.steps.length} steps
                  </span>
                )}
              </div>
            </div>

            {/* Goal input */}
            <div className="px-4 pb-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                Your Goal
              </label>

              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => { setInput(e.target.value); setPlanError(null); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
                  }}
                  placeholder="What do you want to accomplish?"
                  disabled={isPlanning || status === 'running'}
                  rows={4}
                  className={cn(
                    'w-full resize-none rounded-2xl text-sm font-medium',
                    'bg-white border',
                    planError
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-black/[0.08] focus:ring-violet-200 focus:border-violet-300',
                    'text-gray-800 placeholder:text-gray-300',
                    'px-4 py-3 leading-relaxed',
                    'focus:outline-none focus:ring-2',
                    'transition-all duration-200 shadow-sm',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                  )}
                />
                <AnimatePresence>
                  {input.length > 0 && !isPlanning && (
                    <motion.span
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute bottom-3 right-3 text-[10px] text-gray-300 font-medium"
                    >
                      ↵ run
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* Error */}
              <AnimatePresence>
                {planError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="mt-2 flex items-start gap-2 px-3 py-2.5 rounded-xl
                               bg-red-50 border border-red-200 text-red-600"
                  >
                    <p className="text-xs font-medium leading-relaxed">{planError}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Suggestions */}
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold
                           text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Lightbulb className="w-3 h-3" />
                Suggestions
                <ChevronDown className={cn(
                  'w-3 h-3 transition-transform duration-200',
                  showSuggestions && 'rotate-180',
                )} />
              </button>

              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden mt-2 flex flex-col gap-1.5"
                  >
                    {SUGGESTIONS.map((s, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => { setInput(s); setShowSuggestions(false); setPlanError(null); }}
                        className="text-left text-xs px-3 py-2.5 rounded-xl font-medium
                                   bg-white border border-black/[0.06] text-gray-500
                                   hover:text-gray-800 hover:border-violet-200 hover:bg-violet-50/50
                                   transition-all duration-150 shadow-sm"
                      >
                        {s}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="mt-3 flex gap-2">
                <motion.button
                  whileHover={canSubmit ? { scale: 1.02 } : {}}
                  whileTap={canSubmit ? { scale: 0.97 } : {}}
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2',
                    'h-10 px-4 rounded-xl text-sm font-bold',
                    'transition-all duration-200 shadow-sm',
                    canSubmit
                      ? 'bg-gradient-to-r from-blue-500 to-violet-600 text-white hover:shadow-lg hover:shadow-violet-200'
                      : 'bg-gray-100 text-gray-300 cursor-not-allowed',
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isPlanning ? 'Planning…' : 'Run Agent'}
                </motion.button>

                <AnimatePresence>
                  {workflow && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { resetWorkflow(); setInput(''); }}
                      className="w-10 h-10 rounded-xl border border-black/[0.07] bg-white
                                 text-gray-400 hover:text-gray-700 hover:bg-gray-50
                                 flex items-center justify-center transition-all shadow-sm"
                      title="Reset"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="mx-4 border-t border-black/[0.05]" />

            {/* Active goal card */}
            <AnimatePresence>
              {workflow && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mx-4 mt-3 mb-2 rounded-2xl border border-black/[0.06]
                             bg-white p-3.5 shadow-sm"
                >
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Active goal
                  </p>
                  <p className="text-xs font-medium text-gray-700 leading-relaxed line-clamp-3">
                    {workflow.goal}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mx-4 my-2 border-t border-black/[0.05]" />

            {/* Chat */}
            <div className="flex-1 flex flex-col px-4 pb-4 min-h-0">
              <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Agent Chat
                </span>
                {workflow && (
                  <span className="ml-auto flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-bold text-emerald-500">Live</span>
                  </span>
                )}
              </div>

              <div className="flex-1 rounded-2xl border border-black/[0.06] bg-white/70
                              overflow-hidden flex flex-col min-h-0 shadow-sm">
                <ChatWindow />
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}