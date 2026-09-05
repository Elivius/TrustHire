"use client";

import React, { useState, useMemo } from "react";
import { useEffect, useRef } from "react";
import { useInView } from "framer-motion";
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

function ScoreRing({
  score,
  label,
  color = "violet",
  delay = 0,
  size = 72,
}: {
  score: number;
  label: string;
  color?: "violet" | "teal";
  delay?: number;
  size?: number;
}) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const isInView = useInView(ref, {
    once: true,
    margin: "-50px",
  });

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

  const radius = 42;
  const circumference = 2 * Math.PI * radius;

  const strokeOffset =
    circumference - (animatedScore / 100) * circumference;

  const strokeColor =
    color === "violet" ? "#8B5CF6" : "#2DD4BF";

  const glowColor =
    color === "violet"
      ? "drop-shadow(0 0 6px rgba(139,92,246,0.4))"
      : "drop-shadow(0 0 6px rgba(45,212,191,0.4))";

  return (
    <div
      ref={ref}
      className="flex flex-col items-center gap-1.5"
    >
      <div
        className="relative"
        style={{
          width: size,
          height: size,
        }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full -rotate-90"
          style={{ filter: glowColor }}
        >
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-black/[0.08] dark:text-white/[0.06]"
            strokeWidth="6"
          />

          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            style={{
              transition:
                "stroke-dashoffset 1.2s cubic-bezier(0.32, 0.72, 0, 1)",
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

export default function ActiveWorkspacePage() {
  const params = useParams();
  const projectId = params.id as string;

  const {
    currentUser,
    activeRole,
    projects,
    milestones,
    milestoneVerifications,
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
  console.log("[DEBUG] MILESTONES:", milestones);

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
              const verification = milestoneVerifications?.[m.id];

              const isSubmitted =
                m.status === "submitted";

              const isChangesRequested =
                m.status === "changes_requested";

              const isApproved =
                m.status === "approved";

              const isReleased =
                m.status === "released";

              const isDisputed =
                m.status === "disputed";

              const canSubmit =
                !isClient &&
                (m.status === "pending" ||
                  m.status === "changes_requested");

              const canRequestChanges =
                isClient &&
                m.status === "submitted";

              const canApprove =
                isClient &&
                m.status === "submitted";

              const canDispute =
                isClient &&
                !isReleased &&
                !isDisputed;

              return (
                <GlassCard
                  key={m.id}
                  className="overflow-hidden"
                >
                  {/* Milestone Header */}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedMilestoneId(
                        isExpanded ? null : m.id
                      )
                    }
                    className="w-full p-5 sm:p-6 text-left hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0">
                        <div
                          className={clsx(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                            isReleased
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                              : isDisputed
                              ? "bg-red-500/10 border-red-500/20 text-red-500"
                              : isSubmitted
                              ? "bg-blue-500/10 border-blue-500/20 text-blue-500"
                              : isChangesRequested
                              ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                              : "bg-[#2DD4BF]/10 border-[#2DD4BF]/20 text-[#2DD4BF]"
                          )}
                        >
                          {isReleased ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : isDisputed ? (
                            <AlertTriangle className="w-5 h-5" />
                          ) : isSubmitted ? (
                            <Send className="w-5 h-5" />
                          ) : (
                            <span className="text-sm font-bold">
                              {idx + 1}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-foreground">
                              {m.title}
                            </span>

                            <StatusBadge status={m.status} />
                          </div>

                          <p className="text-xs text-foreground/60 mt-1">
                            {m.deliverable}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right hidden sm:block">
                          <div className="text-sm font-bold text-foreground">
                            {m.amount.toLocaleString()} SUI
                          </div>
                          <div className="text-[10px] text-foreground/50 font-mono">
                            {m.percentOfBudget}% of budget
                          </div>
                        </div>

                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-foreground/50" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-foreground/50" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Milestone */}
                  {isExpanded && (
                    <div className="px-5 pb-6 sm:px-6 space-y-5">

                      {/* Scope & Criteria */}
                      <div className="p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="w-4 h-4 text-[#2563EB] dark:text-[#4DA2FF]" />
                          <span className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                            Scope & Criteria
                          </span>
                        </div>

                        <p className="text-sm text-foreground/75 leading-relaxed">
                          {m.deliverable}
                        </p>

                        <div className="flex items-center gap-2 mt-3 text-xs text-foreground/50">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            Deadline: {m.deadline}
                          </span>
                        </div>
                      </div>

                      {/* Revision Note */}
                      {m.revisionNote && (
                        <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.05]">
                          <div className="flex items-center gap-2 mb-2">
                            <Edit3 className="w-4 h-4 text-amber-500" />
                            <span className="text-xs font-bold text-amber-500">
                              Changes Requested
                            </span>
                          </div>

                          <p className="text-sm text-foreground/75">
                            {m.revisionNote}
                          </p>
                        </div>
                      )}

                      {/* Freelancer Submission */}
                      {m.submissionContent ||
                      (m.submissionLinks &&
                        m.submissionLinks.length > 0) ? (
                        <div className="p-4 rounded-2xl border border-black/10 dark:border-white/10">
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2">
                              <Send className="w-4 h-4 text-[#8B5CF6]" />
                              <span className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                                Freelancer Submission
                              </span>
                            </div>

                            {m.submittedAt && (
                              <span className="text-[10px] font-mono text-foreground/40">
                                {new Date(
                                  m.submittedAt
                                ).toLocaleString()}
                              </span>
                            )}
                          </div>

                          {m.submissionContent && (
                            <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] mb-3">
                              <p className="text-sm text-foreground/75 whitespace-pre-wrap">
                                {m.submissionContent}
                              </p>
                            </div>
                          )}

                          {m.submissionLinks &&
                            m.submissionLinks.length > 0 && (
                              <div className="space-y-2">
                                {m.submissionLinks.map(
                                  (link, linkIdx) => (
                                    <a
                                      key={`${m.id}-link-${linkIdx}`}
                                      href={link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-xs text-[#2563EB] dark:text-[#4DA2FF] hover:underline break-all"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                      <span>{link}</span>
                                    </a>
                                  )
                                )}
                              </div>
                            )}
                        </div>
                      ) : null}

                      {/* Gonka AI Verification */}
                      {verification && (
                        <div className="rounded-2xl border border-[#8B5CF6]/25 bg-[#8B5CF6]/[0.04] overflow-hidden">
                          {/* Verification Header */}
                          <div className="p-4 sm:p-5 border-b border-[#8B5CF6]/15">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/20 flex items-center justify-center">
                                  <CheckCircle2 className="w-5 h-5 text-[#8B5CF6]" />
                                </div>

                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-bold text-foreground">
                                      Gonka AI Verification
                                    </span>
                                  </div>

                                  <p className="text-xs text-foreground/50 mt-0.5">
                                    Submission evidence analysis
                                  </p>
                                </div>
                              </div>

                              {/* Gonka Verification Score */}
                              <div className="flex items-center justify-center">
                                <ScoreRing
                                  score={verification.score ?? 0}
                                  label="Verification Score"
                                  color="violet"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Reasoning */}
                          {verification.reasoning && (
                            <div className="p-4 sm:p-5 border-b border-black/5 dark:border-white/5">
                              <div className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-2">
                                AI Reasoning
                              </div>

                              <p className="text-sm text-foreground/75 leading-relaxed whitespace-pre-wrap">
                                {verification.reasoning}
                              </p>
                            </div>
                          )}

                          {/* Suggestions */}
                          {verification.suggestions &&
                            verification.suggestions.length > 0 && (
                              <div className="p-4 sm:p-5 border-b border-black/5 dark:border-white/5">
                                <div className="flex items-center gap-2 mb-3">
                                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                                  <span className="text-xs font-bold uppercase tracking-wider text-foreground/50">
                                    Suggestions
                                  </span>
                                </div>

                                <div className="space-y-2">
                                  {verification.suggestions.map(
                                    (suggestion, suggestionIdx) => (
                                      <div
                                        key={`${m.id}-suggestion-${suggestionIdx}`}
                                        className="flex items-start gap-2"
                                      >
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#8B5CF6] shrink-0" />

                                        <p className="text-sm text-foreground/70">
                                          {suggestion}
                                        </p>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Evidence Metadata */}
                          <div className="p-4 sm:p-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                              {verification.repository && (
                                <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
                                  <span className="text-[10px] uppercase tracking-wider text-foreground/40 block mb-1">
                                    Repository
                                  </span>
                                  <span className="text-xs font-mono text-foreground/75 break-all">
                                    {verification.repository}
                                  </span>
                                </div>
                              )}

                              {verification.prNumber && (
                                <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
                                  <span className="text-[10px] uppercase tracking-wider text-foreground/40 block mb-1">
                                    Pull Request
                                  </span>
                                  <span className="text-xs font-mono text-foreground/75">
                                    #{verification.prNumber}
                                  </span>
                                </div>
                              )}

                              {verification.prTitle && (
                                <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
                                  <span className="text-[10px] uppercase tracking-wider text-foreground/40 block mb-1">
                                    PR Title
                                  </span>
                                  <span className="text-xs text-foreground/75">
                                    {verification.prTitle}
                                  </span>
                                </div>
                              )}

                              {verification.gonkaRequestId && (
                                <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
                                  <span className="text-[10px] uppercase tracking-wider text-foreground/40 block mb-1">
                                    Gonka Request ID
                                  </span>
                                  <span className="text-xs font-mono text-foreground/75 break-all">
                                    {verification.gonkaRequestId}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* On-chain Milestone Proof */}
                      {m.onChainTxHash && (
                        <TransactionCard
                          tx={{
                            txHash: m.onChainTxHash,
                            amount: m.amount,
                            fromAddress:
                              client?.walletAddress ||
                              client?.id ||
                              "",
                            toAddress:
                              freelancer?.walletAddress ||
                              freelancer?.id ||
                              "",
                          }}
                        />
                      )}

                      {/* Milestone Actions */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">

                        {/* Freelancer Submit */}
                        {canSubmit && (
                          <GradientButton
                            onClick={() =>
                              setSubmitModalMilestone(m)
                            }
                          >
                            <Send className="w-3.5 h-3.5" />
                            {isChangesRequested
                              ? "Resubmit Work"
                              : "Submit Work"}
                          </GradientButton>
                        )}

                        {/* Client Request Changes */}
                        {canRequestChanges && (
                          <GhostButton
                            onClick={() =>
                              setChangesModalMilestone(m)
                            }
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Request Changes
                          </GhostButton>
                        )}

                        {/* Client Approve */}
                        {canApprove && (
                          <GradientButton
                            disabled={
                              releasingMilestoneId === m.id
                            }
                            onClick={() =>
                              handleApproveRelease(m.id)
                            }
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {releasingMilestoneId === m.id
                              ? "Releasing..."
                              : "Approve & Release"}
                          </GradientButton>
                        )}

                        {/* Dispute */}
                        {canDispute && (
                          <GhostButton
                            onClick={() =>
                              setDisputeModalMilestone(m)
                            }
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Raise Dispute
                          </GhostButton>
                        )}

                        {/* Released State */}
                        {isReleased && (
                          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500">
                            <CheckCircle2 className="w-4 h-4" />
                            Milestone payment released
                          </div>
                        )}

                        {/* Approved State */}
                        {isApproved && !isReleased && (
                          <div className="flex items-center gap-2 text-xs font-semibold text-blue-500">
                            <CheckCircle2 className="w-4 h-4" />
                            Milestone approved
                          </div>
                        )}

                        {/* Disputed State */}
                        {isDisputed && (
                          <div className="flex items-center gap-2 text-xs font-semibold text-red-500">
                            <AlertTriangle className="w-4 h-4" />
                            Milestone is under dispute
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </GlassCard>
              );
            })}

            {projMilestones.length === 0 && (
              <GlassCard className="p-8 text-center">
                <FileText className="w-8 h-8 mx-auto text-foreground/30 mb-3" />
                <p className="text-sm text-foreground/60">
                  No milestones found for this project.
                </p>
              </GlassCard>
            )}
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
