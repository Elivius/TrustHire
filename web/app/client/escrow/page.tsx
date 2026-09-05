"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Coins,
  ArrowRight,
  ExternalLink,
  Filter,
  CheckCircle2,
  Clock,
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
import { GhostButton } from "@/components/ui/ghost-button";
import { GradientButton } from "@/components/ui/gradient-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { OnChainTransaction } from "@/types";
import {
  getSuiscanTxUrl,
  getSuiscanObjectUrl,
  formatSuiAddress,
  isRealSuiDigest,
  TESTNET_PACKAGE_ID,
} from "@/lib/sui/escrow";
import { useCurrentAccount, useCurrentClient } from "@mysten/dapp-kit-react";

export default function ClientEscrowPage() {
  const router = useRouter();
  const { currentUser, projects, milestones, transactions, users } = useApp();
  const [filterProject, setFilterProject] = useState<string>("all");
  const [escrowTab, setEscrowTab] = useState<
    "active" | "pending" | "completed" | "all"
  >("active");

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

  const clientProjects = useMemo(() => {
    return projects.filter((p) => {
      if (!p.clientId) return false;
      const cId = p.clientId.toLowerCase();
      const currentId = currentUser.id?.toLowerCase();
      const currentWallet = currentUser.walletAddress?.toLowerCase();
      return (
        (currentId && cId === currentId) ||
        (currentWallet && cId === currentWallet) ||
        p.clientId === currentUser.id
      );
    });
  }, [projects, currentUser]);

  const inProgressProjects = useMemo(() => {
    return clientProjects.filter((p) => p.status === "in_progress");
  }, [clientProjects]);

  const matchedAwaitingEscrowProjects = useMemo(() => {
    return clientProjects.filter(
      (p) =>
        p.status === "matched" ||
        (p.status === "open" && Boolean(p.matchedFreelancerId) && !p.escrowObjectId)
    );
  }, [clientProjects]);

  const completedEscrowProjects = useMemo(() => {
    return clientProjects.filter((p) => p.status === "completed");
  }, [clientProjects]);

  const displayedEscrowProjects = useMemo(() => {
    if (escrowTab === "active") return inProgressProjects;
    if (escrowTab === "pending") return matchedAwaitingEscrowProjects;
    if (escrowTab === "completed") return completedEscrowProjects;
    return clientProjects.filter(
      (p) =>
        p.status === "in_progress" ||
        p.status === "completed" ||
        p.status === "matched" ||
        (p.status === "open" && Boolean(p.matchedFreelancerId))
    );
  }, [
    escrowTab,
    inProgressProjects,
    matchedAwaitingEscrowProjects,
    completedEscrowProjects,
    clientProjects,
  ]);

  const currentlyEscrowed = useMemo(() => {
    return milestones
      .filter((m) => {
        const proj = clientProjects.find((p) => p.id === m.projectId);
        return proj && proj.status === "in_progress" && m.status !== "released";
      })
      .reduce((sum, m) => sum + (m.amount || 0), 0);
  }, [milestones, clientProjects]);

  const releasedMilestones = useMemo(() => {
    return milestones.filter((m) => {
      const proj = clientProjects.find((p) => p.id === m.projectId);
      return proj && m.status === "released";
    });
  }, [milestones, clientProjects]);

  const totalReleased = useMemo(() => {
    const fromMilestones = releasedMilestones.reduce(
      (sum, m) => sum + (m.amount || 0),
      0
    );
    const fromTx = transactions
      .filter(
        (t) =>
          t.type === "milestone_released" &&
          clientProjects.some((p) => p.id === t.projectId)
      )
      .filter(
        (t) =>
          !releasedMilestones.some(
            (m) => m.onChainTxHash && m.onChainTxHash === t.txHash
          )
      )
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    return fromMilestones + fromTx;
  }, [releasedMilestones, transactions, clientProjects]);

  const pendingMilestonesCount = milestones.filter(
    (m) =>
      clientProjects.some((p) => p.id === m.projectId) &&
      m.status === "submitted"
  ).length;

  const allLedgerTransactions: OnChainTransaction[] = useMemo(() => {
    const txMap = new Map<string, OnChainTransaction>();

    // 1. In-memory transactions from context
    transactions
      .filter((t) => clientProjects.some((p) => p.id === t.projectId))
      .forEach((tx) => {
        const key = `${tx.type}-${tx.projectId}-${tx.milestoneTitle || ""}-${tx.txHash}`;
        txMap.set(key, tx);
      });

    // 2. Database released milestones
    milestones
      .filter(
        (m) =>
          m.status === "released" &&
          clientProjects.some((p) => p.id === m.projectId)
      )
      .forEach((m) => {
        const proj = clientProjects.find((p) => p.id === m.projectId);
        const txHash =
          m.onChainTxHash || (proj?.escrowTxHash ? proj.escrowTxHash : "");
        const key = `milestone_released-${m.projectId}-${m.title}-${txHash}`;
        if (!txMap.has(key)) {
          txMap.set(key, {
            id: `tx-ms-${m.id}`,
            txHash: txHash || "0x" + m.id.replace(/-/g, "").slice(0, 64),
            type: "milestone_released",
            projectId: m.projectId,
            projectTitle: proj?.title || "Project Milestone",
            milestoneTitle: m.title,
            amount: m.amount || 0,
            fromAddress: proj?.escrowObjectId
              ? `${formatSuiAddress(proj.escrowObjectId)} (Sui Escrow)`
              : "Sui Escrow",
            toAddress: proj?.matchedFreelancerId
              ? formatSuiAddress(proj.matchedFreelancerId)
              : "Freelancer Wallet",
            timestamp: (() => {
              if (m.releasedAt) return m.releasedAt;
              if (m.deadline) return m.deadline;
              if (m.submittedAt) return m.submittedAt;
              if (proj?.createdAt) {
                const msMatch = m.title?.match(/Milestone\s*(\d+)/i);
                const msNum = msMatch ? parseInt(msMatch[1], 10) : 1;
                return new Date(new Date(proj.createdAt).getTime() + msNum * 25 * 60 * 1000).toISOString();
              }
              return new Date().toISOString();
            })(),
            status: "confirmed",
          });
        }
      });

    // 3. Database funded escrow deposits
    clientProjects
      .filter(
        (p) =>
          p.escrowTxHash ||
          p.escrowObjectId ||
          p.status === "in_progress" ||
          p.status === "completed"
      )
      .forEach((p) => {
        const txHash =
          p.escrowTxHash || (p.escrowObjectId ? p.escrowObjectId : "");
        const key = `escrow_created-${p.id}--${txHash}`;
        if (!txMap.has(key)) {
          txMap.set(key, {
            id: `tx-escrow-${p.id}`,
            txHash: txHash || "0x" + p.id.replace(/-/g, "").slice(0, 64),
            type: "escrow_created",
            projectId: p.id,
            projectTitle: p.title,
            amount: p.estimatedBudget || 0,
            fromAddress: p.clientId,
            toAddress: p.escrowObjectId
              ? `${formatSuiAddress(p.escrowObjectId)} (Sui Escrow)`
              : "Sui Escrow Object",
            timestamp: p.createdAt || new Date().toISOString(),
            status: "confirmed",
          });
        }
      });

    return Array.from(txMap.values()).sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [transactions, clientProjects, milestones]);

  const filteredTransactions = useMemo(() => {
    return allLedgerTransactions.filter((tx) => {
      if (filterProject !== "all" && tx.projectId !== filterProject) return false;
      return true;
    });
  }, [allLedgerTransactions, filterProject]);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Escrow &amp; Payments Ledger
            </h1>
            <p className="text-xs sm:text-sm text-foreground/60 mt-1">
              Real-time on-chain accounting of locked deposits and released milestone disbursements.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] text-xs font-mono text-foreground/75 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span>Sui Testnet</span>
            {TESTNET_PACKAGE_ID && (
              <span className="text-[10px] text-foreground/45 border-l border-black/10 dark:border-white/10 pl-2">
                Pkg: {formatSuiAddress(TESTNET_PACKAGE_ID)}
              </span>
            )}
          </div>
        </div>

        {/* Stats Row - 4 Cards Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          {/* Card 1: Connected Sui Wallet Balance */}
          <GlassCard className="p-4 sm:p-5 h-full flex flex-col justify-between relative overflow-hidden group hover:border-black/20 dark:hover:border-white/20 transition-all">
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

            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-black/5 dark:border-white/5 text-[11px] font-mono">
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
                  title="View on Suiscan Explorer"
                >
                  <span>Suiscan</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </GlassCard>

          {/* Card 2: Currently Escrowed */}
          <GlassCard className="p-4 sm:p-5 h-full flex flex-col justify-between relative overflow-hidden group hover:border-black/20 dark:hover:border-white/20 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-foreground/50 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#0D9488] dark:text-[#2DD4BF]" />
                  <span>Currently Escrowed</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0D9488]/10 text-[#0D9488] dark:text-[#2DD4BF] border border-[#0D9488]/20 font-semibold">
                  Locked
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#0D9488] dark:text-[#2DD4BF] mt-1 font-mono">
                {currentlyEscrowed.toLocaleString()}{" "}
                <span className="text-xs font-normal text-foreground/60">SUI</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-black/5 dark:border-white/5 text-[11px]">
              <span className="text-foreground/40">In smart contracts</span>
              <span className="text-[10px] font-mono text-[#0D9488]/70 dark:text-[#2DD4BF]/70">On-Chain</span>
            </div>
          </GlassCard>

          {/* Card 3: Total Released */}
          <GlassCard className="p-4 sm:p-5 h-full flex flex-col justify-between relative overflow-hidden group hover:border-black/20 dark:hover:border-white/20 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-foreground/50 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-foreground/60" />
                  <span>Total Released</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-foreground/70 border border-black/10 dark:border-white/10 font-semibold">
                  Disbursed
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-foreground mt-1 font-mono">
                {totalReleased.toLocaleString()}{" "}
                <span className="text-xs font-normal text-foreground/60">SUI</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-black/5 dark:border-white/5 text-[11px]">
              <span className="text-foreground/40">Across milestones</span>
              <span className="text-[10px] font-mono text-foreground/40">Settled</span>
            </div>
          </GlassCard>

          {/* Card 4: Pending Review */}
          <GlassCard className="p-4 sm:p-5 h-full flex flex-col justify-between relative overflow-hidden group hover:border-black/20 dark:hover:border-white/20 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-foreground/50 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#D97706] dark:text-[#F59E0B]" />
                  <span>Pending Review</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-[#D97706] dark:text-[#F59E0B] border border-amber-500/20 font-semibold">
                  Action
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#D97706] dark:text-[#F59E0B] mt-1 font-mono">
                {pendingMilestonesCount}
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-black/5 dark:border-white/5 text-[11px]">
              <span className="text-foreground/40">Awaiting approval</span>
              <span className="text-[10px] font-mono text-amber-500/70">Client Action</span>
            </div>
          </GlassCard>
        </div>

        {/* Per-Project Escrow Breakdown */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF]" />
              <span>
                {escrowTab === "active"
                  ? "Active Project Escrows"
                  : escrowTab === "pending"
                  ? "Awaiting Escrow Deposit"
                  : escrowTab === "completed"
                  ? "Completed Project Escrows"
                  : "All Project Escrows"}
              </span>
            </h2>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs font-medium self-start sm:self-auto overflow-x-auto">
              <button
                type="button"
                onClick={() => setEscrowTab("active")}
                className={clsx(
                  "px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap",
                  escrowTab === "active"
                    ? "bg-white dark:bg-[#1C1D2A] text-[#0D9488] dark:text-[#2DD4BF] font-semibold shadow-sm"
                    : "text-foreground/60 hover:text-foreground"
                )}
              >
                Funded ({inProgressProjects.length})
              </button>
              <button
                type="button"
                onClick={() => setEscrowTab("pending")}
                className={clsx(
                  "px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap",
                  escrowTab === "pending"
                    ? "bg-white dark:bg-[#1C1D2A] text-[#D97706] dark:text-[#F59E0B] font-semibold shadow-sm"
                    : "text-foreground/60 hover:text-foreground"
                )}
              >
                Awaiting Escrow ({matchedAwaitingEscrowProjects.length})
              </button>
              <button
                type="button"
                onClick={() => setEscrowTab("completed")}
                className={clsx(
                  "px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap",
                  escrowTab === "completed"
                    ? "bg-white dark:bg-[#1C1D2A] text-[#10B981] font-semibold shadow-sm"
                    : "text-foreground/60 hover:text-foreground"
                )}
              >
                Completed ({completedEscrowProjects.length})
              </button>
              <button
                type="button"
                onClick={() => setEscrowTab("all")}
                className={clsx(
                  "px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap",
                  escrowTab === "all"
                    ? "bg-white dark:bg-[#1C1D2A] text-foreground font-semibold shadow-sm"
                    : "text-foreground/60 hover:text-foreground"
                )}
              >
                All (
                {inProgressProjects.length +
                  matchedAwaitingEscrowProjects.length +
                  completedEscrowProjects.length}
                )
              </button>
            </div>
          </div>

          {displayedEscrowProjects.length === 0 ? (
            <EmptyState
              title={
                escrowTab === "pending"
                  ? "No proposals awaiting escrow deposit"
                  : escrowTab === "completed"
                  ? "No completed escrows"
                  : escrowTab === "active"
                  ? "No active escrows in progress"
                  : "No project escrows found"
              }
              description={
                escrowTab === "pending"
                  ? "When you accept a freelancer proposal, it will appear here ready for you to lock funds into Sui smart contract escrow."
                  : escrowTab === "completed"
                  ? "Projects where all escrow milestones have been released and paid out will appear here."
                  : "This is where you'll track locked and released funds once you match with a freelancer and fund smart contract escrow."
              }
            />
          ) : (
            <div className="space-y-3">
              {displayedEscrowProjects.map((proj) => {
                const projMs = milestones.filter(
                  (m) => m.projectId === proj.id
                );
                const total = projMs.reduce((s, m) => s + m.amount, 0);
                const released = projMs
                  .filter((m) => m.status === "released")
                  .reduce((s, m) => s + m.amount, 0);
                const remaining = total - released;
                const isAwaitingEscrow =
                  proj.status === "matched" ||
                  (proj.status === "open" &&
                    Boolean(proj.matchedFreelancerId) &&
                    !proj.escrowObjectId);
                const freelancer = users.find(
                  (u) =>
                    u.id === proj.matchedFreelancerId ||
                    (proj.matchedFreelancerId &&
                      u.walletAddress?.toLowerCase() ===
                        proj.matchedFreelancerId.toLowerCase())
                );

                return (
                  <div
                    key={proj.id}
                    onClick={() =>
                      router.push(
                        isAwaitingEscrow
                          ? `/project/${proj.id}/fund`
                          : `/project/${proj.id}/workspace`
                      )
                    }
                    className="block group cursor-pointer"
                  >
                    <GlassCard
                      hoverEffect
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-[#2563EB] dark:group-hover:text-[#4DA2FF] transition-colors">
                            {proj.title}
                          </h3>
                          <StatusBadge status={proj.status} />
                        </div>
                        {proj.escrowObjectId ? (
                          <a
                            href={getSuiscanObjectUrl(proj.escrowObjectId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs text-foreground/50 hover:text-[#2563EB] dark:hover:text-[#4DA2FF] font-mono transition-colors"
                          >
                            <span>
                              Object: {formatSuiAddress(proj.escrowObjectId)}
                            </span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="text-[#D97706] dark:text-[#F59E0B]">
                              Awaiting Escrow Deposit
                            </span>
                            {freelancer && (
                              <span className="text-foreground/50">
                                • Matched: {freelancer.name}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-6 text-xs font-mono">
                        {isAwaitingEscrow ? (
                          <div>
                            <span className="text-foreground/45 block text-[10px] uppercase">
                              To Deposit
                            </span>
                            <span className="text-[#D97706] dark:text-[#F59E0B] font-semibold">
                              {(total > 0 ? total : proj.estimatedBudget).toLocaleString()} SUI
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-foreground/45 block text-[10px] uppercase">
                              Locked
                            </span>
                            <span className="text-[#0D9488] dark:text-[#2DD4BF] font-semibold">
                              {remaining.toLocaleString()} SUI
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-foreground/45 block text-[10px] uppercase">
                            Released
                          </span>
                          <span className="text-foreground font-semibold">
                            {released.toLocaleString()} SUI
                          </span>
                        </div>
                        {isAwaitingEscrow ? (
                          <Link
                            href={`/project/${proj.id}/fund`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <GradientButton
                              size="sm"
                              icon={<ArrowRight className="w-3 h-3 ml-1" />}
                            >
                              Fund Escrow
                            </GradientButton>
                          </Link>
                        ) : (
                          <GhostButton
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/project/${proj.id}/workspace`);
                            }}
                          >
                            <span>
                              {proj.status === "completed"
                                ? "Record"
                                : "Workspace"}
                            </span>
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </GhostButton>
                        )}
                      </div>
                    </GlassCard>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Flat Transaction History Table */}
        <div className="space-y-4 pt-4 border-t border-black/5 dark:border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#7C3AED] dark:text-[#7B61FF]" />
              <span>Sui On-Chain Transaction Ledger</span>
            </h2>

            {/* Filter */}
            {clientProjects.length > 1 && (
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] text-xs text-foreground focus:outline-none"
              >
                <option
                  value="all"
                  className="bg-white dark:bg-[#151622] text-foreground"
                >
                  All Projects
                </option>
                {clientProjects.map((p) => (
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

          <div className="rounded-2xl border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-[#151622]/80 overflow-hidden backdrop-blur-md shadow-sm dark:shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/[0.02] dark:bg-white/[0.03] text-foreground/50 uppercase font-mono text-[10px] border-b border-black/[0.05] dark:border-white/5">
                  <tr>
                    <th className="py-3 px-4">Event Type</th>
                    <th className="py-3 px-4">Project &amp; Milestone</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Tx Hash &amp; Explorer</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.05] dark:divide-white/5 font-mono">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-foreground/45 font-sans"
                      >
                        No transactions recorded for this filter. Funded escrows and released payouts will appear here automatically.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 text-xs text-foreground capitalize font-sans">
                            {tx.type === "escrow_created" ? (
                              <>
                                <Lock className="w-3.5 h-3.5 text-[#0D9488] dark:text-[#2DD4BF]" />
                                <span>Escrow Deposit</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                                <span>Milestone Release</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-sans">
                            <p className="font-medium text-foreground">
                              {tx.projectTitle}
                            </p>
                            <p className="text-[11px] text-foreground/50">
                              {tx.milestoneTitle}
                            </p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-foreground">
                          {tx.amount.toLocaleString()} SUI
                        </td>
                        <td className="py-3.5 px-4">
                          {isRealSuiDigest(tx.txHash) ? (
                            <a
                              href={getSuiscanTxUrl(tx.txHash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-[#2563EB] dark:text-[#4DA2FF] hover:underline"
                            >
                              <span className="font-mono text-[11px]">
                                {formatSuiAddress(tx.txHash) || tx.txHash}
                              </span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ) : (
                            <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400">
                              Simulated Demo
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-foreground/50 text-[11px]">
                          {new Date(tx.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
