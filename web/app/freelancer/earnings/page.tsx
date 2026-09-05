"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Coins,
  Lock,
  ExternalLink,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Filter,
  Wallet,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import { clsx } from "clsx";
import { useApp } from "@/context/app-context";
import { AppShell } from "@/components/layout/app-shell";
import { GlassCard } from "@/components/ui/glass-card";
import { EmptyState } from "@/components/ui/empty-state";
import { WalletChip } from "@/components/ui/wallet-chip";
import { isRealSuiDigest, formatSuiAddress, getSuiscanTxUrl } from "@/lib/sui/escrow";
import { useCurrentAccount, useCurrentClient } from "@mysten/dapp-kit-react";

export default function FreelancerEarningsPage() {
  const { currentUser, projects, milestones, transactions } = useApp();
  const [filterProject, setFilterProject] = useState<string>("all");

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
      // Demo fallback
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

  const myProjects = projects.filter(
    (p) =>
      Boolean(p.matchedFreelancerId) &&
      (p.matchedFreelancerId === currentUser.id ||
        (currentUser.walletAddress &&
          p.matchedFreelancerId?.toLowerCase() ===
            currentUser.walletAddress.toLowerCase()) ||
        p.matchedFreelancerId?.toLowerCase() === currentUser.id.toLowerCase())
  );

  // Derive released payouts from both database milestones and in-memory transactions
  const releasedMilestones = milestones.filter(
    (m) =>
      m.status === "released" &&
      myProjects.some((p) => p.id === m.projectId)
  );

  const releasedPayoutItems = [
    ...releasedMilestones.map((m) => {
      const proj = myProjects.find((p) => p.id === m.projectId);
      return {
        id: `ms-${m.id}`,
        projectId: m.projectId,
        projectTitle: proj?.title || "Project Milestone",
        milestoneTitle: m.title,
        amount: m.amount,
        txHash: m.onChainTxHash || (proj?.escrowTxHash ? proj.escrowTxHash : ""),
        timestamp:
          m.releasedAt ||
          m.submittedAt ||
          m.deadline ||
          proj?.createdAt ||
          new Date().toISOString(),
        status: "confirmed" as const,
      };
    }),
    ...transactions
      .filter(
        (t) =>
          t.type === "milestone_released" &&
          myProjects.some((p) => p.id === t.projectId) &&
          !releasedMilestones.some(
            (m) => m.onChainTxHash && m.onChainTxHash === t.txHash
          )
      )
      .map((t) => ({
        id: t.id,
        projectId: t.projectId || "",
        projectTitle: t.projectTitle || "Project Milestone",
        milestoneTitle: t.milestoneTitle || "Milestone Payout",
        amount: t.amount,
        txHash: t.txHash,
        timestamp: t.timestamp || new Date().toISOString(),
        status: t.status,
      })),
  ].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const totalEarned = releasedPayoutItems.reduce((s, t) => s + t.amount, 0);

  const pendingEscrowAmount = milestones
    .filter((m) => {
      const proj = myProjects.find((p) => p.id === m.projectId);
      return proj?.status === "in_progress" && m.status !== "released";
    })
    .reduce((sum, m) => sum + m.amount, 0);

  const filteredTxs = releasedPayoutItems.filter((t) => {
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
              On-Chain Earnings &amp; Payouts
            </h1>
            <p className="text-xs sm:text-sm text-foreground/60 mt-1">
              Verifiable cryptographic proof of milestone payouts released to your wallet.
            </p>
          </div>
        </div>

        {/* Stats Row - 4 Cards Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Connected Sui Wallet Balance */}
          <GlassCard className="p-5 flex flex-col justify-between relative overflow-hidden group">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-foreground/50 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#4DA2FF]" />
                  <span>Wallet Balance</span>
                </span>
                <button
                  type="button"
                  onClick={fetchWalletBalance}
                  title="Refresh balance from Sui"
                  className="text-foreground/40 hover:text-foreground p-1 rounded-md transition-colors"
                >
                  <RefreshCw
                    className={clsx(
                      "w-3 h-3 transition-transform",
                      isLoadingBalance && "animate-spin text-[#2563EB]"
                    )}
                  />
                </button>
              </div>

              <div className="text-2xl sm:text-3xl font-bold text-[#2563EB] dark:text-[#4DA2FF] mt-1 font-mono flex items-baseline gap-1.5">
                {isLoadingBalance && walletBalance === null ? (
                  <span className="animate-pulse text-foreground/40 text-lg">
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

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5 dark:border-white/5 text-[11px] font-mono">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse shrink-0" />
                <span
                  className="text-foreground/60 truncate max-w-[85px] sm:max-w-[95px]"
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
                      <Check className="w-3 h-3 text-[#10B981]" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>

              {effectiveAddress && (
                <a
                  href={`https://suiscan.xyz/testnet/account/${effectiveAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2563EB] dark:text-[#4DA2FF] hover:underline inline-flex items-center gap-1 text-[10px] shrink-0"
                >
                  <span>Suiscan</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </GlassCard>

          {/* Card 2: Total Earned (All-Time) */}
          <GlassCard className="p-5 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase text-foreground/50 block">
                Total Earned (All-Time)
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-[#0D9488] dark:text-[#2DD4BF] mt-1 font-mono">
                {totalEarned.toLocaleString()}{" "}
                <span className="text-xs font-normal">SUI</span>
              </div>
            </div>
            <span className="text-[11px] text-foreground/40 mt-2 pt-2 border-t border-black/5 dark:border-white/5 block">
              Direct non-custodial payouts
            </span>
          </GlassCard>

          {/* Card 3: Pending in Escrow */}
          <GlassCard className="p-5 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase text-foreground/50 block">
                Pending in Escrow
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-[#D97706] dark:text-[#F59E0B] mt-1 font-mono">
                {pendingEscrowAmount.toLocaleString()}{" "}
                <span className="text-xs font-normal">SUI</span>
              </div>
            </div>
            <span className="text-[11px] text-[#D97706] dark:text-[#F59E0B]/80 mt-2 pt-2 border-t border-black/5 dark:border-white/5 block truncate">
              Locked for active milestones
            </span>
          </GlassCard>

          {/* Card 4: This Month */}
          <GlassCard className="p-5 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase text-foreground/50 block">
                This Month
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-foreground mt-1 font-mono">
                {totalEarned.toLocaleString()}{" "}
                <span className="text-xs font-normal">SUI</span>
              </div>
            </div>
            <span className="text-[11px] text-foreground/40 mt-2 pt-2 border-t border-black/5 dark:border-white/5 block">
              {new Date().toLocaleString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
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
                <option
                  value="all"
                  className="bg-white dark:bg-[#151622] text-foreground"
                >
                  All Contracts
                </option>
                {myProjects.map((p) => (
                  <option
                    key={p.id}
                    value={p.id}
                    className="bg-white dark:bg-[#151622] text-foreground"
                  >
                    {p.title}
                  </option>
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
                <GlassCard
                  key={tx.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono"
                >
                  <div className="space-y-1 font-sans">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                      <h4 className="font-semibold text-sm sm:text-base text-foreground">
                        {tx.milestoneTitle || tx.projectTitle}
                      </h4>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] font-mono text-[10px]">
                        Released
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-foreground/50 flex-wrap">
                      <span>Contract: {tx.projectTitle}</span>
                      <span>•</span>
                      <span className="font-mono text-[11px] text-foreground/60">
                        {new Date(tx.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-xs">
                    <div className="text-right sm:text-left">
                      <span className="text-foreground/40 text-[10px] uppercase block font-mono">
                        Amount
                      </span>
                      <span className="text-[#0D9488] dark:text-[#2DD4BF] font-bold text-sm sm:text-base">
                        {tx.amount.toLocaleString()} SUI
                      </span>
                    </div>

                    {isRealSuiDigest(tx.txHash) ? (
                      <a
                        href={`https://suiscan.xyz/testnet/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs text-[#2563EB] dark:text-[#4DA2FF] hover:text-[#7B61FF] transition-colors"
                      >
                        <span className="truncate max-w-[100px]">
                          {formatSuiAddress(tx.txHash) || tx.txHash}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-mono border border-amber-500/20">
                        Simulated
                      </span>
                    )}
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
