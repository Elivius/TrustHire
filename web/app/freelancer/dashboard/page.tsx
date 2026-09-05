"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  Compass,
  Coins,
  Briefcase,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Wallet,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  TrendingUp,
} from "lucide-react";
import { clsx } from "clsx";
import { useApp } from "@/context/app-context";
import { AppShell } from "@/components/layout/app-shell";
import { GradientButton } from "@/components/ui/gradient-button";
import { GhostButton } from "@/components/ui/ghost-button";
import { GlassCard } from "@/components/ui/glass-card";
import { ScoreBadge } from "@/components/ui/score-badge";
import { SkillChip } from "@/components/ui/skill-chip";
import { StatusBadge } from "@/components/ui/status-badge";
import { MilestoneStepper } from "@/components/ui/milestone-stepper";
import { computeFreelancerMatchForProject } from "@/lib/simulation";
import { formatSuiAddress } from "@/lib/sui/escrow";
import { useCurrentAccount, useCurrentClient } from "@mysten/dapp-kit-react";

export default function FreelancerDashboardPage() {
  const {
    currentUser,
    projects,
    milestones,
    freelancerProfiles,
    transactions
  } = useApp();

  const currentAccount = useCurrentAccount();
  const client = useCurrentClient();
  const effectiveAddress =
    currentAccount?.address || currentUser?.walletAddress;

  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchWalletBalance = useCallback(async () => {
    if (!effectiveAddress) {
      setWalletBalance(null);
      return;
    }

    setIsLoadingBalance(true);
    try {
      if (client && typeof client.getBalance === "function") {
        const res: any = await client.getBalance({ owner: effectiveAddress });
        const rawBalance =
          res?.balance?.balance ??
          res?.balance?.coinBalance ??
          res?.totalBalance;

        if (rawBalance !== undefined && rawBalance !== null) {
          const sui = Number(BigInt(rawBalance)) / 1_000_000_000;
          setWalletBalance(sui);
          return;
        }
      }
      setWalletBalance(0);
    } catch (err) {
      console.warn("Could not fetch on-chain Sui balance:", err);
      setWalletBalance(0);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [client, effectiveAddress]);

  useEffect(() => {
    fetchWalletBalance();
  }, [fetchWalletBalance]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!effectiveAddress) return;
    navigator.clipboard.writeText(effectiveAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const profile =
    (effectiveAddress ? freelancerProfiles[effectiveAddress] : undefined) ||
    freelancerProfiles[currentUser.id] ||
    (currentUser.walletAddress ? freelancerProfiles[currentUser.walletAddress] : undefined) ||
    Object.entries(freelancerProfiles).find(
      ([k]) =>
        (effectiveAddress && k.toLowerCase() === effectiveAddress.toLowerCase()) ||
        k.toLowerCase() === currentUser.id.toLowerCase() ||
        (currentUser.walletAddress && k.toLowerCase() === currentUser.walletAddress.toLowerCase())
    )?.[1] || {
      trustScore: 90,
      trustScoreConfidence: "High" as const,
      headline: "Senior Move & Full-Stack Developer",
      skills: ["React", "TypeScript", "Sui Move", "Smart Contracts"],
      completedProjectsCount: 0
    };

  const myMatchedProjects = projects.filter(
    (p) =>
      Boolean(p.matchedFreelancerId) &&
      (p.matchedFreelancerId === currentUser.id ||
        (effectiveAddress &&
          p.matchedFreelancerId?.toLowerCase() === effectiveAddress.toLowerCase()) ||
        (currentUser.walletAddress &&
          p.matchedFreelancerId?.toLowerCase() === currentUser.walletAddress.toLowerCase()) ||
        p.matchedFreelancerId?.toLowerCase() === currentUser.id.toLowerCase())
  );
  const activeContracts = myMatchedProjects.filter(
    (p) => p.status === "in_progress" || p.status === "matched"
  );
  const completedProjects = myMatchedProjects.filter(
    (p) => p.status === "completed"
  );

  // Derive released payouts from both database milestones and in-memory transactions (matching freelancer/earnings)
  const releasedMilestones = milestones.filter(
    (m) =>
      m.status === "released" &&
      myMatchedProjects.some((p) => p.id === m.projectId)
  );

  const releasedPayoutAmounts = [
    ...releasedMilestones.map((m) => m.amount),
    ...transactions
      .filter(
        (t) =>
          t.type === "milestone_released" &&
          myMatchedProjects.some((p) => p.id === t.projectId) &&
          !releasedMilestones.some(
            (m) => m.onChainTxHash && m.onChainTxHash === t.txHash
          )
      )
      .map((t) => t.amount),
  ];

  const totalEarned = releasedPayoutAmounts.reduce((sum, a) => sum + a, 0);

  const openProjects = projects.filter((p) => p.status === "open");

  return (
    <AppShell>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Header with Trust Score Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Welcome back, {(currentUser.name || "Freelancer").split(" ")[0]}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#2DD4BF]/10 text-[#0D9488] dark:text-[#2DD4BF] border border-[#2DD4BF]/30 font-semibold font-mono">
                Trust Score: {profile.trustScore}/100
              </span>
            </div>
            <Link
              href="/freelancer/profile"
              className="text-xs text-[#0D9488] dark:text-[#2DD4BF] hover:underline flex items-center gap-1 mt-0.5"
            >
              <span>View full Gonka AI trust score breakdown</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <Link href="/freelancer/browse">
            <GradientButton size="md" icon={<Compass className="w-4 h-4" />}>
              Browse Open Projects
            </GradientButton>
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 items-stretch">
          {/* Card 1: Active Contracts */}
          <GlassCard className="p-3.5 sm:p-4 rounded-xl h-full flex flex-col justify-between relative overflow-hidden group hover:border-black/20 dark:hover:border-white/20 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-foreground/50 flex items-center gap-1.5">
                  <Briefcase className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                  <span>Active Contracts</span>
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-semibold">
                  Live
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-foreground mt-1 font-mono">
                {activeContracts.length}
              </div>
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5 dark:border-white/5 text-[10px]">
              <span className="text-foreground/50">In development</span>
              <span className="text-[9px] font-mono text-foreground/40">Milestones</span>
            </div>
          </GlassCard>

          {/* Card 2: Total Earned (All-Time) */}
          <Link href="/freelancer/earnings" className="block h-full group">
            <GlassCard className="p-3.5 sm:p-4 rounded-xl h-full flex flex-col justify-between relative overflow-hidden hover:border-[#0D9488]/40 dark:hover:border-[#2DD4BF]/40 transition-all cursor-pointer">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-foreground/50 flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-[#0D9488] dark:text-[#2DD4BF]" />
                    <span>Total Earned</span>
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#0D9488]/10 text-[#0D9488] dark:text-[#2DD4BF] border border-[#0D9488]/20 font-semibold">
                    On-Chain
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-[#0D9488] dark:text-[#2DD4BF] mt-1 font-mono flex items-baseline gap-1.5">
                  <span>{totalEarned.toLocaleString()}</span>
                  <span className="text-xs font-normal text-foreground/60">SUI</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5 dark:border-white/5 text-[10px]">
                <span className="text-[#0D9488] dark:text-[#2DD4BF] font-medium flex items-center gap-1 group-hover:underline">
                  <span>View proof</span>
                  <ArrowRight className="w-2.5 h-2.5 transition-transform group-hover:translate-x-0.5" />
                </span>
                <span className="text-[9px] font-mono text-[#0D9488]/70 dark:text-[#2DD4BF]/70">Verified</span>
              </div>
            </GlassCard>
          </Link>

          {/* Card 3: Completed Projects */}
          <GlassCard className="p-3.5 sm:p-4 rounded-xl h-full flex flex-col justify-between relative overflow-hidden group hover:border-black/20 dark:hover:border-white/20 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-foreground/50 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                  <span>Completed</span>
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                  100%
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-foreground mt-1 font-mono">
                {completedProjects.length}
              </div>
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5 dark:border-white/5 text-[10px]">
              <span className="text-foreground/50">On-chain delivery</span>
              <span className="text-[9px] font-mono text-foreground/40">Gonka AI</span>
            </div>
          </GlassCard>

          {/* Card 4: Connected Sui Wallet Balance */}
          <GlassCard className="p-3.5 sm:p-4 rounded-xl h-full flex flex-col justify-between relative overflow-hidden group hover:border-black/20 dark:hover:border-white/20 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-foreground/50 flex items-center gap-1.5">
                  <Wallet className="w-3 h-3 text-[#2563EB] dark:text-[#4DA2FF]" />
                  <span>Wallet Balance</span>
                </span>
                <button
                  type="button"
                  onClick={fetchWalletBalance}
                  title="Refresh balance from Sui"
                  className="text-foreground/40 hover:text-foreground p-0.5 rounded transition-colors"
                >
                  <RefreshCw
                    className={clsx(
                      "w-2.5 h-2.5 transition-transform",
                      isLoadingBalance && "animate-spin text-[#2563EB]"
                    )}
                  />
                </button>
              </div>

              <div className="text-xl sm:text-2xl font-bold text-[#2563EB] dark:text-[#4DA2FF] mt-1 font-mono flex items-baseline gap-1.5">
                {isLoadingBalance && walletBalance === null ? (
                  <span className="animate-pulse text-foreground/40 text-base">
                    Loading...
                  </span>
                ) : (
                  <>
                    <span>
                      {walletBalance !== null
                        ? walletBalance.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 4,
                          })
                        : "0.00"}
                    </span>
                    <span className="text-xs font-normal text-foreground/60">
                      SUI
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5 dark:border-white/5 text-[10px] font-mono">
              <div className="flex items-center gap-1 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse shrink-0" />
                <span
                  className="text-foreground/60 truncate max-w-[75px]"
                  title={effectiveAddress}
                >
                  {effectiveAddress
                    ? formatSuiAddress(effectiveAddress)
                    : "Not Connected"}
                </span>
                {effectiveAddress && (
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-foreground/40 hover:text-foreground transition-colors p-0.5 shrink-0"
                    title="Copy address"
                  >
                    {copied ? (
                      <Check className="w-2.5 h-2.5 text-[#10B981]" />
                    ) : (
                      <Copy className="w-2.5 h-2.5" />
                    )}
                  </button>
                )}
              </div>

              {effectiveAddress && (
                <a
                  href={`https://suiscan.xyz/testnet/account/${effectiveAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2563EB] dark:text-[#4DA2FF] hover:underline flex items-center gap-0.5 text-[9px] shrink-0"
                  title="View on Suiscan Explorer"
                >
                  <span>Suiscan</span>
                  <ExternalLink className="w-2 h-2" />
                </a>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Active Work Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#2563EB] dark:text-[#4DA2FF]" />
              <span>Active Work & Contracts</span>
            </h2>
            <Link href="/freelancer/active-work" className="text-xs text-[#2563EB] dark:text-[#4DA2FF] hover:underline flex items-center gap-1">
              <span>View all active contracts</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {activeContracts.length === 0 ? (
            <GlassCard className="text-center py-8 sm:py-10 flex flex-col items-center justify-center gap-4 sm:gap-5">
              <p className="text-xs sm:text-sm text-foreground/60">
                No active contracts right now.
              </p>
              <Link href="/freelancer/browse">
                <GradientButton size="md">Browse Recommended Projects</GradientButton>
              </Link>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeContracts.map((proj) => {
                const projMs = milestones.filter((m) => m.projectId === proj.id);
                const nextPending = projMs.find((m) => m.status === "pending" || m.status === "changes_requested");

                return (
                  <Link key={proj.id} href={`/project/${proj.id}/workspace`} className="block group">
                    <GlassCard hoverEffect className="p-5 sm:p-6 space-y-4 h-full border-black/[0.08] dark:border-white/10 group-hover:border-[#4DA2FF]/40">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-[#2563EB] dark:group-hover:text-[#4DA2FF] transition-colors">
                            {proj.title}
                          </h3>
                          <p className="text-xs text-foreground/50 font-mono">
                            {proj.estimatedBudget.toLocaleString()} SUI • Escrow Funded
                          </p>
                        </div>
                        <StatusBadge status={proj.status} />
                      </div>

                      <div className="pt-1">
                        <MilestoneStepper milestones={projMs} orientation="horizontal" />
                      </div>

                      {nextPending && (
                        <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                          <span className="text-xs text-foreground/70 truncate max-w-[200px]">
                            Next: {nextPending.title}
                          </span>
                          <span className="text-xs font-semibold text-[#0D9488] dark:text-[#2DD4BF] group-hover:underline">
                            Submit Deliverables ✓
                          </span>
                        </div>
                      )}
                    </GlassCard>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* AI-Recommended Projects For You Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-[#8B5CF6]/20 text-[#7C3AED] dark:text-[#A78BFA]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">AI-Recommended Projects For You</h2>
                <span className="text-[11px] text-[#7C3AED] dark:text-[#A78BFA] font-mono">Powered by Gonka Router AI</span>
              </div>
            </div>

            <Link href="/freelancer/browse" className="text-xs text-[#7C3AED] dark:text-[#A78BFA] hover:underline flex items-center gap-1">
              <span>See all recommendations</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {openProjects.slice(0, 3).map((proj) => {
              const matchResult = computeFreelancerMatchForProject(
                profile.skills,
                proj.requiredSkills,
                profile.trustScore
              );

              return (
                <GlassCard key={proj.id} className="p-5 space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm sm:text-base text-foreground line-clamp-1">
                        {proj.title}
                      </h3>
                      <ScoreBadge score={matchResult.matchScore} type="ai_match" size="sm" />
                    </div>

                    <div className="text-xs font-mono text-[#0D9488] dark:text-[#2DD4BF] font-semibold">
                      {proj.estimatedBudget.toLocaleString()} SUI • {proj.timelineDays} days
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {proj.requiredSkills.slice(0, 3).map((s) => (
                        <SkillChip
                          key={s}
                          label={s}
                          size="sm"
                          highlighted={profile.skills.includes(s)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-foreground/45 font-mono">
                      Posted {new Date(proj.createdAt).toLocaleDateString()}
                    </span>
                    <Link href={`/project/${proj.id}`}>
                      <GradientButton size="sm">View & Apply</GradientButton>
                    </Link>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
