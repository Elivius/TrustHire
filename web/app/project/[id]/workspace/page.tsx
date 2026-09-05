"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Lock,
  CheckCircle2,
  Clock,
  Edit3,
  AlertTriangle,
  ExternalLink,
  MessageSquare,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  Send
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { AppShell } from "@/components/layout/app-shell";
import { GradientButton } from "@/components/ui/gradient-button";
import { GhostButton } from "@/components/ui/ghost-button";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { TransactionCard } from "@/components/ui/transaction-card";
import { MessagingModalStub } from "@/components/layout/messaging-modal-stub";
import { MilestoneSubmissionModal } from "./milestone-submission-modal";
import { RequestChangesModal } from "./request-changes-modal";
import { DisputeModal } from "./dispute-modal";
import { CompletionRatingModal } from "./completion-rating-modal";
import { Milestone } from "@/types";
import { clsx } from "clsx";
import { getSuiscanObjectUrl, formatSuiAddress } from "@/lib/sui/escrow";

export default function ActiveWorkspacePage() {
  const params = useParams();
  const projectId = params.id as string;

  const {
    currentUser,
    activeRole,
    projects,
    milestones,
    users,
    submitMilestoneWork,
    requestChangesOnMilestone,
    approveAndReleaseMilestone,
    flagDisputeOnMilestone,
    submitRating
  } = useApp();

  const project = projects.find((p) => p.id === projectId);
  const projMilestones = useMemo(() => {
    return milestones
      .filter((m) => m.projectId === projectId)
      .sort((a, b) => {
        const aNum = a.title?.match(/Milestone\s+(\d+)/i)?.[1];
        const bNum = b.title?.match(/Milestone\s+(\d+)/i)?.[1];
        if (aNum && bNum) return parseInt(aNum, 10) - parseInt(bNum, 10);
        return (a.title || "").localeCompare(b.title || "");
      });
  }, [milestones, projectId]);
  const isClient = activeRole === "client" || currentUser.id === project?.clientId;

  const freelancer = project?.matchedFreelancerId
    ? users.find((u) => u.id === project.matchedFreelancerId)
    : null;
  const client = project ? users.find((u) => u.id === project.clientId) : null;

  // UI state
  const [expandedMilestoneId, setExpandedMilestoneId] = useState<string | null>(
    projMilestones.find((m) => m.status === "submitted" || m.status === "changes_requested")?.id ||
      projMilestones[0]?.id ||
      null
  );
  const [isEscrowExpanded, setIsEscrowExpanded] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);

  // Modals
  const [submitModalMilestone, setSubmitModalMilestone] = useState<Milestone | null>(null);
  const [changesModalMilestone, setChangesModalMilestone] = useState<Milestone | null>(null);
  const [disputeModalMilestone, setDisputeModalMilestone] = useState<Milestone | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Action Loading
  const [releasingMilestoneId, setReleasingMilestoneId] = useState<string | null>(null);

  if (!project) {
    return (
      <AppShell>
        <div className="text-center py-20">Project not found.</div>
      </AppShell>
    );
  }

  const allReleased = projMilestones.length > 0 && projMilestones.every((m) => m.status === "released");
  const totalAmount = projMilestones.reduce((s, m) => s + m.amount, 0);
  const releasedAmount = projMilestones
    .filter((m) => m.status === "released")
    .reduce((s, m) => s + m.amount, 0);

  const handleApproveRelease = async (milestoneId: string) => {
    setReleasingMilestoneId(milestoneId);
    try {
      await approveAndReleaseMilestone(milestoneId);
      const remaining = projMilestones.filter((m) => m.id !== milestoneId && m.status !== "released");
      if (remaining.length === 0 && isClient) {
        setShowRatingModal(true);
      }
    } finally {
      setReleasingMilestoneId(null);
    }
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href={isClient ? "/client/projects" : "/freelancer/active-work"}
            className="inline-flex items-center gap-1.5 text-xs text-foreground/60 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to {isClient ? "My Projects" : "Active Work"}</span>
          </Link>
          <StatusBadge status={allReleased ? "completed" : project.status} />
        </div>

        {/* Workspace Summary Card */}
        <GlassCard className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                {project.title}
              </h1>
              <p className="text-xs sm:text-sm text-foreground/60">
                Active Smart Contract Escrow Workspace
              </p>
            </div>

            {/* Counterparty Pill */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/10 dark:border-white/10">
              <img
                src={(isClient ? freelancer?.avatarUrl : client?.avatarUrl) || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"}
                alt="Counterparty"
                className="w-10 h-10 rounded-xl object-cover"
              />
              <div className="min-w-0">
                <span className="text-[10px] text-foreground/50 uppercase font-mono block">
                  {isClient ? "Hired Freelancer" : "Project Client"}
                </span>
                <span className="font-semibold text-xs sm:text-sm text-foreground truncate block">
                  {isClient ? freelancer?.name : client?.name}
                </span>
              </div>
              <GhostButton size="sm" onClick={() => setMessageModalOpen(true)}>
                <MessageSquare className="w-3.5 h-3.5" />
              </GhostButton>
            </div>
          </div>

          {/* Escrow Lock Banner with Expandable Tx Details */}
          <div className="p-4 rounded-2xl border border-[#2DD4BF]/30 bg-[#2DD4BF]/[0.05] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#2DD4BF]/20 text-[#0D9488] dark:text-[#2DD4BF]">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-foreground">Escrow Secured on Sui</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 dark:bg-[#2DD4BF]/20 text-emerald-700 dark:text-[#2DD4BF] border border-emerald-500/20 dark:border-transparent font-semibold">
                      {releasedAmount === totalAmount ? "100% Released" : `${releasedAmount.toLocaleString()} SUI of ${totalAmount.toLocaleString()} SUI Released`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-foreground/65">
                    <span>Smart contract object:</span>
                    {project.escrowObjectId ? (
                      <a
                        href={getSuiscanObjectUrl(project.escrowObjectId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[#2563EB] dark:text-[#4DA2FF] hover:underline inline-flex items-center gap-1"
                      >
                        <span>{formatSuiAddress(project.escrowObjectId)}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : (
                      <span className="font-mono">Pending Escrow</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEscrowExpanded(!isEscrowExpanded)}
                className="text-xs text-[#2563EB] dark:text-[#4DA2FF] hover:underline flex items-center gap-1 self-end sm:self-center font-medium"
              >
                <span>{isEscrowExpanded ? "Hide on-chain proof" : "View on-chain proof"}</span>
                {isEscrowExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {isEscrowExpanded && (
              <div className="pt-2">
                <TransactionCard
                  tx={{
                    txHash: project.escrowTxHash || "",
                    amount: totalAmount,
                    fromAddress: client?.walletAddress || client?.id || "",
                    toAddress: project.escrowObjectId ? `${formatSuiAddress(project.escrowObjectId)} (Sui Escrow)` : "Sui Escrow"
                  }}
                />
              </div>
            )}
          </div>
        </GlassCard>

        {/* Milestone Workspace Tracker */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF]" />
            <span>Milestones & Deliverables Lifecycle</span>
          </h2>

          <div className="space-y-4">
            {projMilestones.map((m, idx) => {
              const isExpanded = expandedMilestoneId === m.id;
              const isReleasing = releasingMilestoneId === m.id;

              return (
                <GlassCard
                  key={m.id}
                  className={clsx(
                    "p-5 sm:p-6 space-y-4 transition-all duration-200",
                    m.status === "submitted" && "border-amber-500/40 dark:border-[#F59E0B]/40 bg-amber-500/[0.03] dark:bg-[#F59E0B]/[0.02]",
                    m.status === "changes_requested" && "border-amber-500/40 dark:border-[#F59E0B]/40 bg-amber-500/[0.03] dark:bg-[#F59E0B]/[0.02]",
                    m.status === "disputed" && "border-red-500/40 bg-red-500/[0.03] dark:bg-red-500/[0.02]",
                    m.status === "released" && "border-emerald-500/40 dark:border-[#10B981]/30 bg-emerald-500/[0.03] dark:bg-[#10B981]/[0.02]"
                  )}
                >
                  {/* Step Header */}
                  <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                    onClick={() => setExpandedMilestoneId(isExpanded ? null : m.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 font-mono text-xs font-bold text-foreground/70 dark:text-foreground/50 bg-black/[0.04] dark:bg-white/5 w-8 h-8 rounded-xl flex items-center justify-center border border-black/10 dark:border-white/10">
                        M{idx + 1}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-foreground">{m.title}</h3>
                        <div className="flex items-center gap-3 text-xs text-foreground/50 font-mono mt-0.5">
                          <span className="text-[#0D9488] dark:text-[#2DD4BF] font-semibold">{m.amount.toLocaleString()} SUI</span>
                          <span>•</span>
                          <span>Due {new Date(m.deadline).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <StatusBadge status={m.status} />
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-foreground/50" /> : <ChevronDown className="w-4 h-4 text-foreground/50" />}
                    </div>
                  </div>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div className="space-y-4 pt-4 border-t border-black/5 dark:border-white/5">
                      <div className="space-y-1">
                        <span className="text-[11px] uppercase font-semibold text-foreground/60 tracking-wider">
                          Scope & Criteria
                        </span>
                        <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
                          {m.deliverable}
                        </p>
                      </div>

                      {m.status === "changes_requested" && m.revisionNote && (
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5 text-xs text-foreground/90">
                          <div className="flex items-center gap-1.5 text-amber-700 dark:text-[#F59E0B] font-semibold">
                            <Edit3 className="w-4 h-4" />
                            <span>Client Revision Request</span>
                          </div>
                          <p className="italic">"{m.revisionNote}"</p>
                        </div>
                      )}

                      {m.status === "disputed" && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 space-y-1 text-xs text-red-600 dark:text-red-300">
                          <div className="flex items-center gap-1.5 font-bold">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Dispute Active — Funds Locked</span>
                          </div>
                          <p>
                            This milestone is under review by both parties. Funds remain securely locked in the Sui smart contract.
                          </p>
                          {m.disputeReason && (
                            <p className="pt-1 text-foreground/80 italic">Reason: "{m.disputeReason}"</p>
                          )}
                        </div>
                      )}

                      {(m.status === "submitted" || m.status === "released" || m.status === "changes_requested") && m.submissionContent && (
                        <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#4DA2FF]" />
                              <span>Freelancer Submission</span>
                            </span>
                            {m.submittedAt && (
                              <span className="text-[11px] font-mono text-foreground/45">
                                Submitted {new Date(m.submittedAt).toLocaleString()}
                              </span>
                            )}
                          </div>

                          <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                            {m.submissionContent}
                          </p>

                          {m.submissionLinks && m.submissionLinks.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {m.submissionLinks.map((link, lIdx) => (
                                <a
                                  key={lIdx}
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/[0.04] dark:bg-black/30 border border-black/10 dark:border-white/10 text-xs text-[#2563EB] dark:text-[#4DA2FF] hover:text-[#7B61FF] transition-colors shadow-sm dark:shadow-none"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span className="truncate max-w-[240px]">{link}</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {m.status === "released" && m.onChainTxHash && (
                        <TransactionCard
                          tx={{
                            txHash: m.onChainTxHash,
                            amount: m.amount,
                            fromAddress: project.escrowObjectId ? `${formatSuiAddress(project.escrowObjectId)} (Sui Escrow)` : "Sui Escrow",
                            toAddress: freelancer?.walletAddress || freelancer?.id || "Freelancer Wallet"
                          }}
                        />
                      )}

                      {/* Actions Area */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-black/5 dark:border-white/5">
                        {!isClient && (m.status === "pending" || m.status === "changes_requested") && (
                          <GradientButton
                            size="md"
                            onClick={() => setSubmitModalMilestone(m)}
                            icon={<Send className="w-4 h-4 mr-1" />}
                          >
                            {m.status === "changes_requested" ? "Resubmit Milestone Deliverables" : "Submit Milestone Deliverables"}
                          </GradientButton>
                        )}

                        {isClient && m.status === "submitted" && (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3">
                            <div className="flex items-center gap-2">
                              <GradientButton
                                size="md"
                                loading={isReleasing}
                                onClick={() => handleApproveRelease(m.id)}
                                icon={<CheckCircle2 className="w-4 h-4 mr-1" />}
                              >
                                Approve & Release Payment ({m.amount.toLocaleString()} SUI)
                              </GradientButton>

                              <GhostButton
                                size="md"
                                onClick={() => setChangesModalMilestone(m)}
                                icon={<Edit3 className="w-3.5 h-3.5 mr-1" />}
                              >
                                Request Changes
                              </GhostButton>
                            </div>

                            <button
                              type="button"
                              onClick={() => setDisputeModalMilestone(m)}
                              className="text-xs text-foreground/60 hover:text-red-500 dark:hover:text-red-400 underline transition-colors"
                            >
                              Flag a Dispute
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        </div>

        {/* Modals */}
        {submitModalMilestone && (
          <MilestoneSubmissionModal
            milestone={submitModalMilestone}
            isOpen={!!submitModalMilestone}
            onClose={() => setSubmitModalMilestone(null)}
            onSubmit={async (content, links) => {
              await submitMilestoneWork(submitModalMilestone.id, content, links);
            }}
          />
        )}

        {changesModalMilestone && (
          <RequestChangesModal
            milestone={changesModalMilestone}
            isOpen={!!changesModalMilestone}
            onClose={() => setChangesModalMilestone(null)}
            onSubmit={(note) => {
              requestChangesOnMilestone(changesModalMilestone.id, note);
            }}
          />
        )}

        {disputeModalMilestone && (
          <DisputeModal
            milestone={disputeModalMilestone}
            isOpen={!!disputeModalMilestone}
            onClose={() => setDisputeModalMilestone(null)}
            onSubmit={async (reason) => {
              await flagDisputeOnMilestone(disputeModalMilestone.id, reason);
            }}
          />
        )}

        {showRatingModal && (
          <CompletionRatingModal
            isOpen={showRatingModal}
            freelancerName={freelancer?.name}
            onClose={() => setShowRatingModal(false)}
            onSubmit={(stars, comment) => {
              if (freelancer) {
                submitRating(project.id, freelancer.id, stars, comment);
              }
            }}
          />
        )}

        <MessagingModalStub
          isOpen={messageModalOpen}
          onClose={() => setMessageModalOpen(false)}
          counterpartyName={isClient ? freelancer?.name : client?.name}
        />
      </div>
    </AppShell>
  );
}
