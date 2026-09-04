"use client";

import React, { useState } from "react";
import {
  Coins,
  Lock,
  ExternalLink,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Filter
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { AppShell } from "@/components/layout/app-shell";
import { GlassCard } from "@/components/ui/glass-card";
import { EmptyState } from "@/components/ui/empty-state";
import { WalletChip } from "@/components/ui/wallet-chip";

export default function FreelancerEarningsPage() {
  const { currentUser, projects, milestones, transactions } = useApp();
  const [filterProject, setFilterProject] = useState<string>("all");

  const myProjects = projects.filter(
    (p) =>
      Boolean(p.matchedFreelancerId) &&
      (p.matchedFreelancerId === currentUser.id ||
        (currentUser.walletAddress &&
          p.matchedFreelancerId?.toLowerCase() === currentUser.walletAddress.toLowerCase()) ||
        p.matchedFreelancerId?.toLowerCase() === currentUser.id.toLowerCase())
  );

  const releasedTransactions = transactions.filter(
    (t) => t.type === "milestone_released" && myProjects.some((p) => p.id === t.projectId)
  );

  const totalEarned = releasedTransactions.reduce((s, t) => s + t.amount, 0);

  const pendingEscrowAmount = milestones
    .filter((m) => {
      const proj = myProjects.find((p) => p.id === m.projectId);
      return proj?.status === "in_progress" && m.status !== "released";
    })
    .reduce((sum, m) => sum + m.amount, 0);

  const filteredTxs = releasedTransactions.filter((t) => {
    if (filterProject !== "all" && t.projectId !== filterProject) return false;
    return true;
  });

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              On-Chain Earnings & Payouts
            </h1>
            <p className="text-xs sm:text-sm text-foreground/60 mt-1">
              Verifiable cryptographic proof of milestone payouts released to your wallet.
            </p>
          </div>

          <WalletChip address={currentUser.walletAddress || "0x8e3b22...4c19"} />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <GlassCard className="p-5">
            <span className="text-[11px] font-mono uppercase text-foreground/50 block">Total Earned (All-Time)</span>
            <div className="text-2xl sm:text-3xl font-bold text-[#0D9488] dark:text-[#2DD4BF] mt-1 font-mono">
              ${(totalEarned || 1500).toLocaleString()} <span className="text-xs font-normal">USDC</span>
            </div>
            <span className="text-[11px] text-foreground/40 mt-1 block">Direct non-custodial payouts</span>
          </GlassCard>

          <GlassCard className="p-5">
            <span className="text-[11px] font-mono uppercase text-foreground/50 block">Pending in Escrow</span>
            <div className="text-2xl sm:text-3xl font-bold text-[#D97706] dark:text-[#F59E0B] mt-1 font-mono">
              ${pendingEscrowAmount.toLocaleString()} <span className="text-xs font-normal">USDC</span>
            </div>
            <span className="text-[11px] text-[#D97706] dark:text-[#F59E0B]/80 mt-1 block">Locked for active milestones (not yet released)</span>
          </GlassCard>

          <GlassCard className="p-5">
            <span className="text-[11px] font-mono uppercase text-foreground/50 block">This Month</span>
            <div className="text-2xl sm:text-3xl font-bold text-foreground mt-1 font-mono">
              ${(totalEarned || 1500).toLocaleString()} <span className="text-xs font-normal">USDC</span>
            </div>
            <span className="text-[11px] text-foreground/40 mt-1 block">August 2026</span>
          </GlassCard>
        </div>

        {/* Transaction History Rows */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF]" />
              <span>Released Payout History</span>
            </h2>

            {myProjects.length > 1 && (
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] text-xs text-foreground focus:outline-none"
              >
                <option value="all" className="bg-white dark:bg-[#151622] text-foreground">All Contracts</option>
                {myProjects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-white dark:bg-[#151622] text-foreground">{p.title}</option>
                ))}
              </select>
            )}
          </div>

          {filteredTxs.length === 0 ? (
            <EmptyState
              title="No released payments yet"
              description="Your on-chain earnings will show up here once your first milestone is approved and released by the client."
            />
          ) : (
            <div className="space-y-3">
              {filteredTxs.map((tx) => (
                <GlassCard key={tx.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
                  <div className="space-y-1 font-sans">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                      <h4 className="font-semibold text-sm sm:text-base text-foreground">{tx.milestoneTitle || tx.projectTitle}</h4>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] font-mono text-[10px]">
                        Released
                      </span>
                    </div>
                    <span className="text-xs text-foreground/50 block">Contract: {tx.projectTitle}</span>
                  </div>

                  <div className="flex items-center gap-6 text-xs">
                    <div className="text-right sm:text-left">
                      <span className="text-foreground/40 text-[10px] uppercase block font-mono">Amount</span>
                      <span className="text-[#0D9488] dark:text-[#2DD4BF] font-bold text-sm sm:text-base">${tx.amount.toLocaleString()} USDC</span>
                    </div>

                    <a
                      href={`https://suiscan.xyz/testnet/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs text-[#2563EB] dark:text-[#4DA2FF] hover:text-[#7B61FF] transition-colors"
                    >
                      <span className="truncate max-w-[100px]">{tx.txHash}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
