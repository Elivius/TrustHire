"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Briefcase,
  Lock,
  Clock,
  ArrowRight,
  Send,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { AppShell } from "@/components/layout/app-shell";
import { GradientButton } from "@/components/ui/gradient-button";
import { GhostButton } from "@/components/ui/ghost-button";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { MilestoneStepper } from "@/components/ui/milestone-stepper";
import { formatSuiAddress } from "@/lib/sui/escrow";
import { clsx } from "clsx";

export default function FreelancerActiveWorkPage() {
  const { currentUser, projects, milestones, users } = useApp();
  const [activeTab, setActiveTab] = useState<"in_progress" | "completed" | "matched" | "all">("in_progress");

  const myProjects = useMemo(() => {
    return projects.filter(
      (p) =>
        Boolean(p.matchedFreelancerId) &&
        (p.matchedFreelancerId === currentUser.id ||
          p.matchedFreelancerId?.toLowerCase() === currentUser.id?.toLowerCase() ||
          (currentUser.walletAddress &&
            p.matchedFreelancerId?.toLowerCase() === currentUser.walletAddress.toLowerCase()))
    );
  }, [projects, currentUser]);

  const matchedAwaitingEscrow = useMemo(
    () => myProjects.filter((p) => p.status === "matched" || (p.status === "open" && !p.escrowObjectId)),
    [myProjects]
  );
  const inProgressContracts = useMemo(() => myProjects.filter((p) => p.status === "in_progress"), [myProjects]);
  const completedContracts = useMemo(() => myProjects.filter((p) => p.status === "completed"), [myProjects]);

  const renderInProgressContracts = () => (
    inProgressContracts.length === 0 ? (
      <EmptyState
        icon={<Briefcase className="w-10 h-10 text-foreground/30" />}
        title="No in-progress funded contracts"
        description="When a client funds smart contract escrow for your matched project, it will appear here ready for deliverable submissions."
        action={
          <Link href="/freelancer/browse">
            <GradientButton size="sm">Browse Open Projects</GradientButton>
          </Link>
        }
      />
    ) : (
      <div className="space-y-4">
        {inProgressContracts.map((proj) => {
          const clientUser = users.find((u) => u.id === proj.clientId);
          const projMs = milestones
            .filter((m) => m.projectId === proj.id)
            .sort((a, b) => {
              const aNum = a.title?.match(/Milestone\s+(\d+)/i)?.[1];
              const bNum = b.title?.match(/Milestone\s+(\d+)/i)?.[1];
              if (aNum && bNum) return parseInt(aNum, 10) - parseInt(bNum, 10);
              return (a.title || "").localeCompare(b.title || "");
            });
          const nextPending = projMs.find((m) => m.status === "pending" || m.status === "changes_requested");

          return (
            <GlassCard key={proj.id} className="p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-lg font-bold text-foreground">{proj.title}</h3>
                    <StatusBadge status="in_progress" />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-foreground/50 font-mono">
                    <span className="text-[#0D9488] dark:text-[#2DD4BF] font-semibold">{proj.estimatedBudget.toLocaleString()} SUI</span>
                    <span>•</span>
                    <span>Client: {clientUser?.name || "Client"}</span>
                    <span>•</span>
                    <span>Escrow Object: {proj.escrowObjectId ? formatSuiAddress(proj.escrowObjectId) : "Pending Escrow"}</span>
                  </div>
                </div>

                <Link href={`/project/${proj.id}/workspace`}>
                  <GradientButton size="sm" icon={<ArrowRight className="w-3.5 h-3.5 ml-1" />}>
                    Open Workspace
                  </GradientButton>
                </Link>
              </div>

              <div className="pt-2 border-t border-black/5 dark:border-white/5">
                <MilestoneStepper milestones={projMs} />
              </div>

              {nextPending && (
                <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-foreground/60 block">Current Actionable Milestone:</span>
                    <span className="text-xs font-semibold text-foreground">{nextPending.title} ({nextPending.amount.toLocaleString()} SUI)</span>
                  </div>
                  <Link href={`/project/${proj.id}/workspace`}>
                    <GradientButton size="sm">
                      {nextPending.status === "changes_requested" ? "Resubmit Deliverables" : "Submit Deliverables"}
                    </GradientButton>
                  </Link>
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>
    )
  );

  const renderMatchedContracts = () => (
    matchedAwaitingEscrow.length === 0 ? (
      <EmptyState
        icon={<Clock className="w-10 h-10 text-foreground/30" />}
        title="No matched proposals awaiting funding"
        description="When a client accepts your proposal, terms will appear here while they finalize and deposit escrow on Sui."
      />
    ) : (
      <div className="space-y-3">
        {matchedAwaitingEscrow.map((proj) => {
          const clientUser = users.find((u) => u.id === proj.clientId);
          return (
            <GlassCard
              key={proj.id}
              className="p-5 border-l-4 border-l-[#F59E0B] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-foreground">{proj.title}</h3>
                  <StatusBadge status="matched" />
                </div>
                <p className="text-xs text-foreground/70">
                  Matched with <strong>{clientUser?.name}</strong> • {proj.estimatedBudget.toLocaleString()} SUI
                </p>
                <p className="text-[11px] text-[#D97706] dark:text-[#F59E0B] font-mono">
                  Client is currently reviewing finalized terms and funding escrow on Sui.
                </p>
              </div>

              <Link href={`/project/${proj.id}`}>
                <GhostButton size="sm">View Terms</GhostButton>
              </Link>
            </GlassCard>
          );
        })}
      </div>
    )
  );

  const renderCompletedContracts = () => (
    completedContracts.length === 0 ? (
      <EmptyState
        icon={<CheckCircle2 className="w-10 h-10 text-foreground/30" />}
        title="No completed contracts yet"
        description="Contracts where 100% of milestone disbursements are released will be archived here."
      />
    ) : (
      <div className="space-y-3">
        {completedContracts.map((proj) => {
          const clientUser = users.find((u) => u.id === proj.clientId);
          return (
            <GlassCard key={proj.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-base text-foreground">{proj.title}</h4>
                  <StatusBadge status="completed" />
                </div>
                <div className="flex items-center gap-3 text-xs text-foreground/50 font-mono">
                  <span className="text-[#10B981] font-semibold">{proj.estimatedBudget.toLocaleString()} SUI • 100% Released</span>
                  {clientUser && (
                    <>
                      <span>•</span>
                      <span>Client: {clientUser.name}</span>
                    </>
                  )}
                  {proj.escrowObjectId && (
                    <>
                      <span>•</span>
                      <span>Object: {formatSuiAddress(proj.escrowObjectId)}</span>
                    </>
                  )}
                </div>
              </div>

              <Link href={`/project/${proj.id}/workspace`}>
                <GhostButton size="sm">View Completed Record</GhostButton>
              </Link>
            </GlassCard>
          );
        })}
      </div>
    )
  );

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Active Work & Contracts
            </h1>
            <p className="text-xs sm:text-sm text-foreground/60 mt-1">
              Manage ongoing milestone deliverables and view locked Sui smart contract escrows.
            </p>
          </div>

          <Link href="/freelancer/browse">
            <GradientButton size="sm">Find More Work</GradientButton>
          </Link>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs font-medium w-fit overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("in_progress")}
            className={clsx(
              "px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap",
              activeTab === "in_progress"
                ? "bg-white dark:bg-[#1C1D2A] text-[#0D9488] dark:text-[#2DD4BF] font-semibold shadow-sm"
                : "text-foreground/60 hover:text-foreground"
            )}
          >
            Funded (In Progress) ({inProgressContracts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("matched")}
            className={clsx(
              "px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap",
              activeTab === "matched"
                ? "bg-white dark:bg-[#1C1D2A] text-[#D97706] dark:text-[#F59E0B] font-semibold shadow-sm"
                : "text-foreground/60 hover:text-foreground"
            )}
          >
            Awaiting Escrow ({matchedAwaitingEscrow.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={clsx(
              "px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap",
              activeTab === "completed"
                ? "bg-white dark:bg-[#1C1D2A] text-[#10B981] font-semibold shadow-sm"
                : "text-foreground/60 hover:text-foreground"
            )}
          >
            Completed ({completedContracts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={clsx(
              "px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap",
              activeTab === "all"
                ? "bg-white dark:bg-[#1C1D2A] text-foreground font-semibold shadow-sm"
                : "text-foreground/60 hover:text-foreground"
            )}
          >
            All ({myProjects.length})
          </button>
        </div>

        {/* Tab Content Display */}
        {activeTab === "in_progress" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF]" />
              <span>Funded Active Contracts</span>
            </h2>
            {renderInProgressContracts()}
          </div>
        )}

        {activeTab === "matched" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#D97706] dark:text-[#F59E0B]" />
              <span>Matched — Waiting on Client Escrow Funding</span>
            </h2>
            {renderMatchedContracts()}
          </div>
        )}

        {activeTab === "completed" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
              <span>Completed Work History</span>
            </h2>
            {renderCompletedContracts()}
          </div>
        )}

        {activeTab === "all" && (
          myProjects.length === 0 ? (
            <EmptyState
              icon={<Briefcase className="w-10 h-10 text-foreground/30" />}
              title="No contracts right now"
              description="Apply to open projects or accept direct client invitations to start working with on-chain escrow protection."
              action={
                <Link href="/freelancer/browse">
                  <GradientButton size="sm">Browse Projects</GradientButton>
                </Link>
              }
            />
          ) : (
            <div className="space-y-8">
              {inProgressContracts.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF]" />
                    <span>Funded Active Contracts ({inProgressContracts.length})</span>
                  </h2>
                  {renderInProgressContracts()}
                </div>
              )}

              {matchedAwaitingEscrow.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-black/5 dark:border-white/5">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-[#D97706] dark:text-[#F59E0B] flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Matched — Waiting on Client Escrow Funding ({matchedAwaitingEscrow.length})</span>
                  </h2>
                  {renderMatchedContracts()}
                </div>
              )}

              {completedContracts.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-black/5 dark:border-white/5">
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    <span>Completed Work History ({completedContracts.length})</span>
                  </h2>
                  {renderCompletedContracts()}
                </div>
              )}
            </div>
          )
        )}
      </div>
    </AppShell>
  );
}
