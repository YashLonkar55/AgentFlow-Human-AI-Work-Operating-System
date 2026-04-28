'use client';

import { useRef, useEffect, useState } from 'react';
import {
  motion, useScroll, useTransform,
  useSpring, AnimatePresence,
} from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Zap, ArrowRight, Sparkles, Brain, Users,
  CheckCircle, Play, GitBranch, MessageSquare,
  ArrowUpRight, ChevronDown, BookOpen,
  LayoutDashboard, ShieldCheck, Cpu,
} from 'lucide-react';
import CustomCursor from '@/components/landing/CustomCursor';

/* ── Cycling words ── */
const CYCLE_WORDS = [
  { text: 'plans', color: 'text-blue-500' },
  { text: 'executes', color: 'text-violet-500' },
  { text: 'reasons', color: 'text-pink-500' },
  { text: 'adapts', color: 'text-amber-500' },
  { text: 'learns', color: 'text-emerald-500' },
  { text: 'delivers', color: 'text-indigo-500' },
];

/* ── Nav links ── */
const NAV_LEFT = [
  { label: 'Features', href: '#features', icon: LayoutDashboard },
  { label: 'How it works', href: '#how-it-works', icon: Cpu },
  { label: 'Security', href: '#security', icon: ShieldCheck },
  { label: 'Docs', href: '#docs', icon: BookOpen },
];

/* ── Features ── */
const FEATURES = [
  {
    icon: Brain, title: 'AI Task Planner',
    desc: 'Paste any goal. Claude breaks it into clear, executable steps automatically.',
    tag: 'Powered by Claude', color: 'from-violet-50 to-purple-50',
    accent: 'text-violet-600', dot: 'bg-violet-400',
  },
  {
    icon: Zap, title: 'Execution Engine',
    desc: 'Steps run one-by-one with live logs, progress tracking, and real outputs.',
    tag: 'Real-time', color: 'from-blue-50 to-sky-50',
    accent: 'text-blue-600', dot: 'bg-blue-400',
  },
  {
    icon: Users, title: 'Human-in-the-Loop',
    desc: "Edit, retry, skip, or approve any step. You're always in control.",
    tag: 'Full control', color: 'from-pink-50 to-rose-50',
    accent: 'text-pink-600', dot: 'bg-pink-400',
  },
  {
    icon: MessageSquare, title: 'Agent Chat',
    desc: 'Chat with the AI mid-execution to redirect, modify, or ask questions.',
    tag: 'Context-aware', color: 'from-amber-50 to-orange-50',
    accent: 'text-amber-600', dot: 'bg-amber-400',
  },
];

const STATS = [
  { value: '10×', label: 'Faster task execution' },
  { value: '4.9★', label: 'User satisfaction' },
  { value: '50+', label: 'Task templates' },
  { value: '100%', label: 'Human controlled' },
];

/* ─────────────────────────────────────────────
   Cycling Word Component
───────────────────────────────────────────── */
function CyclingWord() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  const [width, setWidth] = useState<number | 'auto'>('auto');
  const measureRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Measure each word's width so the container never jumps
  useEffect(() => {
    if (measureRef.current) {
      setWidth(measureRef.current.offsetWidth);
    }
  }, [index]);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setPhase('out');
      setTimeout(() => {
        setIndex(i => (i + 1) % CYCLE_WORDS.length);
        setPhase('in');
      }, 300);
    }, 2000);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [index]);

  const w = CYCLE_WORDS[index];

  return (
    <>
      {/* Invisible measurer — renders current word off-screen to get its width */}
      <span
        ref={measureRef}
        aria-hidden
        className="font-display italic absolute opacity-0 pointer-events-none"
        style={{ fontSize: 'inherit', lineHeight: 'inherit' }}
      >
        {w.text}
      </span>

      {/* Fixed-width container — no layout shift */}
      <span
        className="inline-block relative align-baseline"
        style={{
          width: width === 'auto' ? 'auto' : `${width}px`,
          transition: 'width 0.3s cubic-bezier(0.16,1,0.3,1)',
          verticalAlign: 'baseline',
        }}
      >
        <span
          key={`${index}-${phase}`}
          className={`inline-block ${w.color} font-display italic word-${phase === 'in' ? 'in' : 'out'}`}
          style={{ whiteSpace: 'nowrap' }}
        >
          {w.text}
        </span>
      </span>
    </>
  );
}

