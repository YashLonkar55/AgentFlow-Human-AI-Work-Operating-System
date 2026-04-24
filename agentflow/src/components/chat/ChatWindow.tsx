'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Zap, X } from 'lucide-react';
import { useAgentStore } from '@/store/agentStore';
import { ChatMessage } from '@/types/agent';
import { cn } from '@/lib/utils';

/* ── Quick prompts ── */
const QUICK_PROMPTS = [
    "What's happening now?",
    "Why is this taking long?",
    "Summarize progress so far",
    "What comes next?",
];

/* ── Single message bubble ── */
function MessageBubble({ msg }: { msg: ChatMessage }) {
    const isUser = msg.role === 'user';

    return (
        <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={cn('flex gap-2', isUser ? 'flex-row-reverse' : 'flex-row')}
        >
            {/* Avatar */}
            <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                isUser
                    ? 'bg-gradient-to-br from-blue-500 to-violet-600'
                    : 'bg-gradient-to-br from-gray-100 to-gray-200 border border-black/[0.07]',
            )}>
                {isUser
                    ? <User className="w-3 h-3 text-white" />
                    : <Bot className="w-3 h-3 text-gray-500" />
                }
            </div>

            {/* Bubble */}
            <div className={cn(
                'max-w-[78%] rounded-2xl px-3 py-2 text-xs leading-relaxed font-medium',
                isUser
                    ? 'bg-gradient-to-br from-blue-500 to-violet-600 text-white rounded-tr-sm'
                    : 'bg-white border border-black/[0.07] text-gray-700 rounded-tl-sm shadow-sm',
            )}>
                {msg.content}
            </div>
        </motion.div>
    );
}

/* ── Command notification ── */
function CommandBadge({ type }: { type: string }) {
    const labels: Record<string, { label: string; color: string }> = {
        MODIFY_STEP: { label: '✏️ Step modified', color: 'bg-blue-50 text-blue-600 border-blue-200' },
        ADD_STEP: { label: '➕ New step added', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
        SKIP_STEP: { label: '⏭️ Step skipped', color: 'bg-amber-50 text-amber-600 border-amber-200' },
    };
    const info = labels[type];
    if (!info) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                'text-[10px] font-black px-2.5 py-1 rounded-full border self-center mx-auto',
                info.color,
            )}
        >
            {info.label}
        </motion.div>
    );
}

