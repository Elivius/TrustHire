"use client";

import React from "react";
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

export default function FreelancerActiveWorkPage() {
  const { currentUser, projects, milestones, users } = useApp();

  const myProjects = projects.filter(
    (p) =>
      Boolean(p.matchedFreelancerId) &&
      (p.matchedFreelancerId === currentUser.id ||
        (currentUser.walletAddress &&
          p.matchedFreelancerId?.toLowerCase() === currentUser.walletAddress.toLowerCase()) ||
        p.matchedFreelancerId?.toLowerCase() === currentUser.id.toLowerCase())
  );
  const matchedAwaitingEscrow = myProjects.filter((p) => p.status === "matched");
  const inProgressContracts = myProjects.filter((p) => p.status === "in_progress");
  const completedContracts = myProjects.filter((p) => p.status === "completed");

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

        {/* Section 1: Matched — Awaiting Escrow Funding */}
        {matchedAwaitingEscrow.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#D97706] dark:text-[#F59E0B] flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Matched — Waiting on Client Escrow Funding</span>
            </h2>

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
                        Matched with <strong>{clientUser?.name}</strong> • ${proj.estimatedBudget.toLocaleString()} USDC
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
          </div>
        )}

        {/* Section 2: In-Progress Contracts */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF]" />
            <span>Funded Active Contracts</span>
          </h2>

          {inProgressContracts.length === 0 && matchedAwaitingEscrow.length === 0 ? (
            <EmptyState
              icon={<Briefcase className="w-10 h-10 text-foreground/30" />}
              title="No active contracts right now"
              description="Apply to open projects or accept direct client invitations to start working with on-chain escrow protection."
              action={
                <Link href="/freelancer/browse">
                  <GradientButton size="sm">Browse Projects</GradientButton>
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
                          <span className="text-[#0D9488] dark:text-[#2DD4BF] font-semibold">${proj.estimatedBudget.toLocaleString()} USDC</span>
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
                          <span className="text-xs font-semibold text-foreground">{nextPending.title} (${nextPending.amount.toLocaleString()} USDC)</span>
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
          )}
        </div>

        {/* Section 3: Completed Contracts */}
        {completedContracts.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-black/5 dark:border-white/5">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
              <span>Completed Work History</span>
            </h2>

            <div className="space-y-3">
              {completedContracts.map((proj) => (
                <GlassCard key={proj.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-foreground">{proj.title}</h4>
                    <span className="text-xs text-foreground/50 font-mono">
                      ${proj.estimatedBudget.toLocaleString()} USDC • 100% Released
                    </span>
                  </div>

                  <Link href={`/project/${proj.id}/workspace`}>
                    <GhostButton size="sm">View Completed Record</GhostButton>
                  </Link>
                </GlassCard>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
