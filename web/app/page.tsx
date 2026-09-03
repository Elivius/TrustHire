"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Sparkles,
  ShieldCheck,
  Coins,
  Cpu,
  ArrowRight,
  Lock,
  Layers,
  FileCode2,
  Zap,
  Fingerprint,
  Vault,
  GitBranch,
  Terminal,
  CheckCheck,
  CircleDollarSign,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { GhostButton } from "@/components/ui/ghost-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import GooeyNav from "@/components/ui/gooey-nav";

// ─── Constants ──────────────────────────────────────────────────────────────

const LANDING_NAV_ITEMS = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "For Clients", href: "#roles" },
  { label: "For Freelancers", href: "#roles" },
  { label: "Features", href: "#features" },
];

// Custom easing matching the high-end skill spec
const EASE_OUT_EXPO: [number, number, number, number] = [0.32, 0.72, 0, 1];

// Stagger container + child animation variants
const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const fadeUpBlur = {
  hidden: { opacity: 0, y: 40, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: EASE_OUT_EXPO },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT_EXPO },
  },
};

// ─── Animated Score Ring ────────────────────────────────────────────────────

function ScoreRing({
  score,
  label,
  color,
  delay = 0,
}: {
  score: number;
  label: string;
  color: "violet" | "teal";
  delay?: number;
}) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;
    const timeout = setTimeout(() => {
      let current = 0;
      const interval = setInterval(() => {
        current += 1;
        if (current >= score) {
          setAnimatedScore(score);
          clearInterval(interval);
        } else {
          setAnimatedScore(current);
        }
      }, 12);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [isInView, score, delay]);

  const circumference = 2 * Math.PI * 42;
  const strokeOffset = circumference - (animatedScore / 100) * circumference;
  const strokeColor =
    color === "violet" ? "#8B5CF6" : "#2DD4BF";
  const glowColor =
    color === "violet"
      ? "drop-shadow(0 0 6px rgba(139,92,246,0.4))"
      : "drop-shadow(0 0 6px rgba(45,212,191,0.4))";

  return (
    <div ref={ref} className="flex flex-col items-center gap-1.5">
      <div className="relative w-[72px] h-[72px]">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full -rotate-90"
          style={{ filter: glowColor }}
        >
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="currentColor"
            className="text-black/[0.08] dark:text-white/[0.06]"
            strokeWidth="6"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={strokeColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            style={{
              transition: "stroke-dashoffset 1.2s cubic-bezier(0.32, 0.72, 0, 1)",
            }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-bold font-mono text-foreground">
          {animatedScore}
        </span>
      </div>
      <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-foreground/50">
        {label}
      </span>
    </div>
  );
}

// ─── Spotlight Card Wrapper ─────────────────────────────────────────────────

function SpotlightCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    cardRef.current.style.setProperty(
      "--spotlight-x",
      `${e.clientX - rect.left}px`
    );
    cardRef.current.style.setProperty(
      "--spotlight-y",
      `${e.clientY - rect.top}px`
    );
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`spotlight-card ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Animated Counter ───────────────────────────────────────────────────────

function AnimatedCounter({
  target,
  suffix = "",
  prefix = "",
  duration = 1500,
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const step = target / (duration / 16);
    const interval = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(interval);
  }, [isInView, target, duration]);

  return (
    <span ref={ref} className="metric-value">
      {prefix}
      {count}
      {suffix}
    </span>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [heroTab, setHeroTab] = useState<"ai" | "escrow">("ai");
  const [roleTab, setRoleTab] = useState<"client" | "freelancer">("client");

  return (
    <div className="min-h-screen bg-bg-base text-foreground flex flex-col selection:bg-[#7B61FF]/30 selection:text-white transition-colors duration-200 noise-overlay">
      {/* ═══════════════════════════════════════════════════════════════════
          Navigation — PRESERVED EXACTLY AS-IS
      ═══════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 w-full border-b border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-[#0B0B12]/80 backdrop-blur-xl transition-colors">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#4DA2FF] via-[#7B61FF] to-[#2DD4BF] flex items-center justify-center shadow-glass-glow group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              TrustHire
            </span>
          </Link>

          <div className="hidden md:flex items-center">
            <GooeyNav items={LANDING_NAV_ITEMS} />
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/auth">
              <GhostButton size="sm" variant="ghost">Sign In</GhostButton>
            </Link>
            <Link href="/auth">
              <GradientButton size="sm">Get Started</GradientButton>
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1 — HERO
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative pt-24 pb-12 md:pt-36 md:pb-20 px-4 overflow-hidden">
        {/* Ambient mesh gradient — GPU-safe, pointer-events-none */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-br from-[#4DA2FF]/12 via-[#7B61FF]/15 to-[#2DD4BF]/10 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute top-[200px] right-[10%] w-[300px] h-[300px] bg-[#8B5CF6]/10 blur-[100px] rounded-full pointer-events-none" />

        <motion.div
          className="max-w-5xl mx-auto text-center relative z-10"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Eyebrow — live status pill */}
          <motion.div variants={fadeUpBlur} className="mb-8">
            <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-[#8B5CF6]/20 bg-[#8B5CF6]/[0.06] text-[11px] font-medium tracking-[0.08em] uppercase text-[#7C3AED] dark:text-[#A78BFA] backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2DD4BF] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2DD4BF]" />
              </span>
              Gonka AI Active · Sui Testnet Live
            </span>
          </motion.div>

          {/* Display headline */}
          <motion.h1
            variants={fadeUpBlur}
            className="text-4xl sm:text-5xl md:text-[3.75rem] lg:text-7xl font-bold tracking-[-0.03em] text-foreground leading-[1.08] font-display"
          >
            AI decides who to trust.
            <br />
            <span className="text-gradient">Sui enforces it.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            className="mt-6 text-base sm:text-lg md:text-xl text-foreground/60 max-w-2xl mx-auto leading-relaxed"
          >
            Gonka AI scores trust from verified code and delivery history.
            Sui Move smart contracts escrow funds and auto-release per milestone.
            Zero platform custody.
          </motion.p>

          {/* CTA Group */}
          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
          >
            <Link href="/auth">
              <button className="group relative inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#4DA2FF] via-[#7B61FF] to-[#2DD4BF] px-7 py-3.5 text-[15px] font-semibold text-white shadow-glass-glow transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_0_30px_-4px_rgba(123,97,255,0.5)] active:scale-[0.97] cursor-pointer">
                Launch demo
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/15 group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-105 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]">
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>
            </Link>
            <a href="#how-it-works">
              <button className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[15px] font-medium text-foreground/80 border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.05] dark:hover:bg-white/[0.06] hover:border-black/20 dark:hover:border-white/15 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] cursor-pointer">
                See how it works
              </button>
            </a>
          </motion.div>

          {/* ─── Interactive Hero Showcase Widget ─────────────────────── */}
          <motion.div
            variants={fadeUpBlur}
            className="mt-16 md:mt-20 max-w-3xl mx-auto"
          >
            <div className="doppelrand">
              <div className="doppelrand-inner p-1">
                {/* Tab switcher */}
                <div className="flex items-center gap-1 p-1 rounded-full bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/[0.06] mx-auto w-fit mb-6 mt-4">
                  <button
                    onClick={() => setHeroTab("ai")}
                    className={`relative px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer ${
                      heroTab === "ai"
                        ? "text-white"
                        : "text-foreground/50 hover:text-foreground/70"
                    }`}
                  >
                    {heroTab === "ai" && (
                      <motion.div
                        layoutId="heroTab"
                        className="absolute inset-0 tab-active-indicator"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Trust Engine
                    </span>
                  </button>
                  <button
                    onClick={() => setHeroTab("escrow")}
                    className={`relative px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer ${
                      heroTab === "escrow"
                        ? "text-white"
                        : "text-foreground/50 hover:text-foreground/70"
                    }`}
                  >
                    {heroTab === "escrow" && (
                      <motion.div
                        layoutId="heroTab"
                        className="absolute inset-0 tab-active-indicator"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Vault className="w-3.5 h-3.5" />
                      Sui Smart Escrow
                    </span>
                  </button>
                </div>

                {/* Tab content */}
                <div className="min-h-[280px] sm:min-h-[260px] px-4 sm:px-8 pb-6">
                  <AnimatePresence mode="wait">
                    {heroTab === "ai" ? (
                      <motion.div
                        key="ai"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                        className="space-y-5"
                      >
                        {/* Simulated freelancer match card */}
                        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                          {/* Scores */}
                          <div className="flex gap-6">
                            <ScoreRing score={87} label="Trust" color="teal" delay={200} />
                            <ScoreRing score={94} label="Match" color="violet" delay={400} />
                          </div>
                          {/* Candidate info */}
                          <div className="text-left flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4DA2FF] to-[#7B61FF] flex items-center justify-center text-white text-xs font-bold">
                                AR
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-foreground">Alex Rivera</p>
                                <p className="text-[11px] text-foreground/50">Senior Move & Full-Stack Developer</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {["Sui Move", "TypeScript", "React", "Smart Contracts"].map((s) => (
                                <span key={s} className="px-2 py-0.5 rounded-md bg-[#8B5CF6]/[0.08] border border-[#8B5CF6]/15 text-[10px] font-medium text-[#7C3AED] dark:text-[#A78BFA]">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        {/* AI reasoning */}
                        <div className="rounded-xl bg-[#8B5CF6]/[0.04] border border-[#8B5CF6]/10 p-4">
                          <p className="text-xs text-foreground/70 leading-relaxed">
                            <span className="text-[#7C3AED] dark:text-[#A78BFA] font-medium">Gonka reasoning:</span>{" "}
                            Strong overlap across 4 of 5 required skills. 14 completed projects with 97% on-time delivery. GitHub verification confirms 847 commits to Move-based repos.
                          </p>
                          <p className="text-[10px] font-mono text-foreground/30 mt-2.5">
                            gonka_req_a7f2x9k1
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="escrow"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                        className="space-y-4"
                      >
                        {/* Escrow vault header */}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-foreground">Sui Merchant Payment App</p>
                            <p className="text-[11px] text-foreground/40">3 milestones · $4,500 USDC escrowed</p>
                          </div>
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2DD4BF]/10 border border-[#2DD4BF]/20 text-[10px] font-semibold text-[#0D9488] dark:text-[#2DD4BF]">
                            <Lock className="w-3 h-3" /> Secured
                          </span>
                        </div>
                        {/* Milestone progress */}
                        <div className="space-y-3">
                          {[
                            { title: "Move smart contract", pct: 40, amount: "$1,800", status: "released" as const },
                            { title: "Merchant portal", pct: 35, amount: "$1,575", status: "submitted" as const },
                            { title: "Checkout widget & docs", pct: 25, amount: "$1,125", status: "pending" as const },
                          ].map((m, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                  m.status === "released"
                                    ? "bg-[#2DD4BF]/15 text-[#0D9488] dark:text-[#2DD4BF]"
                                    : m.status === "submitted"
                                    ? "bg-[#F59E0B]/15 text-[#F59E0B]"
                                    : "bg-black/[0.04] dark:bg-white/5 text-foreground/30"
                                }`}
                              >
                                {m.status === "released" ? "✓" : `M${i + 1}`}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-foreground truncate">{m.title}</span>
                                  <span className="text-[11px] font-mono text-foreground/50 shrink-0 ml-2">{m.amount}</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.06] overflow-hidden">
                                  <motion.div
                                    className={`h-full rounded-full ${
                                      m.status === "released"
                                        ? "bg-[#2DD4BF]"
                                        : m.status === "submitted"
                                        ? "bg-[#F59E0B]"
                                        : "bg-black/[0.06] dark:bg-white/10"
                                    }`}
                                    initial={{ width: "0%" }}
                                    animate={{ width: m.status === "pending" ? "0%" : "100%" }}
                                    transition={{ duration: 1.2, delay: i * 0.3, ease: EASE_OUT_EXPO }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Tx hash */}
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[10px] font-mono text-foreground/25">
                            tx: 0x7a3f...e2b1 · View on Sui Explorer →
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2 — ECOSYSTEM METRICS STRIP
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-8 px-4">
        <motion.div
          className="max-w-4xl mx-auto doppelrand"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
        >
          <div className="doppelrand-inner grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-black/[0.06] dark:divide-white/[0.06] p-6 sm:p-8">
            {[
              {
                value: 100,
                suffix: "%",
                label: "On-chain escrow",
                sub: "Sui Move smart contracts",
                color: "text-[#0D9488] dark:text-[#2DD4BF]",
              },
              {
                value: 847,
                suffix: "+",
                label: "Commits verified",
                sub: "Gonka AI code proof",
                color: "text-[#7C3AED] dark:text-[#A78BFA]",
              },
              {
                value: 0,
                suffix: "",
                prefix: "$",
                label: "Custody risk",
                sub: "Funds release on approval only",
                color: "text-foreground",
              },
            ].map((m, i) => (
              <div key={i} className="text-center py-4 sm:py-0 sm:px-6 space-y-1">
                <div className={`text-2xl sm:text-3xl font-bold font-mono ${m.color}`}>
                  <AnimatedCounter target={m.value} suffix={m.suffix} prefix={m.prefix || ""} />
                </div>
                <div className="text-xs font-semibold text-foreground/70">{m.label}</div>
                <div className="text-[11px] text-foreground/40">{m.sub}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3 — HOW IT WORKS (ASYMMETRIC BENTO GRID)
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-28 md:py-36 px-4 max-w-7xl mx-auto w-full">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16 md:mb-20"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <motion.span
            variants={fadeUp}
            className="inline-block rounded-full px-3.5 py-1.5 text-[10px] uppercase tracking-[0.2em] font-medium border border-[#4DA2FF]/20 bg-[#4DA2FF]/[0.06] text-[#4DA2FF] mb-4"
          >
            The Web3 hiring engine
          </motion.span>
          <motion.h2
            variants={fadeUpBlur}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-[-0.02em] font-display"
          >
            Four steps from spec to payout
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mt-4 text-sm sm:text-base text-foreground/50 leading-relaxed"
          >
            Natural language project specs, AI-ranked candidates, on-chain escrow locks,
            and cryptographically guaranteed milestone releases.
          </motion.p>
        </motion.div>

        {/* Bento Grid — asymmetric 2×2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {/* Card 01 — Large: AI Reasoning Engine */}
          <motion.div
            initial={{ opacity: 0, y: 40, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
          >
            <SpotlightCard className="doppelrand h-full">
              <div className="doppelrand-inner p-7 sm:p-9 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#2563EB]/10 dark:bg-[#4DA2FF]/10 text-[#2563EB] dark:text-[#4DA2FF]">
                    <Terminal className="w-5 h-5" />
                  </span>
                  <span className="text-[11px] font-mono font-bold text-foreground/25 tracking-wider">01</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2 tracking-tight">
                  Gonka AI reasoning engine
                </h3>
                <p className="text-sm text-foreground/50 leading-relaxed mb-6">
                  Describe your project in plain English. Gonka parses intent, extracts structured deliverables, and generates an editable milestone plan with budget allocations.
                </p>
                {/* Mini terminal illustration */}
                <div className="mt-auto rounded-xl bg-black/[0.04] dark:bg-black/40 border border-black/[0.06] dark:border-white/[0.04] p-4 font-mono text-[11px] leading-relaxed space-y-1.5 overflow-hidden">
                  <p className="text-foreground/40 dark:text-foreground/30">
                    <span className="text-[#2563EB] dark:text-[#4DA2FF]">client</span> → &quot;I need a Sui payment app for small businesses&quot;
                  </p>
                  <p className="text-foreground/40 dark:text-foreground/30">
                    <span className="text-[#7C3AED] dark:text-[#A78BFA]">gonka</span> → Extracting scope...
                  </p>
                  <p className="text-foreground/60 dark:text-foreground/50">
                    <span className="text-[#0D9488] dark:text-[#2DD4BF]">output</span> → {"{"} title: &quot;Sui Merchant Payment App&quot;, skills: [&quot;Move&quot;, &quot;React&quot;], milestones: 3 {"}"}
                  </p>
                  <p className="text-foreground/25 dark:text-foreground/20">
                    req_id: gonka_req_k8m2v4n1
                  </p>
                </div>
              </div>
            </SpotlightCard>
          </motion.div>

          {/* Card 02 — Escrow Lock */}
          <motion.div
            initial={{ opacity: 0, y: 40, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE_OUT_EXPO }}
          >
            <SpotlightCard className="doppelrand h-full">
              <div className="doppelrand-inner p-7 sm:p-9 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#0D9488]/10 dark:bg-[#2DD4BF]/10 text-[#0D9488] dark:text-[#2DD4BF]">
                    <Vault className="w-5 h-5" />
                  </span>
                  <span className="text-[11px] font-mono font-bold text-foreground/25 tracking-wider">02</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2 tracking-tight">
                  Non-custodial escrow vault
                </h3>
                <p className="text-sm text-foreground/50 leading-relaxed mb-6">
                  USDC locks into a Sui Move smart contract. Neither party can unilaterally alter or withdraw funds. Release happens only on milestone approval.
                </p>
                <div className="mt-auto flex items-center gap-3 p-4 rounded-xl bg-[#2DD4BF]/[0.04] border border-[#2DD4BF]/10">
                  <Lock className="w-5 h-5 text-[#0D9488] dark:text-[#2DD4BF] shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">$4,500 USDC locked</p>
                    <p className="text-[11px] text-foreground/40">3 milestones · auto-release on approval</p>
                  </div>
                </div>
              </div>
            </SpotlightCard>
          </motion.div>

          {/* Card 03 — Trust Scoring */}
          <motion.div
            initial={{ opacity: 0, y: 40, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, delay: 0.2, ease: EASE_OUT_EXPO }}
          >
            <SpotlightCard className="doppelrand h-full">
              <div className="doppelrand-inner p-7 sm:p-9 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6]">
                    <Fingerprint className="w-5 h-5" />
                  </span>
                  <span className="text-[11px] font-mono font-bold text-foreground/25 tracking-wider">03</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2 tracking-tight">
                  Multi-factor trust matrix
                </h3>
                <p className="text-sm text-foreground/50 leading-relaxed mb-6">
                  Gonka evaluates profile completeness, verified GitHub commits, on-chain delivery history, and client ratings into a transparent 0–100 Trust Score.
                </p>
                <div className="mt-auto grid grid-cols-3 gap-3">
                  {[
                    { label: "Code proof", val: "92" },
                    { label: "Delivery", val: "97%" },
                    { label: "Rating", val: "4.9" },
                  ].map((d) => (
                    <div key={d.label} className="text-center p-3 rounded-lg bg-[#8B5CF6]/[0.04] border border-[#8B5CF6]/10">
                      <div className="text-base font-bold font-mono text-[#7C3AED] dark:text-[#A78BFA]">{d.val}</div>
                      <div className="text-[10px] text-foreground/40 mt-0.5">{d.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </SpotlightCard>
          </motion.div>

          {/* Card 04 — Milestone Payouts */}
          <motion.div
            initial={{ opacity: 0, y: 40, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, delay: 0.3, ease: EASE_OUT_EXPO }}
          >
            <SpotlightCard className="doppelrand h-full">
              <div className="doppelrand-inner p-7 sm:p-9 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#10B981]/10 text-[#10B981]">
                    <CircleDollarSign className="w-5 h-5" />
                  </span>
                  <span className="text-[11px] font-mono font-bold text-foreground/25 tracking-wider">04</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2 tracking-tight">
                  Instant milestone payouts
                </h3>
                <p className="text-sm text-foreground/50 leading-relaxed mb-6">
                  Client approves a deliverable, the Move contract releases funds to the freelancer&apos;s wallet in the same transaction. Verified on-chain with a Sui Explorer link.
                </p>
                <div className="mt-auto flex items-center gap-3 p-4 rounded-xl bg-[#10B981]/[0.04] border border-[#10B981]/10">
                  <CheckCheck className="w-5 h-5 text-[#10B981] shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Milestone 1 released</p>
                    <p className="text-[10px] font-mono text-foreground/30">0x7a3f...e2b1 · $1,800 USDC → 0x4f2a...9a2c</p>
                  </div>
                </div>
              </div>
            </SpotlightCard>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4 — DUAL ROLE EXPERIENCE
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="roles" className="py-28 md:py-36 px-4 max-w-7xl mx-auto w-full">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <motion.span
            variants={fadeUp}
            className="inline-block rounded-full px-3.5 py-1.5 text-[10px] uppercase tracking-[0.2em] font-medium border border-[#7B61FF]/20 bg-[#7B61FF]/[0.06] text-[#7C3AED] dark:text-[#A78BFA] mb-4"
          >
            Two sides, one platform
          </motion.span>
          <motion.h2
            variants={fadeUpBlur}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-[-0.02em] font-display"
          >
            Built for both sides of the table
          </motion.h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
        >
          <div className="doppelrand max-w-4xl mx-auto">
            <div className="doppelrand-inner overflow-hidden">
              {/* Tab bar */}
              <div className="flex items-center gap-1 p-1.5 m-4 mb-0 rounded-full bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/[0.06] w-fit mx-auto">
                <button
                  onClick={() => setRoleTab("client")}
                  className={`relative px-6 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer ${
                    roleTab === "client"
                      ? "text-white"
                      : "text-foreground/50 hover:text-foreground/70"
                  }`}
                >
                  {roleTab === "client" && (
                    <motion.div
                      layoutId="roleTab"
                      className="absolute inset-0 bg-gradient-to-r from-[#4DA2FF] to-[#7B61FF] rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">For clients</span>
                </button>
                <button
                  onClick={() => setRoleTab("freelancer")}
                  className={`relative px-6 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer ${
                    roleTab === "freelancer"
                      ? "text-white"
                      : "text-foreground/50 hover:text-foreground/70"
                  }`}
                >
                  {roleTab === "freelancer" && (
                    <motion.div
                      layoutId="roleTab"
                      className="absolute inset-0 bg-gradient-to-r from-[#8B5CF6] to-[#2DD4BF] rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">For freelancers</span>
                </button>
              </div>

              {/* Tab content */}
              <div className="p-6 sm:p-10">
                <AnimatePresence mode="wait">
                  {roleTab === "client" ? (
                    <motion.div
                      key="client"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
                    >
                      <div className="space-y-5">
                        <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                          Hire verified Web3 talent in minutes
                        </h3>
                        <p className="text-sm text-foreground/50 leading-relaxed">
                          Describe your project naturally. Gonka AI parses your spec into structured milestones and ranks candidates by mathematical trust scoring — not résumé claims.
                        </p>
                        <ul className="space-y-3 text-sm text-foreground/70">
                          {[
                            "AI generates milestone plans from conversation",
                            "Zero custody risk — funds locked in Sui escrow",
                            "Pay only when deliverables meet your criteria",
                          ].map((item) => (
                            <li key={item} className="flex items-start gap-2.5">
                              <span className="mt-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-[#2DD4BF]/10 text-[#0D9488] dark:text-[#2DD4BF] shrink-0">
                                <ChevronRight className="w-3 h-3" />
                              </span>
                              {item}
                            </li>
                          ))}
                        </ul>
                        <Link href="/auth" className="inline-block pt-2">
                          <button className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#4DA2FF] to-[#7B61FF] px-6 py-3 text-sm font-semibold text-white shadow-glass-glow hover:shadow-[0_0_25px_-4px_rgba(77,162,255,0.4)] active:scale-[0.97] transition-all duration-300 cursor-pointer">
                            Post a project
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/15 group-hover:translate-x-0.5 transition-transform">
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </button>
                        </Link>
                      </div>
                      {/* Mini UI preview */}
                      <div className="rounded-2xl bg-black/[0.03] dark:bg-white/[0.02] border border-black/5 dark:border-white/[0.06] p-5 space-y-4">
                        <div className="flex items-center gap-2 text-[11px] text-foreground/40">
                          <Sparkles className="w-3.5 h-3.5 text-[#7C3AED] dark:text-[#A78BFA]" />
                          AI-recommended candidates
                        </div>
                        {[
                          { name: "Alex Rivera", score: 94, trust: 87 },
                          { name: "Priya Sharma", score: 89, trust: 82 },
                          { name: "Marcus Chen", score: 76, trust: 91 },
                        ].map((c, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-white/[0.03] border border-black/5 dark:border-white/[0.05]">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#4DA2FF]/60 to-[#7B61FF]/60 flex items-center justify-center text-white text-[10px] font-bold">
                                {c.name.split(" ").map(n => n[0]).join("")}
                              </div>
                              <span className="text-xs font-medium text-foreground">{c.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-bold text-[#7C3AED] dark:text-[#A78BFA]">{c.score}%</span>
                              <span className="text-[10px] font-mono text-[#0D9488] dark:text-[#2DD4BF]">{c.trust}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="freelancer"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
                    >
                      <div className="space-y-5">
                        <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                          Get matched and get paid with certainty
                        </h3>
                        <p className="text-sm text-foreground/50 leading-relaxed">
                          Build your on-chain reputation with verified GitHub contributions and completed milestones. Escrow is funded before you write a single line of code.
                        </p>
                        <ul className="space-y-3 text-sm text-foreground/70">
                          {[
                            "Gonka Trust Score highlights your verified track record",
                            "Escrow is funded before you start working",
                            "Automatic milestone releases straight to your wallet",
                          ].map((item) => (
                            <li key={item} className="flex items-start gap-2.5">
                              <span className="mt-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] shrink-0">
                                <ChevronRight className="w-3 h-3" />
                              </span>
                              {item}
                            </li>
                          ))}
                        </ul>
                        <Link href="/auth" className="inline-block pt-2">
                          <button className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#2DD4BF] px-6 py-3 text-sm font-semibold text-white shadow-ai-glow hover:shadow-[0_0_25px_-4px_rgba(139,92,246,0.4)] active:scale-[0.97] transition-all duration-300 cursor-pointer">
                            Create profile
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/15 group-hover:translate-x-0.5 transition-transform">
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </button>
                        </Link>
                      </div>
                      {/* Mini UI preview */}
                      <div className="rounded-2xl bg-black/[0.03] dark:bg-white/[0.02] border border-black/5 dark:border-white/[0.06] p-5 space-y-5">
                        {/* GitHub proof */}
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-white/[0.03] border border-black/5 dark:border-white/[0.05]">
                          <GitBranch className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF] shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-foreground">GitHub Verified</p>
                            <p className="text-[10px] text-foreground/40">847 commits · 12 Move repos</p>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#2DD4BF]/10 text-[#0D9488] dark:text-[#2DD4BF] border border-[#2DD4BF]/20">
                            ✓ Verified
                          </span>
                        </div>
                        {/* Trust Score */}
                        <div className="text-center space-y-2 py-3">
                          <div className="text-3xl font-bold font-mono text-[#0D9488] dark:text-[#2DD4BF]">87<span className="text-lg text-foreground/30">/100</span></div>
                          <div className="text-[11px] text-foreground/40">Gonka Trust Score · High Confidence</div>
                        </div>
                        {/* Trust factors */}
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: "Code", val: "92" },
                            { label: "On-time", val: "97%" },
                            { label: "Rating", val: "4.9" },
                          ].map((d) => (
                            <div key={d.label} className="text-center p-2 rounded-lg bg-white/50 dark:bg-white/[0.03] border border-black/5 dark:border-white/[0.05]">
                              <div className="text-sm font-bold font-mono text-foreground">{d.val}</div>
                              <div className="text-[10px] text-foreground/30">{d.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 5 — FEATURE GRID
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="features" className="py-28 md:py-36 px-4 max-w-6xl mx-auto w-full">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <motion.span
            variants={fadeUp}
            className="inline-block rounded-full px-3.5 py-1.5 text-[10px] uppercase tracking-[0.2em] font-medium border border-[#2DD4BF]/20 bg-[#2DD4BF]/[0.06] text-[#0D9488] dark:text-[#2DD4BF] mb-4"
          >
            Platform capabilities
          </motion.span>
          <motion.h2
            variants={fadeUpBlur}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-[-0.02em] font-display"
          >
            Everything you need, on-chain
          </motion.h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: Sparkles,
              title: "AI matching",
              desc: "Bidirectional Gonka AI ranking with transparent reasoning and verifiable Request IDs.",
              accent: "#8B5CF6",
            },
            {
              icon: Fingerprint,
              title: "Trust scores",
              desc: "Multi-factor 0–100 scoring from verified code, delivery history, and client ratings.",
              accent: "#2DD4BF",
            },
            {
              icon: Lock,
              title: "Smart escrow",
              desc: "Sui Move contracts lock USDC with milestone-gated release. Zero platform custody.",
              accent: "#4DA2FF",
            },
            {
              icon: CircleDollarSign,
              title: "Milestone payouts",
              desc: "Automated fund release on client approval. Verifiable on Sui Explorer.",
              accent: "#10B981",
            },
            {
              icon: GitBranch,
              title: "GitHub code proof",
              desc: "Gonka scans verified public repos to prevent impersonation and boost trust confidence.",
              accent: "#A78BFA",
            },
            {
              icon: BarChart3,
              title: "On-chain reputation",
              desc: "Immutable delivery records, ratings, and on-time metrics tied to wallet addresses.",
              accent: "#F59E0B",
            },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.7, delay: i * 0.08, ease: EASE_OUT_EXPO }}
              >
                <SpotlightCard className="doppelrand h-full">
                  <div className="doppelrand-inner p-6 h-full">
                    <span
                      className="inline-flex items-center justify-center w-9 h-9 rounded-xl mb-4"
                      style={{
                        backgroundColor: `${f.accent}15`,
                        color: f.accent,
                      }}
                    >
                      <Icon className="w-4.5 h-4.5" />
                    </span>
                    <h3 className="text-base font-semibold text-foreground mb-1.5 tracking-tight">
                      {f.title}
                    </h3>
                    <p className="text-xs text-foreground/50 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </SpotlightCard>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 6 — FINAL CTA PORTAL
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-28 md:py-36 px-4">
        <motion.div
          className="max-w-4xl mx-auto relative overflow-hidden rounded-[2rem] border border-black/[0.08] dark:border-white/[0.06] bg-gradient-to-br from-[#f0f0f8] to-[#e8e8f4] dark:from-[#151622] dark:to-[#0B0B12] p-12 sm:p-16 text-center dot-grid"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
        >
          {/* Ambient glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[250px] bg-gradient-to-r from-[#4DA2FF]/15 via-[#7B61FF]/20 to-[#2DD4BF]/15 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-[-0.02em] font-display">
              Start building trust today
            </h2>
            <p className="text-base text-foreground/50 max-w-lg mx-auto leading-relaxed">
              Whether you&apos;re hiring or building — your funds are secured, your reputation is verifiable, and every AI decision is auditable.
            </p>
            <div className="flex items-center justify-center pt-4">
              <Link href="/auth">
                <button className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#4DA2FF] via-[#7B61FF] to-[#2DD4BF] px-8 py-4 text-base font-semibold text-white shadow-glass-glow hover:shadow-[0_0_35px_-4px_rgba(123,97,255,0.5)] active:scale-[0.97] transition-all duration-300 cursor-pointer">
                  Get started free
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/15 group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-105 transition-transform duration-300">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 7 — FOOTER
      ═══════════════════════════════════════════════════════════════════ */}
      <footer className="mt-auto border-t border-black/[0.06] dark:border-white/[0.06] py-12 px-4 transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#4DA2FF] via-[#7B61FF] to-[#2DD4BF] flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-foreground/70">TrustHire</span>
              <span className="text-[10px] text-foreground/30 font-mono">Prototype · 2026</span>
            </div>

            {/* Nav links */}
            <nav className="flex items-center gap-6 text-xs text-foreground/40">
              <Link href="/client/dashboard" className="hover:text-foreground/70 transition-colors">Client portal</Link>
              <Link href="/freelancer/dashboard" className="hover:text-foreground/70 transition-colors">Freelancer portal</Link>
              <Link href="/role-selection" className="hover:text-foreground/70 transition-colors">Role picker</Link>
              <span className="text-foreground/15">·</span>
              <span className="text-foreground/25">Privacy</span>
              <span className="text-foreground/25">Terms</span>
            </nav>
          </div>

          {/* Attribution */}
          <div className="mt-8 pt-6 border-t border-black/[0.04] dark:border-white/[0.04] text-center">
            <p className="text-[11px] text-foreground/25 font-mono">
              AI matching powered by Gonka Router · Escrow contracts on Sui Network · All transactions verifiable on Suiscan
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