/* ── Main chat window ── */
export default function ChatWindow() {
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [lastCommand, setLastCommand] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const {
        chat, workflow, addChatMessage,
        modifyStep, addStep, skipStep: storeSkipStep,
    } = useAgentStore();

    /* Auto-scroll to bottom on new messages */
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chat.length, isTyping]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text || isTyping) return;

        /* Add user message */
        const userMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: text,
            timestamp: new Date(),
        };
        addChatMessage(userMsg);
        setInput('');
        setIsTyping(true);
        setLastCommand(null);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    workflow: workflow,
                    chatHistory: chat.slice(-8).map(m => ({
                        role: m.role,
                        content: m.content,
                    })),
                }),
            });

            const data = await res.json();

            /* Add assistant response */
            const assistantMsg: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: data.response || 'Sorry, something went wrong.',
                timestamp: new Date(),
            };
            addChatMessage(assistantMsg);

            /* Execute any command the AI returned */
            if (data.command) {
                const { type, payload } = data.command;
                setLastCommand(type);

                if (type === 'MODIFY_STEP' && payload.stepId) {
                    modifyStep(payload.stepId, {
                        title: payload.title,
                        description: payload.description,
                    });
                } else if (type === 'ADD_STEP' && payload.title) {
                    addStep(payload.title, payload.description ?? '', payload.afterStepId);
                } else if (type === 'SKIP_STEP' && payload.stepId) {
                    storeSkipStep(payload.stepId);
                }
            }

        } catch {
            addChatMessage({
                id: crypto.randomUUID(),
                role: 'assistant',
                content: 'Sorry, I ran into an error. Please try again.',
                timestamp: new Date(),
            });
        } finally {
            setIsTyping(false);
        }
    };

    const isEmpty = chat.length === 0;

    return (
        <div className="flex flex-col h-full min-h-0">

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3 min-h-0">

                {/* Empty state */}
                {isEmpty && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center h-full text-center px-4 py-8"
                    >
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-100 to-pink-100
                            border border-violet-100 flex items-center justify-center mb-3">
                            <Bot className="w-5 h-5 text-violet-400" />
                        </div>
                        <p className="text-xs font-bold text-gray-500 mb-1">
                            Agent is ready to assist
                        </p>
                        <p className="text-[11px] text-gray-400 leading-relaxed">
                            Ask about the workflow, request changes, or get a progress update
                        </p>

                        {/* Quick prompts */}
                        {workflow && (
                            <div className="mt-4 flex flex-col gap-1.5 w-full">
                                {QUICK_PROMPTS.map((q, i) => (
                                    <motion.button
                                        key={i}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.07 }}
                                        onClick={() => { setInput(q); inputRef.current?.focus(); }}
                                        className="text-left text-[11px] font-semibold px-3 py-2 rounded-xl
                               bg-white border border-black/[0.06] text-gray-500
                               hover:text-violet-600 hover:border-violet-200 hover:bg-violet-50/50
                               transition-all shadow-sm"
                                    >
                                        {q}
                                    </motion.button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Messages */}
                <AnimatePresence initial={false}>
                    {chat.map(msg => (
                        <MessageBubble key={msg.id} msg={msg} />
                    ))}
                </AnimatePresence>

                {/* Command badge */}
                <AnimatePresence>
                    {lastCommand && (
                        <CommandBadge key={lastCommand + Date.now()} type={lastCommand} />
                    )}
                </AnimatePresence>

                {/* Typing indicator */}
                <AnimatePresence>
                    {isTyping && (
                        <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex gap-2 items-center"
                        >
                            <div className="w-6 h-6 rounded-full bg-gray-100 border border-black/[0.07]
                              flex items-center justify-center flex-shrink-0">
                                <Bot className="w-3 h-3 text-gray-400" />
                            </div>
                            <div className="bg-white border border-black/[0.07] rounded-2xl rounded-tl-sm
                              px-3 py-2.5 shadow-sm flex items-center gap-1.5">
                                {[0, 1, 2].map(i => (
                                    <motion.div
                                        key={i}
                                        className="w-1.5 h-1.5 rounded-full bg-gray-400"
                                        animate={{ y: [0, -4, 0] }}
                                        transition={{
                                            duration: 0.6,
                                            repeat: Infinity,
                                            delay: i * 0.15,
                                            ease: 'easeInOut',
                                        }}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div ref={bottomRef} />
            </div>

            {/* ── Input bar ── */}
            <div className="flex-shrink-0 px-3 pb-3 pt-2 border-t border-black/[0.05]">

                {/* No workflow warning */}
                {!workflow && (
                    <p className="text-[10px] text-gray-400 font-medium text-center mb-2">
                        Start a workflow to enable agent chat
                    </p>
                )}

                <div className={cn(
                    'flex gap-2 items-end rounded-2xl border bg-white px-3 py-2.5 shadow-sm',
                    'transition-all duration-200',
                    !workflow
                        ? 'opacity-40 pointer-events-none border-black/[0.06]'
                        : 'border-black/[0.08] focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100',
                )}>
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder={
                            !workflow
                                ? 'Start a workflow first…'
                                : 'Ask the agent anything…'
                        }
                        rows={1}
                        disabled={!workflow || isTyping}
                        className="flex-1 text-xs text-gray-700 placeholder:text-gray-300
                       font-medium bg-transparent resize-none
                       focus:outline-none leading-relaxed max-h-20
                       disabled:cursor-not-allowed"
                        style={{ scrollbarWidth: 'none' }}
                    />

                    <motion.button
                        whileHover={input.trim() ? { scale: 1.08 } : {}}
                        whileTap={input.trim() ? { scale: 0.92 } : {}}
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping || !workflow}
                        className={cn(
                            'w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
                            input.trim() && !isTyping
                                ? 'bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-300',
                        )}
                    >
                        {isTyping
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Send className="w-3.5 h-3.5" />
                        }
                    </motion.button>
                </div>

                <p className="text-[10px] text-gray-300 text-center mt-1.5 font-medium">
                    ↵ send · shift+↵ newline
                </p>
            </div>
        </div>
    );
}