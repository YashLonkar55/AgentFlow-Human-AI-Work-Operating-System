'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    CheckCircle2, Copy, CheckCheck,
    ChevronDown, ChevronUp, List,
    FileText, Sparkles, Download,
    Clock, Hash, BarChart2,
    Search, X, Printer, ChevronRight,
} from 'lucide-react';
import { useAgentStore } from '@/store/agentStore';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────
   Markdown component map
───────────────────────────────────────────── */
const md = {
    h1: ({ children }: { children?: React.ReactNode }) => (
        <h1 className="font-display text-2xl font-bold text-gray-950
                   mt-8 mb-4 tracking-tight leading-tight first:mt-0">
            {children}
        </h1>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
        <h2 className="text-lg font-bold text-gray-900 mt-7 mb-3
                   pb-2 border-b border-black/[0.06] tracking-tight">
            {children}
        </h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
        <h3 className="text-base font-bold text-gray-800 mt-5 mb-2">{children}</h3>
    ),
    h4: ({ children }: { children?: React.ReactNode }) => (
        <h4 className="text-sm font-bold text-gray-700 mt-4 mb-1.5">{children}</h4>
    ),
    p: ({ children }: { children?: React.ReactNode }) => (
        <p className="text-sm text-gray-600 leading-[1.75] mb-4">{children}</p>
    ),
    ul: ({ children }: { children?: React.ReactNode }) => (
        <ul className="mb-4 space-y-2">{children}</ul>
    ),
    ol: ({ children }: { children?: React.ReactNode }) => (
        <ol className="mb-4 space-y-2 list-none counter-reset-item pl-0">{children}</ol>
    ),
    li: ({ children, ordered }: { children?: React.ReactNode; ordered?: boolean }) => (
        <li className={cn(
            'flex items-start gap-3 text-sm text-gray-600 leading-relaxed',
        )}>
            {ordered ? (
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-100
                         text-violet-600 text-[10px] font-black flex items-center
                         justify-center mt-0.5">
                    ·
                </span>
            ) : (
                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-violet-400 mt-2" />
            )}
            <span>{children}</span>
        </li>
    ),
    strong: ({ children }: { children?: React.ReactNode }) => (
        <strong className="font-bold text-gray-900">{children}</strong>
    ),
    em: ({ children }: { children?: React.ReactNode }) => (
        <em className="italic text-gray-700">{children}</em>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
        <blockquote className="relative border-l-4 border-violet-300 bg-gradient-to-r
                           from-violet-50 to-transparent pl-5 pr-4 py-3 my-5 rounded-r-2xl">
            <div className="text-sm text-violet-800 italic leading-relaxed">{children}</div>
        </blockquote>
    ),
    code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
        const isBlock = className?.includes('language-');
        if (isBlock) return (
            <div className="my-4 rounded-2xl overflow-hidden border border-black/[0.06] shadow-sm">
                <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-950 border-b border-white/[0.06]">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                    <span className="ml-2 text-[10px] text-white/25 font-mono font-bold">
                        {className?.replace('language-', '') ?? 'code'}
                    </span>
                </div>
                <pre className="bg-gray-950 p-5 overflow-x-auto">
                    <code className="text-xs text-emerald-400 font-mono leading-relaxed">
                        {children}
                    </code>
                </pre>
            </div>
        );
        return (
            <code className="bg-violet-50 text-violet-700 border border-violet-100
                       px-1.5 py-0.5 rounded-md text-xs font-mono font-bold">
                {children}
            </code>
        );
    },
    table: ({ children }: { children?: React.ReactNode }) => (
        <div className="my-5 overflow-x-auto rounded-2xl border border-black/[0.07] shadow-sm">
            <table className="w-full text-sm border-collapse">{children}</table>
        </div>
    ),
    thead: ({ children }: { children?: React.ReactNode }) => (
        <thead className="bg-gray-50 border-b border-black/[0.07]">{children}</thead>
    ),
    tbody: ({ children }: { children?: React.ReactNode }) => (
        <tbody className="divide-y divide-black/[0.04]">{children}</tbody>
    ),
    tr: ({ children }: { children?: React.ReactNode }) => (
        <tr className="hover:bg-gray-50/80 transition-colors">{children}</tr>
    ),
    th: ({ children }: { children?: React.ReactNode }) => (
        <th className="px-4 py-3 text-left text-xs font-black text-gray-500
                   uppercase tracking-wider">
            {children}
        </th>
    ),
    td: ({ children }: { children?: React.ReactNode }) => (
        <td className="px-4 py-3 text-sm text-gray-600 font-medium">{children}</td>
    ),
    hr: () => (
        <div className="my-8 flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-black/[0.08] to-transparent" />
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-black/[0.08] to-transparent" />
        </div>
    ),
    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
        <a href={href} target="_blank" rel="noopener noreferrer"
            className="text-blue-600 font-semibold underline underline-offset-2
                  decoration-blue-200 hover:decoration-blue-500 transition-all">
            {children}
        </a>
    ),
};

