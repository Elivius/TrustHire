"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  Coins,
  Cpu,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  FileCode2,
  UserCheck
} from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { GhostButton } from "@/components/ui/ghost-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B0B12] text-foreground flex flex-col selection:bg-[#7B61FF]/30 selection:text-white">
      {/* Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0B0B12]/80 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#4DA2FF] via-[#7B61FF] to-[#2DD4BF] flex items-center justify-center shadow-glass-glow group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              TrustHire
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#2DD4BF]/10 text-[#2DD4BF] border border-[#2DD4BF]/20 font-medium">
                Prototype
              </span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-foreground/75">
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#for-clients" className="hover:text-white transition-colors">For Clients</a>
            <a href="#for-freelancers" className="hover:text-white transition-colors">For Freelancers</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
          </nav>

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

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 px-4 overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#4DA2FF]/20 via-[#7B61FF]/20 to-[#2DD4BF]/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-xs font-medium text-[#A78BFA] backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Gonka AI Matching & Sui Smart Escrow</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.15]">
            Hire and get hired with{" "}
            <span className="text-gradient">AI-verified trust</span>
            <br />
            payments secured on-chain.
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            TrustHire combines Gonka AI reputation scoring with non-custodial Sui escrow smart contracts. Zero platform risk, automated milestone payouts.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <Link href="/auth">
              <GradientButton size="lg" icon={<ArrowRight className="w-4 h-4 ml-1" />}>
                Launch Prototype
              </GradientButton>
            </Link>
            <a href="#how-it-works">
              <GhostButton size="lg" variant="outline">
                See How It Works
              </GhostButton>
            </a>
          </div>
        </div>

        {/* Live Trust Metrics Strip */}
        <div className="max-w-4xl mx-auto mt-16 p-4 sm:p-6 rounded-2xl border border-white/10 bg-[#151622]/80 backdrop-blur-xl grid grid-cols-1 sm:grid-cols-3 gap-6 text-center divide-y sm:divide-y-0 sm:divide-x divide-white/10 shadow-2xl">
          <div className="space-y-1 sm:px-4">
            <div className="text-xl sm:text-2xl font-bold text-[#2DD4BF] font-mono">100% On-Chain</div>
            <div className="text-xs text-foreground/60">Escrow contracts secured on Sui</div>
          </div>
          <div className="space-y-1 sm:px-4 pt-4 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-[#A78BFA] font-mono">Gonka Router AI</div>
            <div className="text-xs text-foreground/60">Autonomous skill & trust verification</div>
          </div>
          <div className="space-y-1 sm:px-4 pt-4 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-white font-mono">$0 Custody Risk</div>
            <div className="text-xs text-foreground/60">Funds release only upon milestone approval</div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 max-w-7xl mx-auto w-full border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#4DA2FF]">
            Architecture & Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            How TrustHire Works
          </h2>
          <p className="text-sm text-foreground/70">
            A frictionless 4-step loop from natural language project specs to cryptographically guaranteed milestone payouts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: "01",
              title: "Post or Build Profile",
              desc: "Clients describe needs in plain English (AI parses budget & milestones); freelancers connect credentials and skills.",
              icon: Cpu,
              color: "text-[#4DA2FF]"
            },
            {
              step: "02",
              title: "AI Match & Trust Scores",
              desc: "Gonka AI evaluates past on-chain delivery, repo quality, and assigns transparent Trust Scores (0–100).",
              icon: Sparkles,
              color: "text-[#8B5CF6]"
            },
            {
              step: "03",
              title: "On-Chain Escrow Lock",
              desc: "Client approves terms and locks USDC into Sui smart contracts. Neither party can unilaterally alter funds.",
              icon: Lock,
              color: "text-[#2DD4BF]"
            },
            {
              step: "04",
              title: "Milestone Payouts",
              desc: "Freelancer submits deliverables with hash proofs; approved milestones trigger instant on-chain fund release.",
              icon: Coins,
              color: "text-[#10B981]"
            }
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.step}
                className="relative rounded-2xl border border-white/10 bg-[#151622]/60 p-6 backdrop-blur-md hover:border-white/20 transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-xl bg-white/5 ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-foreground/30 group-hover:text-foreground/60 transition-colors">
                    {card.step}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{card.title}</h3>
                <p className="text-xs text-foreground/65 leading-relaxed">{card.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Dual Value Proposition */}
      <section className="py-16 px-4 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* For Clients */}
          <div id="for-clients" className="rounded-3xl border border-[#4DA2FF]/20 bg-gradient-to-br from-[#151622] to-[#151622]/50 p-8 sm:p-10 space-y-6 relative overflow-hidden">
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#4DA2FF] font-semibold">For Clients & DAOs</span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white">Hire verified Web3 talent in minutes</h3>
              <p className="text-xs sm:text-sm text-foreground/70 leading-relaxed">
                Stop guessing resume claims. Gonka AI parses your project spec and matches top performers with mathematical trust scoring.
              </p>
            </div>

            <ul className="space-y-2.5 text-xs sm:text-sm text-foreground/80">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2DD4BF] shrink-0" />
                <span>AI generates structured milestone plans from natural text</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2DD4BF] shrink-0" />
                <span>Zero custody risk — funds locked in transparent Sui escrow</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2DD4BF] shrink-0" />
                <span>Pay only when deliverables meet your milestone criteria</span>
              </li>
            </ul>

            <Link href="/auth" className="inline-block pt-2">
              <GradientButton size="md">Post a Project as Client</GradientButton>
            </Link>
          </div>

          {/* For Freelancers */}
          <div id="for-freelancers" className="rounded-3xl border border-[#7B61FF]/20 bg-gradient-to-br from-[#151622] to-[#151622]/50 p-8 sm:p-10 space-y-6 relative overflow-hidden">
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#A78BFA] font-semibold">For Freelancers & Devs</span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white">Get matched & get paid with certainty</h3>
              <p className="text-xs sm:text-sm text-foreground/70 leading-relaxed">
                Build your on-chain reputation score. Win projects that match your exact stack with 100% guaranteed escrow reserves.
              </p>
            </div>

            <ul className="space-y-2.5 text-xs sm:text-sm text-foreground/80">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#A78BFA] shrink-0" />
                <span>Gonka Trust Score highlights your verified skills and track record</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#A78BFA] shrink-0" />
                <span>Escrow is funded before you write a single line of code</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#A78BFA] shrink-0" />
                <span>Automatic milestone releases straight to your Sui wallet address</span>
              </li>
            </ul>

            <Link href="/auth" className="inline-block pt-2">
              <GradientButton size="md" variant="ai">Create Freelancer Profile</GradientButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Strip */}
      <section id="features" className="py-16 px-4 border-t border-white/5 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {[
            { label: "AI Matching", desc: "Vector ranking", icon: Sparkles },
            { label: "Trust Scores", desc: "0–100 reputation", icon: ShieldCheck },
            { label: "Smart Escrow", desc: "Sui Move contracts", icon: Lock },
            { label: "Milestone Releases", desc: "Automated payouts", icon: Coins },
            { label: "On-Chain History", desc: "Verifiable proofs", icon: FileCode2 }
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.label} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] text-center space-y-1.5">
                <Icon className="w-5 h-5 mx-auto text-[#4DA2FF]" />
                <div className="font-semibold text-xs text-white">{f.label}</div>
                <div className="text-[11px] text-foreground/50">{f.desc}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10 bg-[#0B0B12] py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-foreground/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#7B61FF]" />
            <span className="font-semibold text-foreground/80">TrustHire Prototype</span>
            <span>— AI matching powered by Gonka, escrow on Sui</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/client/dashboard" className="hover:text-foreground">Client Portal</Link>
            <Link href="/freelancer/dashboard" className="hover:text-foreground">Freelancer Portal</Link>
            <Link href="/role-selection" className="hover:text-foreground">Role Picker</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