/* ─────────────────────────────────────────────
   Floating Navbar
───────────────────────────────────────────── */
function Navbar({ onLaunch }: { onLaunch: () => void }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = document.querySelector('.landing-scroll') as HTMLDivElement;
    scrollRef.current = el;
    const onScroll = () => setScrolled((el?.scrollTop ?? 0) > 50);
    el?.addEventListener('scroll', onScroll, { passive: true });
    return () => el?.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-4 left-0 right-0 z-50 flex justify-center pointer-events-none"
    >
      <div
        className="pointer-events-auto flex items-center justify-between gap-6
                   rounded-2xl border w-full max-w-4xl mx-5 px-5 py-3
                   transition-all duration-500"
        style={{
          background: scrolled ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.55)',
          backdropFilter: scrolled ? 'blur(20px)' : 'blur(10px)',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'blur(10px)',
          borderColor: scrolled ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.05)',
          boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.06)' : 'none',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600
                          flex items-center justify-center shadow-sm">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-gray-900 tracking-tight">AgentFlow</span>
        </div>

        {/* Center links
        <div className="hidden md:flex items-center gap-1">
          {NAV_LEFT.map(({ label, href }) => (
            
              key={label}
              href={href}
              className="text-sm text-gray-500 hover:text-gray-900 font-medium
                         px-3 py-1.5 rounded-xl hover:bg-black/[0.04]
                         transition-all duration-150"
            >
              {label}
            </a>
          ))}
        </div> */}

        {/* Right side */}
        <div className="flex items-center gap-2.5">
          <button className="hidden md:block text-sm font-medium text-gray-500
                             hover:text-gray-900 px-3 py-1.5 rounded-xl
                             hover:bg-black/[0.04] transition-all">
            Sign in
          </button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onLaunch}
            className="flex items-center gap-1.5 text-sm font-bold px-4 py-2
                       rounded-xl bg-gray-950 text-white hover:bg-gray-800
                       transition-colors shadow-sm"
          >
            Open App
            <ArrowUpRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
}