/* ─────────────────────────────────────────────
   Stats bar
───────────────────────────────────────────── */
function StatsBar({ steps, totalOutput, startTime }: {
    steps: { status: string }[];
    totalOutput: string;
    startTime?: Date;
}) {
    const wordCount = useMemo(() =>
        totalOutput.split(/\s+/).filter(Boolean).length,
        [totalOutput],
    );
    const charCount = totalOutput.length;
    const duration = startTime
        ? Math.round((Date.now() - new Date(startTime).getTime()) / 1000)
        : null;

    const stats = [
        {
            icon: <CheckCircle2 className="w-3.5 h-3.5" />,
            value: `${steps.filter(s => s.status === 'completed').length}/${steps.length}`,
            label: 'Steps done',
            color: 'text-emerald-600',
        },
        {
            icon: <Hash className="w-3.5 h-3.5" />,
            value: wordCount.toLocaleString(),
            label: 'Words',
            color: 'text-blue-600',
        },
        {
            icon: <BarChart2 className="w-3.5 h-3.5" />,
            value: charCount > 1000
                ? `${(charCount / 1000).toFixed(1)}k`
                : charCount.toString(),
            label: 'Characters',
            color: 'text-violet-600',
        },
        ...(duration !== null ? [{
            icon: <Clock className="w-3.5 h-3.5" />,
            value: duration >= 60
                ? `${Math.floor(duration / 60)}m ${duration % 60}s`
                : `${duration}s`,
            label: 'Total time',
            color: 'text-amber-600',
        }] : []),
    ];

    return (
        <div className="flex items-center gap-1 px-6 py-3 border-b border-black/[0.04]
                    bg-white/40 flex-shrink-0 overflow-x-auto">
            {stats.map((s, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-xl
                                 bg-white border border-black/[0.06] shadow-sm flex-shrink-0">
                    <span className={s.color}>{s.icon}</span>
                    <div>
                        <div className={cn('text-xs font-black leading-none', s.color)}>{s.value}</div>
                        <div className="text-[10px] text-gray-400 font-medium mt-0.5">{s.label}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ─────────────────────────────────────────────
   Export menu
───────────────────────────────────────────── */
function ExportMenu({ text, goal, onSwitchToFull }: { text: string; goal: string, onSwitchToFull: () => void }) {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const copyMarkdown = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setOpen(false);
        setTimeout(() => setCopied(false), 2000);
    };

    const copyPlain = () => {
        const plain = text
            .replace(/#{1,6}\s/g, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/`(.*?)`/g, '$1')
            .replace(/^\s*[-*+]\s/gm, '• ')
            .replace(/^\s*>\s/gm, '');
        navigator.clipboard.writeText(plain);
        setOpen(false);
    };

    const downloadMd = () => {
        const filename = goal
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .slice(0, 40);
        const blob = new Blob(
            [`# ${goal}\n\n${text}`],
            { type: 'text/markdown' },
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.md`;
        a.click();
        URL.revokeObjectURL(url);
        setOpen(false);
    };

    const printOutput = () => {
        onSwitchToFull();
        setOpen(false);

        setTimeout(() => {
            const el = document.getElementById('print-output');
            if (!el) return;

            const win = window.open('', '_blank', 'width=900,height=700');
            if (!win) { alert('Please allow popups for printing.'); return; }

            win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${goal}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #111827; padding: 56px; max-width: 860px;
      margin: 0 auto; line-height: 1.6; background: white;
    }
    .print-header { margin-bottom: 40px; padding-bottom: 28px; border-bottom: 2px solid #e5e7eb; }
    .print-label { font-size: 11px; font-weight: 800; text-transform: uppercase;
                   letter-spacing: 0.1em; color: #9ca3af; margin-bottom: 8px; }
    .print-goal { font-size: 28px; font-weight: 800; color: #111827; margin-bottom: 6px; }
    .print-meta { font-size: 13px; color: #9ca3af; }
    h1 { font-size: 24px; font-weight: 800; margin: 28px 0 12px; color: #111827; }
    h2 { font-size: 19px; font-weight: 700; margin: 24px 0 10px; padding-bottom: 8px;
         border-bottom: 1px solid #e5e7eb; color: #111827; }
    h3 { font-size: 16px; font-weight: 700; margin: 18px 0 8px; color: #1f2937; }
    h4 { font-size: 14px; font-weight: 700; margin: 14px 0 6px; color: #374151; }
    p  { font-size: 14px; line-height: 1.75; margin-bottom: 12px; color: #374151; }
    ul { margin: 0 0 14px 20px; }
    ol { margin: 0 0 14px 20px; list-style: decimal; }
    li { font-size: 14px; color: #374151; margin-bottom: 5px; line-height: 1.65; }
    strong { font-weight: 700; color: #111827; }
    em { font-style: italic; }
    blockquote { border-left: 4px solid #8b5cf6; background: #f5f3ff;
                 padding: 12px 18px; margin: 18px 0; border-radius: 0 8px 8px 0; }
    blockquote p { color: #4c1d95; font-style: italic; margin: 0; }
    code { background: #f3f4f6; color: #7c3aed; padding: 2px 6px;
           border-radius: 4px; font-family: monospace; font-size: 13px; }
    pre  { background: #111827; color: #34d399; padding: 18px; border-radius: 10px;
           overflow: auto; margin: 16px 0; font-size: 13px; }
    pre code { background: none; color: inherit; padding: 0; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
    th { background: #f9fafb; padding: 10px 14px; text-align: left; font-weight: 700;
         font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em;
         color: #6b7280; border-bottom: 2px solid #e5e7eb; }
    td { padding: 10px 14px; border-bottom: 1px solid #f3f4f6; color: #374151; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 28px 0; }
    a  { color: #2563eb; text-decoration: underline; }
    .step-label { display: flex; align-items: center; gap: 10px; margin: 36px 0 14px; }
    .step-num { width: 24px; height: 24px; background: #ecfdf5; border: 1.5px solid #a7f3d0;
                border-radius: 50%; display: flex; align-items: center; justify-content: center;
                font-size: 10px; font-weight: 900; color: #065f46; flex-shrink: 0; }
    .step-name { font-size: 11px; font-weight: 900; text-transform: uppercase;
                 letter-spacing: 0.1em; color: #6b7280; }
    .step-line { flex: 1; height: 1px; background: #e5e7eb; }
    .step-content { background: white; border: 1px solid #f3f4f6;
                    border-radius: 14px; padding: 28px; margin-bottom: 8px;
                    page-break-inside: avoid; }
    .section-sep { display: flex; align-items: center; gap: 10px; margin: 28px 0; }
    .section-sep-line { flex: 1; height: 1px; background: #f3f4f6; }
    .section-sep-dot { width: 6px; height: 6px; border-radius: 50%; background: #e5e7eb; }
    @media print {
      body { padding: 32px; }
      .step-content { page-break-inside: avoid; }
      h2 { page-break-after: avoid; }
    }
  </style>
</head>
<body>
  ${el.innerHTML}
</body>
</html>`);

            win.document.close();
            win.focus();
            setTimeout(() => { win.print(); }, 400);
        }, 250);
    };
    return (
        <div className="relative">
            <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setOpen(!open)}
                className={cn(
                    'flex items-center gap-1.5 text-xs font-bold px-3 py-1.5',
                    'rounded-xl border transition-all shadow-sm',
                    copied
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                        : 'bg-white border-black/[0.08] text-gray-600 hover:text-gray-900',
                )}
            >
                {copied
                    ? <><CheckCheck className="w-3.5 h-3.5" /> Copied!</>
                    : <><Download className="w-3.5 h-3.5" /> Export</>
                }
            </motion.button>

            <AnimatePresence>
                {open && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.94, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.94, y: -4 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full mt-1.5 z-20 w-48
                         rounded-2xl bg-white border border-black/[0.08]
                         shadow-xl overflow-hidden"
                        >
                            {[
                                { icon: <Copy className="w-3.5 h-3.5" />, label: 'Copy as Markdown', fn: copyMarkdown },
                                { icon: <FileText className="w-3.5 h-3.5" />, label: 'Copy as Plain text', fn: copyPlain },
                                { icon: <Download className="w-3.5 h-3.5" />, label: 'Download .md file', fn: downloadMd },
                                { icon: <Printer className="w-3.5 h-3.5" />, label: 'Print / Save PDF', fn: printOutput },
                            ].map((item, i) => (
                                <button
                                    key={i}
                                    onClick={item.fn}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5
                             text-xs font-semibold text-gray-600 hover:bg-gray-50
                             hover:text-gray-900 transition-colors text-left"
                                >
                                    <span className="text-gray-400">{item.icon}</span>
                                    {item.label}
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Search bar
───────────────────────────────────────────── */
function SearchBar({
    value, onChange, resultCount,
}: {
    value: string;
    onChange: (v: string) => void;
    resultCount: number;
}) {
    return (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white
                    border border-black/[0.07] rounded-2xl shadow-sm">
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder="Search output…"
                className="flex-1 text-xs font-medium text-gray-700
                   placeholder:text-gray-300 bg-transparent
                   focus:outline-none min-w-0"
            />
            {value && (
                <>
                    <span className="text-[10px] font-bold text-gray-400 flex-shrink-0">
                        {resultCount} found
                    </span>
                    <button onClick={() => onChange('')}>
                        <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-700" />
                    </button>
                </>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────
   Step output accordion
───────────────────────────────────────────── */
function StepOutputCard({
    title, content, index, isExpanded, onToggle, highlight,
}: {
    title: string; content: string; index: number;
    isExpanded: boolean; onToggle: () => void; highlight?: string;
}) {
    const contentRef = useRef<HTMLDivElement>(null);
    const wordCount = content.split(/\s+/).filter(Boolean).length;

    /* DOM-based search highlighting — works on rendered markdown */
    useEffect(() => {
        const el = contentRef.current;
        if (!el) return;

        /* Remove old highlights */
        el.querySelectorAll('mark.sh').forEach(mark => {
            const parent = mark.parentNode;
            if (!parent) return;
            parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
            parent.normalize();
        });

        if (!highlight || highlight.trim().length < 2) return;

        /* Walk all text nodes */
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
            acceptNode: node => {
                const tag = (node.parentElement?.tagName ?? '').toUpperCase();
                return ['SCRIPT', 'STYLE', 'MARK'].includes(tag)
                    ? NodeFilter.FILTER_REJECT
                    : NodeFilter.FILTER_ACCEPT;
            },
        });

        const textNodes: Text[] = [];
        let node: Node | null;
        while ((node = walker.nextNode())) textNodes.push(node as Text);

        const re = new RegExp(
            highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
            'gi',
        );

        textNodes.forEach(textNode => {
            const text = textNode.textContent || '';
            if (!re.test(text)) return;
            re.lastIndex = 0;

            const frag = document.createDocumentFragment();
            let last = 0;
            let m: RegExpExecArray | null;

            while ((m = re.exec(text)) !== null) {
                if (m.index > last)
                    frag.appendChild(document.createTextNode(text.slice(last, m.index)));
                const mark = document.createElement('mark');
                mark.className = 'sh bg-yellow-200 text-yellow-900 rounded px-0.5';
                mark.textContent = m[0];
                frag.appendChild(mark);
                last = m.index + m[0].length;
            }

            if (last < text.length)
                frag.appendChild(document.createTextNode(text.slice(last)));

            textNode.parentNode?.replaceChild(frag, textNode);
        });
    }, [highlight, isExpanded]);

    return (
        <div className={`rounded-2xl border bg-white shadow-sm overflow-hidden transition-all duration-200
      ${isExpanded ? 'border-violet-200' : 'border-black/[0.07]'}`}>
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-3 px-5 py-4
                   hover:bg-gray-50/60 transition-colors text-left"
            >
                <span className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-100
                         flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </span>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-gray-300 font-mono">
                            {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="text-sm font-bold text-gray-800 truncate">{title}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">{wordCount} words</span>
                </div>
                <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
            </button>

            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-6 border-t border-black/[0.05]">
                            {/* Rendered markdown — highlighting applied via DOM */}
                            <div ref={contentRef} className="mt-5">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={md as Record<string, unknown>}
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

/* ─────────────────────────────────────────────
   Step navigation sidebar
───────────────────────────────────────────── */
function StepNav({
    steps, activeIndex, onSelect,
}: {
    steps: { id: string; title: string }[];
    activeIndex: number;
    onSelect: (i: number) => void;
}) {
    return (
        <div className="hidden xl:flex flex-col w-52 flex-shrink-0 border-r border-black/[0.05]
                    px-4 py-5 gap-1.5 overflow-y-auto">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Jump to section
            </p>
            {steps.map((s, i) => (
                <button
                    key={s.id}
                    onClick={() => onSelect(i)}
                    className={cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-xl text-left',
                        'transition-all duration-150 text-xs font-semibold',
                        activeIndex === i
                            ? 'bg-violet-50 text-violet-700 border border-violet-200'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800',
                    )}
                >
                    <span className={cn(
                        'w-1.5 h-1.5 rounded-full flex-shrink-0',
                        activeIndex === i ? 'bg-violet-400' : 'bg-gray-300',
                    )} />
                    <span className="truncate">{s.title}</span>
                </button>
            ))}
        </div>
    );
}

/* ─────────────────────────────────────────────
   Main FinalOutput component
───────────────────────────────────────────── */
export default function FinalOutput({ onViewSteps }: { onViewSteps: () => void }) {
    const { workflow } = useAgentStore();
    const [tab, setTab] = useState<'full' | 'steps'>('full');
    const [expandedIdx, setExpandedIdx] = useState<number | null>(0);
    const [activeNavIdx, setActiveNavIdx] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    const completedSteps = useMemo(
        () => workflow?.steps.filter(s => s.status === 'completed' && s.output) ?? [],
        [workflow?.steps],
    );

    const finalOutput = workflow?.finalOutput ?? '';

    /* Search across all step outputs */
    const searchResults = useMemo(() => {
        if (!searchQuery) return completedSteps.length;
        const q = searchQuery.toLowerCase();
        const all = completedSteps.map(s => s.output ?? '').join(' ').toLowerCase();
        const matches = all.match(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'));
        return matches?.length ?? 0;
    }, [searchQuery, completedSteps]);

    const toggle = (i: number) => {
        setExpandedIdx(expandedIdx === i ? null : i);
        setActiveNavIdx(i);
    };

    return (
        <div className="flex flex-col h-full">

            {/* ── Top header ── */}
            <div
                className="flex items-center justify-between px-6 py-4
                   border-b border-black/[0.05] flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.85)' }}
            >
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl
                          bg-emerald-50 border border-emerald-200">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">
                            Complete
                        </span>
                        <span className="text-xs font-bold text-emerald-500">
                            {completedSteps.length}/{workflow?.steps.length}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <motion.button
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={onViewSteps}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5
                       rounded-xl border border-black/[0.07] bg-white
                       text-gray-500 hover:text-gray-800 hover:bg-gray-50
                       transition-all shadow-sm"
                    >
                        <List className="w-3.5 h-3.5" />
                        View Steps
                    </motion.button>

                    <ExportMenu
                        text={finalOutput}
                        goal={workflow?.goal ?? 'output'}
                        onSwitchToFull={() => setTab('full')}
                    />
                </div>
            </div>

            {/* ── Stats bar ── */}
            <StatsBar
                steps={workflow?.steps ?? []}
                totalOutput={finalOutput}
                startTime={workflow?.createdAt}
            />

            {/* ── Main content ── */}
            <div className="flex-1 flex min-h-0">

                {/* Step nav (xl screens) */}
                {tab === 'steps' && (
                    <StepNav
                        steps={completedSteps.map(s => ({ id: s.id, title: s.title }))}
                        activeIndex={activeNavIdx}
                        onSelect={toggle}
                    />
                )}

                {/* Content area */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

                    {/* Goal + tabs */}
                    <div
                        className="px-8 pt-7 pb-0 flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.50)' }}
                    >
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                            Original goal
                        </p>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight
                           leading-snug mb-5 font-display">
                            {workflow?.goal}
                        </h1>

                        {/* Tab bar */}
                        <div className="flex items-center gap-1 border-b border-black/[0.05]">
                            {(['full', 'steps'] as const).map(t => (
                                <button
                                    key={t}
                                    onClick={() => setTab(t)}
                                    className={cn(
                                        'flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold',
                                        'border-b-2 -mb-px transition-all duration-200',
                                        tab === t
                                            ? 'border-gray-900 text-gray-900'
                                            : 'border-transparent text-gray-400 hover:text-gray-700',
                                    )}
                                >
                                    {t === 'full'
                                        ? <><FileText className="w-3.5 h-3.5" /> Full Output</>
                                        : <><List className="w-3.5 h-3.5" /> By Step ({completedSteps.length})</>
                                    }
                                </button>
                            ))}

                            {/* Search — only on By Step tab */}
                            {tab === 'steps' && (
                                <div className="ml-auto mb-1.5 w-52">
                                    <SearchBar
                                        value={searchQuery}
                                        onChange={setSearchQuery}
                                        resultCount={searchResults}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tab content */}
                    <div className="flex-1 overflow-y-auto">
                        <AnimatePresence mode="wait">

                            {/* ── Full Output ── */}
                            {tab === 'full' && (
                                <motion.div
                                    key="full"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="px-8 py-8"
                                >
                                    <div
                                        id="print-output"
                                        className="max-w-3xl mx-auto bg-white rounded-3xl
                                                   border border-black/[0.06] p-10 shadow-sm"
                                    >
                                        {/* Print header */}
                                        <div className="print-header hidden print:block mb-8 pb-6 border-b-2 border-gray-200">
                                            <p className="print-label text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                                Generated by AgentFlow
                                            </p>
                                            <h1 className="print-goal text-2xl font-bold text-gray-900 mb-1">{workflow?.goal}</h1>
                                            <p className="print-meta text-xs text-gray-400">
                                                {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                {' · '}{completedSteps.length} steps completed
                                            </p>
                                        </div>

                                        {/* Step outputs — structured for print */}
                                        {completedSteps.map((step, i) => (
                                            <div key={step.id}>
                                                <div className="step-label flex items-center gap-3 mb-4" style={{ marginTop: i === 0 ? 0 : 36 }}>
                                                    <div className="step-num w-6 h-6 rounded-full bg-emerald-50 border border-emerald-200
                                                                    flex items-center justify-center flex-shrink-0">
                                                        <span className="text-[9px] font-black text-emerald-600">
                                                            {String(i + 1).padStart(2, '0')}
                                                        </span>
                                                    </div>
                                                    <span className="step-name text-xs font-black text-gray-400 uppercase tracking-widest">
                                                        {step.title}
                                                    </span>
                                                    <div className="step-line flex-1 h-px bg-gray-100" />
                                                </div>

                                                <div className="step-content">
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                        components={md as Record<string, unknown>}
                                                    >
                                                        {step.output ?? ''}
                                                    </ReactMarkdown>
                                                </div>

                                                {i < completedSteps.length - 1 && (
                                                    <div className="section-sep flex items-center gap-3 my-8">
                                                        <div className="flex-1 h-px bg-gray-100" />
                                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                                                        <div className="flex-1 h-px bg-gray-100" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* ── By Step ── */}
                            {tab === 'steps' && (
                                <motion.div
                                    key="steps"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="px-8 py-6 flex flex-col gap-3 max-w-3xl mx-auto"
                                >
                                    {completedSteps.length === 0 ? (
                                        <div className="text-center py-16 text-gray-400 text-sm font-medium">
                                            No completed steps yet
                                        </div>
                                    ) : (
                                        completedSteps.map((step, i) => (
                                            <StepOutputCard
                                                key={step.id}
                                                title={step.title}
                                                content={step.output ?? ''}
                                                index={i}
                                                isExpanded={expandedIdx === i}
                                                onToggle={() => toggle(i)}
                                                highlight={searchQuery}
                                            />
                                        ))
                                    )}
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}