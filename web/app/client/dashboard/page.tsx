"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  PlusCircle,
  ShieldCheck,
  FolderKanban,
  Coins,
  ArrowRight,
  Clock,
  ExternalLink,
  Users,
  Wallet,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import { clsx } from "clsx";
import { useApp } from "@/context/app-context";
import { AppShell } from "@/components/layout/app-shell";
import { GradientButton } from "@/components/ui/gradient-button";
import { GhostButton } from "@/components/ui/ghost-button";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ScoreBadge } from "@/components/ui/score-badge";
import { SkillChip } from "@/components/ui/skill-chip";
import { MilestoneStepper } from "@/components/ui/milestone-stepper";
import { computeFreelancerMatchForProject } from "@/lib/simulation";
import { formatSuiAddress } from "@/lib/sui/escrow";
import { useCurrentAccount, useCurrentClient } from "@mysten/dapp-kit-react";

export default function ClientDashboardPage() {
  const {
    currentUser,
    projects,
    milestones,
    users,
    freelancerProfiles
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
      // Demo fallback if RPC query is not configured for simulated account
      setWalletBalance(12.5);
    } catch (err) {
      console.warn("Could not fetch on-chain Sui balance:", err);
      setWalletBalance(12.5);
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

  const clientProjects = projects.filter(
    (p) =>
      p.clientId === currentUser.id ||
      (currentUser.walletAddress && p.clientId.toLowerCase() === currentUser.walletAddress.toLowerCase())
  );
  const activeProjects = clientProjects.filter((p) => p.status === "in_progress");
  const openProjects = clientProjects.filter((p) => p.status === "open");
  const matchedProjects = clientProjects.filter((p) => p.status === "matched");

  // Compute Pending Actions
  const submittedMilestones = milestones.filter(
    (m) =>
      clientProjects.some((p) => p.id === m.projectId) &&
      m.status === "submitted"
  );
  const unfundedMatchedProjects = matchedProjects.filter((p) => !p.escrowTxHash);

  // Compute stats
  const hiredFreelancersCount = new Set(
    clientProjects.filter((p) => p.matchedFreelancerId).map((p) => p.matchedFreelancerId)
  ).size;

  const totalEscrowed = milestones
    .filter((m) => {
      const proj = clientProjects.find((p) => p.id === m.projectId);
      return proj?.status === "in_progress" && m.status !== "released";
    })
    .reduce((sum, m) => sum + m.amount, 0);

  const matchedFreelancerTrustScores = clientProjects
    .filter((p) => p.matchedFreelancerId && freelancerProfiles[p.matchedFreelancerId])
    .map((p) => freelancerProfiles[p.matchedFreelancerId!].trustScore);

  const avgTrustScore =
    matchedFreelancerTrustScores.length > 0
      ? Math.round(
          matchedFreelancerTrustScores.reduce((a, b) => a + b, 0) /
            matchedFreelancerTrustScores.length
        )
      : 95;

  return (
    <AppShell>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Welcome back, {currentUser.name.split(" ")[0]}
            </h1>
            <p className="text-xs sm:text-sm text-foreground/60 mt-1">
              Monitor active smart escrows and AI candidate recommendations.
            </p>
          </div>

          <Link href="/client/projects/new">
            <GradientButton size="md" icon={<PlusCircle className="w-4 h-4" />}>
              Post a New Project
            </GradientButton>
          </Link>
        </div>

        {/* Pending Actions List (Omit if empty) */}
        {(submittedMilestones.length > 0 || unfundedMatchedProjects.length > 0) && (
          <div className="rounded-2xl border border-[#F59E0B]/30 bg-[#F59E0B]/[0.06] p-4 sm:p-5 backdrop-blur-md space-y-3">
            <div className="flex items-center gap-2 text-[#D97706] dark:text-[#F59E0B] font-semibold text-xs uppercase tracking-wider">
              <Clock className="w-4 h-4" />
              <span>Pending Client Actions</span>
            </div>

            <div className="space-y-2">
              {submittedMilestones.map((m) => {
                const proj = clientProjects.find((p) => p.id === m.projectId);
                return (
                  <div
                    key={m.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-white/80 dark:bg-black/20 border border-amber-500/20 dark:border-white/5 text-xs shadow-sm dark:shadow-none"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-[#D97706] dark:text-[#F59E0B] font-semibold mr-2">Milestone Submitted:</span>
                      <span className="text-foreground font-medium">"{m.title}"</span>
                      <span className="text-foreground/50 ml-2">on {proj?.title}</span>
                    </div>
                    <Link href={`/project/${m.projectId}/workspace`} className="shrink-0">
                      <GhostButton size="sm">Review & Release Payment</GhostButton>
                    </Link>
                  </div>
                );
              })}

              {unfundedMatchedProjects.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-white/80 dark:bg-black/20 border border-teal-500/20 dark:border-white/5 text-xs shadow-sm dark:shadow-none"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[#0D9488] dark:text-[#2DD4BF] font-semibold mr-2">Ready to Fund:</span>
                    <span className="text-foreground font-medium">"{p.title}"</span>
                    <span className="text-foreground/50 ml-2">({p.estimatedBudget.toLocaleString()} SUI)</span>
                  </div>
                  <Link href={`/project/${p.id}/fund`} className="shrink-0">
                    <GradientButton size="sm">Finalize & Fund Escrow</GradientButton>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 items-stretch">
          {/* Card 1: Active Projects */}
          <GlassCard className="p-3.5 sm:p-4 rounded-xl h-full flex flex-col justify-between relative overflow-hidden group hover:border-black/20 dark:hover:border-white/20 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-foreground/50 flex items-center gap-1.5">
                  <FolderKanban className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                  <span>Active Projects</span>
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-semibold">
                  Active
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-foreground mt-1 font-mono">
                {activeProjects.length}
              </div>
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5 dark:border-white/5 text-[10px]">
              <span className="text-foreground/50">In development</span>
              <span className="text-[9px] font-mono text-foreground/40">Contracts</span>
            </div>
          </GlassCard>

          {/* Card 2: Total Escrowed */}
          <Link href="/client/escrow" className="block h-full group">
            <GlassCard className="p-3.5 sm:p-4 rounded-xl h-full flex flex-col justify-between relative overflow-hidden hover:border-[#0D9488]/40 dark:hover:border-[#2DD4BF]/40 transition-all cursor-pointer">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-foreground/50 flex items-center gap-1.5">
                    <Coins className="w-3 h-3 text-[#0D9488] dark:text-[#2DD4BF]" />
                    <span>Total Escrowed</span>
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#0D9488]/10 text-[#0D9488] dark:text-[#2DD4BF] border border-[#0D9488]/20 font-semibold">
                    Escrow
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-[#0D9488] dark:text-[#2DD4BF] mt-1 font-mono flex items-baseline gap-1.5">
                  <span>{totalEscrowed.toLocaleString()}</span>
                  <span className="text-xs font-normal text-foreground/60">SUI</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5 dark:border-white/5 text-[10px]">
                <span className="text-[#0D9488] dark:text-[#2DD4BF] font-medium flex items-center gap-1 group-hover:underline">
                  <span>View ledger</span>
                  <ArrowRight className="w-2.5 h-2.5 transition-transform group-hover:translate-x-0.5" />
                </span>
                <span className="text-[9px] font-mono text-[#0D9488]/70 dark:text-[#2DD4BF]/70">Locked</span>
              </div>
            </GlassCard>
          </Link>

          {/* Card 3: Freelancers Hired */}
          <GlassCard className="p-3.5 sm:p-4 rounded-xl h-full flex flex-col justify-between relative overflow-hidden group hover:border-black/20 dark:hover:border-white/20 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-foreground/50 flex items-center gap-1.5">
                  <Users className="w-3 h-3 text-purple-500 dark:text-purple-400" />
                  <span>Freelancers Hired</span>
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-semibold">
                  Verified
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-foreground mt-1 font-mono">
                {hiredFreelancersCount}
              </div>
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5 dark:border-white/5 text-[10px]">
              <span className="text-foreground/50">Verified engineers</span>
              <span className="text-[9px] font-mono text-foreground/40">Gonka Match</span>
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

        {/* Active Projects Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-[#2563EB] dark:text-[#4DA2FF]" />
              <span>Active Workspaces</span>
            </h2>
            <Link href="/client/projects" className="text-xs text-[#2563EB] dark:text-[#4DA2FF] hover:underline flex items-center gap-1">
              <span>View all projects ({clientProjects.length})</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {activeProjects.length === 0 ? (
            <GlassCard className="text-center py-10 space-y-3">
              <p className="text-xs sm:text-sm text-foreground/60">No projects currently in progress.</p>
              <Link href="/client/projects/new">
                <GradientButton size="sm">Post a Project</GradientButton>
              </Link>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeProjects.map((proj) => {
                const projMilestones = milestones.filter((m) => m.projectId === proj.id);
                const freelancer = users.find((u) => u.id === proj.matchedFreelancerId);
                const prof = proj.matchedFreelancerId ? freelancerProfiles[proj.matchedFreelancerId] : undefined;

                return (
                  <Link key={proj.id} href={`/project/${proj.id}/workspace`} className="block group">
                    <GlassCard hoverEffect className="space-y-4 h-full border-black/[0.08] dark:border-white/10 group-hover:border-[#4DA2FF]/40">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0 flex-1">
                          <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-[#2563EB] dark:group-hover:text-[#4DA2FF] transition-colors line-clamp-2">
                            {proj.title}
                          </h3>
                          <p className="text-xs text-foreground/50 font-mono">
                            {proj.estimatedBudget.toLocaleString()} SUI • {proj.timelineDays} days
                          </p>
                        </div>
                        <StatusBadge status={proj.status} />
                      </div>

                      {/* Matched Freelancer Mini Pill */}
                      {freelancer && (
                        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
                          <img
                            src={freelancer.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"}
                            alt={freelancer.name}
                            className="w-7 h-7 rounded-lg object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-semibold text-foreground block truncate">{freelancer.name}</span>
                            <span className="text-[10px] text-foreground/50 truncate block">{prof?.headline || "Freelancer"}</span>
                          </div>
                          {prof && <ScoreBadge score={prof.trustScore} type="trust" size="sm" />}
                        </div>
                      )}

                      {/* Milestone stepper preview */}
                      <div className="pt-1">
                        <MilestoneStepper milestones={projMilestones} orientation="horizontal" />
                      </div>
                    </GlassCard>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Matches Across Your Projects Section */}
        {openProjects.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-[#8B5CF6]/20 text-[#7C3AED] dark:text-[#A78BFA]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Top Candidate Matches</h2>
                  <span className="text-[11px] text-[#7C3AED] dark:text-[#A78BFA] font-mono">Powered by Gonka Router AI</span>
                </div>
              </div>

              <Link
                href={`/project/${openProjects[0].id}/candidates`}
                className="text-xs text-[#7C3AED] dark:text-[#A78BFA] hover:underline flex items-center gap-1"
              >
                <span>View all candidates</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Object.values(freelancerProfiles).slice(0, 3).map((prof) => {
                const freelancerUser = users.find((u) => u.id === prof.userId);
                const targetProject = openProjects[0];
                const matchRes = computeFreelancerMatchForProject(
                  prof.skills,
                  targetProject.requiredSkills,
                  prof.trustScore
                );

                return (
                  <GlassCard key={prof.userId} className="space-y-3.5 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={freelancerUser?.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"}
                            alt={freelancerUser?.name || "Freelancer"}
                            className="w-10 h-10 rounded-xl object-cover border border-black/10 dark:border-white/10"
                          />
                          <div>
                            <h4 className="font-semibold text-sm text-foreground">{freelancerUser?.name}</h4>
                            <span className="text-[11px] text-foreground/50 line-clamp-1">{prof.headline}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <ScoreBadge score={matchRes.matchScore} type="ai_match" size="sm" />
                        <ScoreBadge score={prof.trustScore} type="trust" size="sm" />
                      </div>

                      <p className="text-xs text-foreground/70 line-clamp-2 leading-relaxed">
                        {matchRes.reasoning}
                      </p>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {prof.skills.slice(0, 3).map((s) => (
                          <SkillChip
                            key={s}
                            label={s}
                            size="sm"
                            highlighted={targetProject.requiredSkills.includes(s)}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                      <span className="text-[10px] text-foreground/45 font-mono truncate max-w-[140px]">
                        For {targetProject.title}
                      </span>
                      <Link href={`/project/${targetProject.id}/candidates/${prof.userId}`}>
                        <GhostButton size="sm">View Profile</GhostButton>
                      </Link>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