/* ─────────────────────────────────────────────
   Main page
───────────────────────────────────────────── */
export default function LandingPage() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [heroReady, setHeroReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  const { scrollYProgress } = useScroll({ container: scrollRef });
  const smoothProg = useSpring(scrollYProgress, { stiffness: 80, damping: 20 });

  const blob1Y = useTransform(smoothProg, [0, 0.3], ['0%', '20%']);
  const blob2Y = useTransform(smoothProg, [0, 0.3], ['0%', '-16%']);
  const blob3Y = useTransform(smoothProg, [0, 0.3], ['0%', '12%']);
  const blob4Y = useTransform(smoothProg, [0, 0.3], ['0%', '-8%']);
  const cardY = useTransform(smoothProg, [0, 0.25], ['0px', '44px']);
  const heroOp = useTransform(smoothProg, [0, 0.2], [1, 0]);
  const heroY = useTransform(smoothProg, [0, 0.2], ['0px', '-28px']);

  const launch = () => router.push('/app');

  return (
    <>
      <CustomCursor />
      <div className="mesh-bg" />

      {/* Scroll progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2.5px] z-[9999] origin-left
                   bg-gradient-to-r from-blue-400 via-violet-500 to-pink-500"
        style={{ scaleX: smoothProg }}
      />

      <Navbar onLaunch={launch} />

      {/* ── Scroll container ── */}
      <div ref={scrollRef} className="landing-scroll relative z-10">

        {/* ═══════════════════════
            HERO
        ═══════════════════════ */}
        <section className="relative min-h-screen flex flex-col items-center
                            justify-center text-center px-6 pt-28 pb-20 overflow-hidden">

          {/* Blobs */}
          <motion.div style={{ y: blob1Y }}
            className="blob-drift-1 absolute -left-40 bottom-0 w-[600px] h-[600px] rounded-full
                       bg-gradient-to-br from-orange-200/65 to-amber-200/45 blur-[90px] pointer-events-none" />
          <motion.div style={{ y: blob2Y }}
            className="blob-drift-2 absolute -right-24 top-16 w-[480px] h-[480px] rounded-full
                       bg-gradient-to-br from-pink-200/60 to-rose-200/45 blur-[80px] pointer-events-none" />
          <motion.div style={{ y: blob3Y }}
            className="blob-drift-3 absolute left-1/3 -top-16 w-[400px] h-[400px] rounded-full
                       bg-gradient-to-br from-violet-200/50 to-indigo-200/38 blur-[75px] pointer-events-none" />
          <motion.div style={{ y: blob4Y }}
            className="blob-drift-1 absolute right-1/4 bottom-12 w-[320px] h-[320px] rounded-full
                       bg-gradient-to-br from-emerald-200/35 to-teal-200/25 blur-[65px] pointer-events-none" />

          {/* Content */}
          <motion.div style={{ opacity: heroOp, y: heroY }} className="relative z-10 max-w-5xl mx-auto">

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2
                         rounded-full bg-white/80 border border-black/[0.07] text-gray-500
                         shadow-sm backdrop-blur-sm mb-8"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Now with Claude Sonnet
              <Sparkles className="w-3.5 h-3.5 text-violet-500" />
            </motion.div>

            {/* Headline line 1 — rainbow sweep */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="font-display text-[clamp(3.5rem,9vw,7rem)] font-normal
                             tracking-tight leading-[1.05] mb-2">
                {heroReady ? (
                  <span className="rainbow-sweep">AI does the work.</span>
                ) : (
                  <span className="text-gray-950">AI does the work.</span>
                )}
              </h1>
            </motion.div>

            {/* Headline line 2 — cycling word */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="relative font-display text-[clamp(2.8rem,7.5vw,5.8rem)] font-normal
                 tracking-tight leading-[1.08] text-gray-800 mb-8">
                AI{' '}
                <CyclingWord />
                {' '}for you.
              </h2>
            </motion.div>

            {/* Sub */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.62, ease: [0.16, 1, 0.3, 1] }}
              className="text-lg md:text-xl text-gray-400 max-w-xl mx-auto
                         leading-relaxed mb-10 font-light"
            >
              AgentFlow turns any goal into a structured, executable
              workflow. Plan, execute, and supervise AI tasks —{' '}
              all in one beautiful interface.
            </motion.p>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.78, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center justify-center gap-3 flex-wrap mb-14"
            >
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 14px 44px rgba(30,30,46,0.22)' }}
                whileTap={{ scale: 0.96 }}
                onClick={launch}
                className="flex items-center gap-2.5 px-7 py-3.5 rounded-2xl
                           bg-gray-950 text-white text-sm font-bold
                           shadow-lg transition-shadow"
              >
                <Play className="w-4 h-4" />
                Launch AgentFlow
              </motion.button>

              <motion.a
                href="#demo"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-7 py-3.5 rounded-2xl
                           bg-white/70 border border-black/[0.08]
                           text-sm font-semibold text-gray-600
                           hover:bg-white transition-all backdrop-blur-sm shadow-sm"
              >
                See demo
                <ChevronDown className="w-4 h-4" />
              </motion.a>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.95, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center justify-center gap-8 flex-wrap"
            >
              {STATS.map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-bold text-gray-900 font-display">{s.value}</div>
                  <div className="text-xs text-gray-400 font-medium mt-0.5">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2, duration: 1 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2
                       flex flex-col items-center gap-2"
          >
            <span className="text-[10px] text-gray-300 font-bold tracking-[0.2em] uppercase">
              Scroll
            </span>
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ChevronDown className="w-4 h-4 text-gray-300" />
            </motion.div>
          </motion.div>
        </section>

        {/* ═══════════════════════
            APP PREVIEW
        ═══════════════════════ */}
        <section id="demo" className="px-6 max-w-5xl mx-auto pt-4 pb-28">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true, margin: '-80px' }}
            style={{ y: cardY }}
          >
            <div className="text-center mb-6">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Live preview
              </span>
            </div>
            <div className="rounded-3xl bg-white/75 border border-black/[0.06]
                            shadow-[0_32px_80px_rgba(0,0,0,0.10)]
                            overflow-hidden backdrop-blur-md">
              {/* Browser chrome */}
              <div className="flex items-center gap-3 px-5 py-3.5
                              border-b border-black/[0.05] bg-white/60">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
                  <div className="w-3 h-3 rounded-full bg-green-400/70" />
                </div>
                <div className="flex-1 max-w-sm mx-auto">
                  <div className="bg-black/[0.04] rounded-lg px-3 py-1.5
                                  text-xs text-gray-400 text-center font-mono">
                    agentflow.app/workspace
                  </div>
                </div>
              </div>
              {/* 3-panel mock */}
              <div className="flex h-72 divide-x divide-black/[0.05]">
                <div className="w-56 flex-shrink-0 p-5 bg-white/40">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Your Goal</p>
                  <div className="rounded-xl bg-white/90 border border-black/[0.07]
                                  p-3 text-xs text-gray-600 mb-4 shadow-sm leading-relaxed">
                    Analyze competitor pricing and write a strategy memo
                  </div>
                  <div className="h-8 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500
                                  flex items-center justify-center gap-1.5 shadow-sm">
                    <Sparkles className="w-3 h-3 text-white" />
                    <span className="text-white text-xs font-bold">Run Agent</span>
                  </div>
                </div>
                <div className="flex-1 p-5 bg-white/20">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider
                                mb-3 flex items-center gap-1.5">
                    <GitBranch className="w-3 h-3" /> Execution · 2/4
                  </p>
                  <div className="space-y-2.5">
                    {[
                      { label: 'Research competitors', s: 'done' },
                      { label: 'Scrape pricing pages', s: 'done' },
                      { label: 'Analyze patterns', s: 'running' },
                      { label: 'Write strategy memo', s: 'pending' },
                    ].map((item, i) => (
                      <motion.div key={i}
                        initial={{ opacity: 0, x: -8 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        viewport={{ once: true }}
                        className={`rounded-xl border px-3.5 py-2.5 flex items-center
                                    gap-2.5 text-xs font-semibold
                                    ${item.s === 'done' ? 'bg-emerald-50/90 border-emerald-200/70 text-emerald-700' :
                            item.s === 'running' ? 'bg-blue-50/90   border-blue-200/60   text-blue-700' :
                              'bg-gray-50/80   border-gray-200/50   text-gray-400'}`}
                      >
                        {item.s === 'done' && <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                        {item.s === 'running' && <Zap className="w-3.5 h-3.5 flex-shrink-0 animate-pulse" />}
                        {item.s === 'pending' && <div className="w-3.5 h-3.5 rounded-full border-2 border-current flex-shrink-0 opacity-30" />}
                        {item.label}
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div className="w-52 flex-shrink-0 p-5 bg-white/40">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Output</p>
                  <div className="space-y-2.5">
                    {[
                      { title: 'Research', body: 'Found 12 competitors with full pricing data…' },
                      { title: 'Pricing data', body: 'Avg range $29–$149/mo across segments…' },
                    ].map((o, i) => (
                      <div key={i} className="rounded-xl bg-white/90 border border-black/[0.06] p-3 shadow-sm">
                        <p className="text-xs font-bold text-gray-700 mb-1">{o.title}</p>
                        <p className="text-[11px] text-gray-400 leading-relaxed">{o.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ═══════════════════════
            HOW IT WORKS
        ═══════════════════════ */}
        <section id="how-it-works" className="px-6 max-w-4xl mx-auto mb-28">
          <SectionHeader
            eyebrow="How it works"
            title="Four steps from idea to result"
            sub="No setup. No coding. Just describe what you want."
          />
          <div className="relative">
            <div className="hidden md:block absolute top-11 left-[calc(12.5%+18px)] right-[calc(12.5%+18px)]
                            h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { n: '01', label: 'Enter your goal', emoji: '🎯', g: 'from-blue-400 to-blue-600' },
                { n: '02', label: 'AI plans the steps', emoji: '🧠', g: 'from-violet-400 to-violet-600' },
                { n: '03', label: 'Agent executes', emoji: '⚡', g: 'from-pink-400 to-pink-600' },
                { n: '04', label: 'You supervise & guide', emoji: '🎛️', g: 'from-amber-400 to-amber-600' },
              ].map((s, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  viewport={{ once: true, margin: '-40px' }}
                  whileHover={{ y: -5, transition: { duration: 0.22 } }}
                  className="rounded-2xl bg-white/65 border border-black/[0.06] p-5
                             text-center backdrop-blur-sm shadow-sm hover:shadow-lg
                             hover:bg-white/90 transition-all"
                >
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${s.g}
                                   flex items-center justify-center mx-auto mb-3
                                   shadow-sm text-xl`}>
                    {s.emoji}
                  </div>
                  <div className="text-[10px] font-black text-gray-300 mb-1 font-mono tracking-widest">{s.n}</div>
                  <p className="text-sm font-bold text-gray-700">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════
            FEATURES
        ═══════════════════════ */}
        <section id="features" className="px-6 max-w-4xl mx-auto mb-28">
          <SectionHeader
            eyebrow="Features"
            title={
              <>Everything you need,{' '}
                <span className="font-display italic gradient-text-warm">
                  nothing you don't
                </span>
              </>
            }
            sub="AI power with full human control baked in from the start."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  viewport={{ once: true, margin: '-40px' }}
                  whileHover={{ y: -6, transition: { duration: 0.22 } }}
                  className={`rounded-2xl bg-gradient-to-br ${f.color}
                               border border-black/[0.05] p-7 shadow-sm
                               hover:shadow-xl transition-all group`}
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className={`inline-flex items-center justify-center w-11 h-11
                                     rounded-2xl bg-white/80 shadow-sm
                                     group-hover:scale-110 group-hover:shadow-md
                                     transition-all duration-300 ${f.accent}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full
                                      bg-white/60 border border-white/80 ${f.accent}`}>
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                  <div className={`mt-5 flex items-center gap-1.5 text-xs font-bold ${f.accent}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${f.dot}`} />
                    Learn more
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ═══════════════════════
            CTA
        ═══════════════════════ */}
        <section className="px-6 max-w-2xl mx-auto mb-24">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden
                       bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950
                       p-14 text-center shadow-2xl"
          >
            <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full
                            bg-blue-600/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full
                            bg-violet-600/20 blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 text-xs font-bold
                              px-3.5 py-1.5 rounded-full bg-white/10 text-white/60
                              border border-white/10 mb-5">
                <Sparkles className="w-3.5 h-3.5" /> Free to use
              </div>
              <h2 className="font-display text-4xl font-normal text-white mb-3
                             tracking-tight italic">
                Ready to run your first agent?
              </h2>
              <p className="text-gray-400 text-base mb-8 font-light">
                No setup required. Enter a goal and watch it execute in seconds.
              </p>
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 16px 50px rgba(99,102,241,0.45)' }}
                whileTap={{ scale: 0.96 }}
                onClick={launch}
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl
                           bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500
                           animate-gradient text-white text-sm font-bold
                           shadow-lg transition-shadow"
              >
                <Sparkles className="w-4 h-4" />
                Launch AgentFlow
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="text-center pb-12 text-xs text-gray-300 font-semibold tracking-wide">
          Built with Claude AI · AgentFlow © 2025
        </footer>
      </div>
    </>
  );
}

function SectionHeader({ eyebrow, title, sub }: {
  eyebrow: string; title: React.ReactNode; sub: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="text-center mb-12"
    >
      <span className="text-xs font-black text-violet-500 uppercase tracking-widest mb-3 block">
        {eyebrow}
      </span>
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight leading-tight">
        {title}
      </h2>
      <p className="text-gray-400 text-base max-w-md mx-auto font-light">{sub}</p>
    </motion.div>
  );
}