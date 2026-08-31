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
  Plus
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

export default function FinalizeAndFundPage() {
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
            className="inline-flex items-center gap-1.5 text-xs text-foreground/60 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Project Hub</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Finalize Milestones & Lock Sui Escrow
          </h1>
          <p className="text-xs sm:text-sm text-foreground/60 mt-1">
            Re-verify terms with {matchedFreelancer?.name || "the freelancer"} and fund smart contract escrow.
          </p>
        </div>

        {/* Part 1: Finalize Milestones */}
        {step === 1 && (
          <GlassCard className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold text-white">
                  Confirm Milestones with {matchedFreelancer?.name || "Freelancer"}
                </h3>
                <p className="text-xs text-foreground/60">
                  Terms agreed here determine individual release amounts on Sui.
                </p>
              </div>

              {/* Running Total Indicator */}
              <div
                className={clsx(
                  "px-3.5 py-1.5 rounded-xl border font-mono text-xs font-semibold flex items-center gap-2 shrink-0",
                  isBudgetValid
                    ? "border-[#2DD4BF]/40 bg-[#2DD4BF]/10 text-[#2DD4BF]"
                    : "border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#F59E0B]"
                )}
              >
                <span>{totalPercentage.toFixed(0)}% allocated</span>
                {!isBudgetValid && (
                  <span className="text-[10px] font-sans font-normal">
                    (must equal 100%)
                  </span>
                )}
              </div>
            </div>

            {/* Editable rows */}
            <div className="space-y-3">
              {editableMilestones.map((m, idx) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="font-mono text-xs font-bold text-foreground/40">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        value={m.title}
                        onChange={(e) => handleMilestoneChange(idx, "title", e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-white/10 bg-black/20 text-xs font-semibold text-white focus:outline-none focus:border-[#2DD4BF]"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-black/30 border border-white/10 px-2 py-1 rounded-lg">
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={m.percentOfBudget}
                          onChange={(e) =>
                            handleMilestoneChange(idx, "percentOfBudget", Number(e.target.value))
                          }
                          className="w-12 bg-transparent text-right font-mono text-xs text-white focus:outline-none"
                        />
                        <span className="text-xs font-mono text-foreground/50">%</span>
                      </div>

                      <span className="font-mono text-xs font-semibold text-[#2DD4BF] min-w-[70px] text-right">
                        ${m.amount.toLocaleString()}
                      </span>

                      {editableMilestones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMilestone(idx)}
                          className="p-1 text-foreground/30 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={m.deliverable}
                    onChange={(e) => handleMilestoneChange(idx, "deliverable", e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-white/10 bg-black/20 text-xs text-foreground/80 focus:outline-none focus:border-[#2DD4BF] resize-none"
                  />
                </div>
              ))}
            </div>

            <GhostButton
              size="sm"
              onClick={handleAddMilestone}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Milestone
            </GhostButton>

            <div className="flex items-center justify-between pt-6 border-t border-white/10">
              <Link href={`/project/${projectId}`}>
                <GhostButton>Cancel</GhostButton>
              </Link>

              <GradientButton
                size="lg"
                disabled={!isBudgetValid}
                onClick={() => setStep(2)}
                icon={<ArrowRight className="w-4 h-4 ml-1" />}
              >
                Confirm & Continue to Fund Escrow
              </GradientButton>
            </div>
          </GlassCard>
        )}

        {/* Part 2: Fund Escrow */}
        {step === 2 && (
          <GlassCard className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#2DD4BF]/20 text-[#2DD4BF]">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  Fund Escrow for {project.title}
                </h3>
                <p className="text-xs text-foreground/60">
                  Non-custodial smart contract deposit on Sui Testnet.
                </p>
              </div>
            </div>

            {/* Escrow Contract Summary Card */}
            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                  {matchedFreelancer && (
                    <img
                      src={matchedFreelancer.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"}
                      alt={matchedFreelancer.name}
                      className="w-11 h-11 rounded-xl object-cover border border-white/10"
                    />
                  )}
                  <div>
                    <span className="text-[11px] text-foreground/45 uppercase font-mono block">Beneficiary</span>
                    <span className="font-semibold text-sm text-white">{matchedFreelancer?.name}</span>
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="text-[11px] text-foreground/45 uppercase font-mono block">Total Deposit Required</span>
                  <span className="text-2xl font-bold text-[#2DD4BF] font-mono">
                    ${totalBudget.toLocaleString()} <span className="text-xs font-normal">USDC</span>
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
                    className="flex items-center justify-between p-2.5 rounded-lg bg-black/20 text-xs font-mono"
                  >
                    <span className="text-white">
                      M{idx + 1}. {m.title} ({m.percentOfBudget}%)
                    </span>
                    <span className="text-[#2DD4BF] font-semibold">${m.amount.toLocaleString()} USDC</span>
                  </div>
                ))}
              </div>

              {/* Reassurance Copy */}
              <div className="p-3.5 rounded-xl bg-[#2DD4BF]/[0.06] border border-[#2DD4BF]/20 text-xs text-foreground/80 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#2DD4BF] shrink-0 mt-0.5" />
                <span>
                  Funds are locked in a Sui smart contract and only released when you approve each milestone — TrustHire never holds your funds.
                </span>
              </div>
            </div>

            {/* Wallet & Gas Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.03]">
              <div className="flex items-center gap-3">
                <WalletChip address={currentUser.walletAddress || "0x4f2a91...9a2c"} />
                <span className="text-xs text-foreground/50 font-mono">Sui Testnet</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2DD4BF]/10 border border-[#2DD4BF]/30 text-[11px] font-semibold text-[#2DD4BF]">
                <Zap className="w-3 h-3" />
                <span>Gas fees sponsored by TrustHire</span>
              </div>
            </div>

            {/* Error state */}
            {fundError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{fundError}</span>
              </div>
            )}

            {/* Success state */}
            {fundingSuccessTx && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 text-xs text-[#10B981] font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Escrow Funded Successfully ? Redirecting to active workspace...</span>
                </div>
                <TransactionCard
                  tx={{
                    txHash: fundingSuccessTx.txHash,
                    amount: totalBudget,
                    fromAddress: currentUser.walletAddress || "0x4f2a91...9a2c",
                    toAddress: `${fundingSuccessTx.escrowObjectId} (Sui Escrow)`
                  }}
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
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
                {isFunding ? "Confirming on Sui…" : `Confirm & Lock $${totalBudget.toLocaleString()} USDC`}
              </GradientButton>
            </div>
          </GlassCard>
        )}
      </div>
    </AppShell>
  );
}
