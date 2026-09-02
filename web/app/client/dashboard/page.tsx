"use client";

import React from "react";
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
  Users
} from "lucide-react";
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

export default function ClientDashboardPage() {
  const {
    currentUser,
    projects,
    milestones,
    users,
    freelancerProfiles
  } = useApp();

  const clientProjects = projects.filter((p) => p.clientId === currentUser.id);
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
                    <span className="text-foreground/50 ml-2">(${p.estimatedBudget.toLocaleString()} USDC)</span>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <GlassCard className="p-4 sm:p-5">
            <span className="text-[11px] font-mono uppercase text-foreground/50 block">Active Projects</span>
            <div className="text-2xl font-bold text-foreground mt-1 font-mono">{activeProjects.length}</div>
            <span className="text-[11px] text-foreground/40 mt-1 block">In development</span>
          </GlassCard>

          <Link href="/client/escrow" className="block">
            <GlassCard className="p-4 sm:p-5 hover:border-black/20 dark:hover:border-white/20 transition-all cursor-pointer">
              <span className="text-[11px] font-mono uppercase text-foreground/50 block">Total Escrowed</span>
              <div className="text-2xl font-bold text-[#0D9488] dark:text-[#2DD4BF] mt-1 font-mono">
                ${totalEscrowed.toLocaleString()} <span className="text-xs font-normal">USDC</span>
              </div>
              <span className="text-[11px] text-[#0D9488] dark:text-[#2DD4BF]/80 mt-1 flex items-center gap-1 font-medium">
                <span>View ledger</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </GlassCard>
          </Link>

          <GlassCard className="p-4 sm:p-5">
            <span className="text-[11px] font-mono uppercase text-foreground/50 block">Freelancers Hired</span>
            <div className="text-2xl font-bold text-foreground mt-1 font-mono">{hiredFreelancersCount}</div>
            <span className="text-[11px] text-foreground/40 mt-1 block">Verified engineers</span>
          </GlassCard>

          <GlassCard className="p-4 sm:p-5">
            <span className="text-[11px] font-mono uppercase text-foreground/50 block">Avg. Trust Score</span>
            <div className="text-2xl font-bold text-[#7C3AED] dark:text-[#A78BFA] mt-1 font-mono">{avgTrustScore}/100</div>
            <span className="text-[11px] text-foreground/40 mt-1 block">Gonka AI verified</span>
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
                            ${proj.estimatedBudget.toLocaleString()} USDC • {proj.timelineDays} days
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
