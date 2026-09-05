"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Coins,
  AlertCircle,
  Clock,
  Trash2,
  Plus,
  Layers
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { AppShell } from "@/components/layout/app-shell";
import { GradientButton } from "@/components/ui/gradient-button";
import { GhostButton } from "@/components/ui/ghost-button";
import { GlassCard } from "@/components/ui/glass-card";
import { WalletChip } from "@/components/ui/wallet-chip";
import { TransactionCard } from "@/components/ui/transaction-card";
import { Milestone } from "@/types";
import { clsx } from "clsx";
import { useCurrentAccount } from "@mysten/dapp-kit-react";

export default function FinalizeAndFundPage() {
  const currentAccount = useCurrentAccount();
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const {
    currentUser,
    projects,
    milestones,
    users,
    fundProjectEscrow,
    connectWallet
  } = useApp();

  const project = projects.find((p) => p.id === projectId);
  const existingMilestones = milestones.filter((m) => m.projectId === projectId);
  const matchedFreelancer = project?.matchedFreelancerId
    ? users.find((u) => u.id === project.matchedFreelancerId)
    : null;

  const [step, setStep] = useState<1 | 2>(1);
  const [editableMilestones, setEditableMilestones] = useState<Milestone[]>(
    existingMilestones.length > 0
      ? existingMilestones
      : [
          {
            id: `ms-${projectId}-1`,
            projectId,
            title: "Milestone 1: Architecture & Setup",
            deliverable: "Core spec, design tokens, and module structures.",
            amount: 1500,
            percentOfBudget: 50,
            deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
            status: "pending"
          },
          {
            id: `ms-${projectId}-2`,
            projectId,
            title: "Milestone 2: Final Delivery",
            deliverable: "Complete implementation and test verification.",
            amount: 1500,
            percentOfBudget: 50,
            deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
            status: "pending"
          }
        ]
  );

  const [isFunding, setIsFunding] = useState(false);
  const [fundingSuccessTx, setFundingSuccessTx] = useState<{ txHash: string; escrowObjectId: string } | null>(null);
  const [fundError, setFundError] = useState("");

  if (!project) {
    return (
      <AppShell>
        <div className="text-center py-20">Project not found.</div>
      </AppShell>
    );
  }

  const totalBudget = project.estimatedBudget;
  const totalPercentage = editableMilestones.reduce((sum, m) => sum + Number(m.percentOfBudget || 0), 0);
  const isBudgetValid = Math.abs(totalPercentage - 100) < 0.01;

  const handleMilestoneChange = (index: number, field: keyof Milestone, value: any) => {
    const updated = [...editableMilestones];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "percentOfBudget") {
      updated[index].amount = Math.round((totalBudget * Number(value)) / 100);
    }
    setEditableMilestones(updated);
  };

  const handleAddMilestone = () => {
    const allocated = editableMilestones.reduce((sum, m) => sum + m.percentOfBudget, 0);
    const remaining = Math.max(0, 100 - allocated);
    const newMs: Milestone = {
      id: `ms-${projectId}-${editableMilestones.length + 1}`,
      projectId,
      title: `Milestone ${editableMilestones.length + 1}: Extension`,
      deliverable: "Additional scope deliverables.",
      percentOfBudget: remaining,
      amount: Math.round((totalBudget * remaining) / 100),
      deadline: new Date(Date.now() + 21 * 86400000).toISOString(),
      status: "pending"
    };
    setEditableMilestones([...editableMilestones, newMs]);
  };

  const handleRemoveMilestone = (index: number) => {
    if (editableMilestones.length <= 1) return;
    setEditableMilestones(editableMilestones.filter((_, i) => i !== index));
  };

  const handleFundEscrow = async () => {
    if (!currentUser.walletAddress) {
      await connectWallet();
    }

    setIsFunding(true);
    setFundError("");

    try {
      const res = await fundProjectEscrow(projectId, editableMilestones);
      setFundingSuccessTx(res);
      setTimeout(() => {
        router.push(`/project/${projectId}/workspace`);
      }, 1800);
    } catch (err: any) {
      setFundError("Transaction didn't go through — no funds were moved. Please try again.");
    } finally {
      setIsFunding(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link
            href={`/project/${projectId}`}
            className="inline-flex items-center gap-1.5 text-xs text-foreground/60 hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Project Hub</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Finalize Milestones & Lock Sui Escrow
          </h1>
          <p className="text-xs sm:text-sm text-foreground/60 mt-1">
            Re-verify terms with {matchedFreelancer?.name || "the freelancer"} and fund smart contract escrow.
          </p>
        </div>

        {/* Part 1: Finalize Milestones */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Escrow Milestone Breakdown Card */}
            <GlassCard className="p-6 sm:p-7 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/10 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-500/15 text-[#D97706] dark:text-[#F59E0B]">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-foreground">
                        Confirm Milestones with {matchedFreelancer?.name || "Freelancer"}
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#7C3AED] dark:text-[#A78BFA]">
                        100% Invariant
                      </span>
                    </div>
                    <p className="text-xs text-foreground/60">
                      Terms finalized here determine individual on-chain release tranches on Sui.
                    </p>
                  </div>
                </div>

                {/* Running Total Indicator */}
                <div
                  className={clsx(
                    "px-3.5 py-1.5 rounded-xl border font-mono text-xs font-semibold flex items-center gap-2 shrink-0 self-start sm:self-center",
                    isBudgetValid
                      ? "border-[#2DD4BF]/40 bg-[#2DD4BF]/10 text-[#0D9488] dark:text-[#2DD4BF]"
                      : "border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#D97706] dark:text-[#F59E0B]"
                  )}
                >
                  <span className="w-2 h-2 rounded-full bg-current" />
                  <span>{totalPercentage.toFixed(0)}% Allocated</span>
                  {!isBudgetValid && (
                    <span className="text-[10px] font-sans font-normal opacity-90">
                      (must equal 100%)
                    </span>
                  )}
                </div>
              </div>

              {/* Segmented Visual Allocation Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-foreground/60">
                  <span>Milestone Funding Distribution:</span>
                  <span className="font-bold text-foreground">{totalBudget.toLocaleString()} SUI Total</span>
                </div>
                <div className="h-3.5 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden flex gap-1 p-0.5">
                  {editableMilestones.map((m, idx) => {
                    const colors = [
                      "bg-[#4DA2FF]",
                      "bg-[#7B61FF]",
                      "bg-[#2DD4BF]",
                      "bg-[#F59E0B]",
                      "bg-[#EC4899]"
                    ];
                    return (
                      <div
                        key={m.id || idx}
                        style={{ width: `${Math.max(4, m.percentOfBudget)}%` }}
                        className={clsx(
                          "h-full rounded-full transition-all flex items-center justify-center text-[9px] font-mono text-white font-bold",
                          colors[idx % colors.length]
                        )}
                        title={`Milestone ${idx + 1}: ${m.percentOfBudget}% (${m.amount} SUI)`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Repeatable Milestone Cards */}
              <div className="space-y-3.5">
                {editableMilestones.map((m, idx) => {
                  const colors = [
                    "from-[#4DA2FF] to-[#7B61FF]",
                    "from-[#7B61FF] to-[#8B5CF6]",
                    "from-[#2DD4BF] to-[#10B981]",
                    "from-[#F59E0B] to-[#D97706]"
                  ];
                  return (
                    <div
                      key={m.id || idx}
                      className="p-4 sm:p-5 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#151622]/70 backdrop-blur-md space-y-3 relative group shadow-sm hover:border-[#7B61FF]/40 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 flex-1">
                          <div className={clsx(
                            "w-8 h-8 rounded-xl bg-gradient-to-tr text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 shadow-sm",
                            colors[idx % colors.length]
                          )}>
                            M{idx + 1}
                          </div>
                          <input
                            type="text"
                            value={m.title}
                            onChange={(e) => handleMilestoneChange(idx, "title", e.target.value)}
                            placeholder="Milestone title..."
                            className="w-full px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:border-[#7B61FF]"
                          />
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          {/* Percentage Input */}
                          <div className="flex items-center gap-1 bg-black/[0.03] dark:bg-black/30 border border-black/10 dark:border-white/10 px-2.5 py-1 rounded-xl">
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={m.percentOfBudget}
                              onChange={(e) =>
                                handleMilestoneChange(idx, "percentOfBudget", Number(e.target.value))
                              }
                              className="w-10 bg-transparent text-right font-mono text-xs font-bold text-foreground focus:outline-none"
                            />
                            <span className="text-xs font-mono text-foreground/50">%</span>
                          </div>

                          {/* Calculated Amount */}
                          <div className="px-3 py-1 rounded-xl bg-teal-500/10 border border-teal-500/20 text-right min-w-[85px]">
                            <span className="font-mono text-xs font-bold text-[#0D9488] dark:text-[#2DD4BF]">
                              ${m.amount.toLocaleString()}
                            </span>
                          </div>

                          {/* Delete Milestone Button */}
                          {editableMilestones.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMilestone(idx)}
                              className="p-1.5 text-foreground/30 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
                              title="Delete milestone"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Deliverables Description */}
                      <textarea
                        rows={2}
                        value={m.deliverable}
                        onChange={(e) => handleMilestoneChange(idx, "deliverable", e.target.value)}
                        placeholder="Milestone deliverables and acceptance criteria..."
                        className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-xs text-foreground/80 focus:outline-none focus:border-[#7B61FF] resize-none leading-relaxed"
                      />
                    </div>
                  );
                })}
              </div>

              <GhostButton
                size="sm"
                onClick={handleAddMilestone}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Another Milestone
              </GhostButton>
            </GlassCard>

            {/* Bottom Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#151622]/80 backdrop-blur-xl shadow-lg">
              <Link href={`/project/${projectId}`}>
                <GhostButton icon={<ArrowLeft className="w-4 h-4" />}>
                  Back to Project
                </GhostButton>
              </Link>

              <div className="flex items-center gap-3 self-end sm:self-center">
                {!isBudgetValid && (
                  <span className="text-xs text-[#D97706] dark:text-[#F59E0B]">
                    Milestones sum to {totalPercentage.toFixed(0)}% (must equal 100%)
                  </span>
                )}

                <GradientButton
                  size="lg"
                  disabled={!isBudgetValid}
                  onClick={() => setStep(2)}
                  icon={<ArrowRight className="w-4 h-4 ml-1" />}
                >
                  Confirm & Continue to Fund Escrow
                </GradientButton>
              </div>
            </div>
          </div>
        )}

        {/* Part 2: Fund Escrow */}
        {step === 2 && (
          <GlassCard className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#2DD4BF]/20 text-[#0D9488] dark:text-[#2DD4BF]">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  Fund Escrow for {project.title}
                </h3>
                <p className="text-xs text-foreground/60">
                  Non-custodial smart contract deposit on Sui Testnet.
                </p>
              </div>
            </div>

            {/* Escrow Contract Summary Card */}
            <div className="p-5 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-black/5 dark:border-white/5">
                <div className="flex items-center gap-3">
                  {matchedFreelancer && (
                    <img
                      src={matchedFreelancer.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"}
                      alt={matchedFreelancer.name}
                      className="w-11 h-11 rounded-xl object-cover border border-black/10 dark:border-white/10"
                    />
                  )}
                  <div>
                    <span className="text-[11px] text-foreground/45 uppercase font-mono block">Beneficiary</span>
                    <span className="font-semibold text-sm text-foreground">{matchedFreelancer?.name}</span>
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="text-[11px] text-foreground/45 uppercase font-mono block">Total Deposit Required</span>
                  <span className="text-2xl font-bold text-[#0D9488] dark:text-[#2DD4BF] font-mono">
                    {totalBudget.toLocaleString()} <span className="text-xs font-normal">SUI</span>
                  </span>
                </div>
              </div>

              {/* Milestone breakdown list (read only) */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-foreground/75 uppercase tracking-wider block">
                  Finalized Payout Schedule ({editableMilestones.length} Milestones)
                </span>
                {editableMilestones.map((m, idx) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-black/[0.03] dark:bg-black/20 text-xs font-mono"
                  >
                    <span className="text-foreground">
                      M{idx + 1}. {m.title} ({m.percentOfBudget}%)
                    </span>
                    <span className="text-[#0D9488] dark:text-[#2DD4BF] font-semibold">{m.amount.toLocaleString()} SUI</span>
                  </div>
                ))}
              </div>

              {/* Reassurance Copy */}
              <div className="p-3.5 rounded-xl bg-[#2DD4BF]/[0.06] border border-[#2DD4BF]/20 text-xs text-foreground/80 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF] shrink-0 mt-0.5" />
                <span>
                  Funds are locked in a Sui smart contract and only released when you approve each milestone — TrustHire never holds your funds.
                </span>
              </div>
            </div>

            {/* Wallet & Gas Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03]">
              <div className="flex items-center gap-3">
                <WalletChip address={currentAccount?.address || currentUser.walletAddress || "0x4f2a91...9a2c"} />
                <span className="text-xs text-foreground/50 font-mono">Sui Testnet</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2DD4BF]/10 border border-[#2DD4BF]/30 text-[11px] font-semibold text-[#0D9488] dark:text-[#2DD4BF]">
                <Zap className="w-3 h-3" />
                <span>Gas fees sponsored by TrustHire</span>
              </div>
            </div>

            {/* Error state */}
            {fundError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{fundError}</span>
              </div>
            )}

            {/* Success state */}
            {fundingSuccessTx && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 text-xs text-[#10B981] font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Escrow Funded Successfully ✓ Redirecting to active workspace...</span>
                </div>
                <TransactionCard
                  tx={{
                    txHash: fundingSuccessTx.txHash,
                    amount: totalBudget,
                    fromAddress: currentAccount?.address || currentUser.walletAddress || "0x4f2a91...9a2c",
                    toAddress: `${fundingSuccessTx.escrowObjectId} (Sui Escrow)`
                  }}
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-black/10 dark:border-white/10">
              <GhostButton onClick={() => setStep(1)} icon={<ArrowLeft className="w-4 h-4" />}>
                Back to Milestone Plan
              </GhostButton>

              <GradientButton
                size="lg"
                loading={isFunding}
                disabled={isFunding || !!fundingSuccessTx}
                onClick={handleFundEscrow}
                icon={<Lock className="w-4 h-4 ml-1" />}
              >
                {isFunding ? "Confirming on Sui…" : `Confirm & Lock ${totalBudget.toLocaleString()} SUI`}
              </GradientButton>
            </div>
          </GlassCard>
        )}
      </div>
    </AppShell>
  );
}
