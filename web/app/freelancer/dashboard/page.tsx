"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Compass,
  Coins,
  Briefcase,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { AppShell } from "@/components/layout/app-shell";
import { GradientButton } from "@/components/ui/gradient-button";
import { GhostButton } from "@/components/ui/ghost-button";
import { GlassCard } from "@/components/ui/glass-card";
import { ScoreBadge } from "@/components/ui/score-badge";
import { SkillChip } from "@/components/ui/skill-chip";
import { StatusBadge } from "@/components/ui/status-badge";
import { MilestoneStepper } from "@/components/ui/milestone-stepper";
import { computeFreelancerMatchForProject } from "@/lib/simulation";

export default function FreelancerDashboardPage() {
  const {
    currentUser,
    projects,
    milestones,
    freelancerProfiles,
    transactions
  } = useApp();

  const profile = freelancerProfiles[currentUser.id] || {
    trustScore: 96,
    trustScoreConfidence: "High",
    headline: "Senior Move & Full-Stack Developer",
    skills: ["React", "TypeScript", "Sui Move", "Smart Contracts"],
    completedProjectsCount: 14
  };

  const myMatchedProjects = projects.filter(
    (p) => p.matchedFreelancerId === currentUser.id
  );
  const activeContracts = myMatchedProjects.filter(
    (p) => p.status === "in_progress" || p.status === "matched"
  );
  const completedProjects = myMatchedProjects.filter(
    (p) => p.status === "completed"
  );

  const totalEarned = transactions
    .filter((t) => t.type === "milestone_released" && myMatchedProjects.some((p) => p.id === t.projectId))
    .reduce((sum, t) => sum + t.amount, 0);

  const openProjects = projects.filter((p) => p.status === "open");

  return (
    <AppShell>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Header with Trust Score Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <ScoreBadge score={profile.trustScore} type="trust" size="lg" showLabel={false} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Welcome back, {currentUser.name.split(" ")[0]}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#2DD4BF]/10 text-[#2DD4BF] border border-[#2DD4BF]/30 font-semibold font-mono">
                  Trust Score: {profile.trustScore}/100
                </span>
              </div>
              <Link
                href="/freelancer/profile"
                className="text-xs text-[#2DD4BF] hover:underline flex items-center gap-1 mt-0.5"
              >
                <span>View full Gonka AI trust score breakdown</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <Link href="/freelancer/browse">
            <GradientButton size="md" icon={<Compass className="w-4 h-4" />}>
              Browse Open Projects
            </GradientButton>
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <GlassCard className="p-5">
            <span className="text-[11px] font-mono uppercase text-foreground/50 block">Active Contracts</span>
            <div className="text-2xl font-bold text-white mt-1 font-mono">{activeContracts.length}</div>
            <span className="text-[11px] text-foreground/40 mt-1 block">In development</span>
          </GlassCard>

          <Link href="/freelancer/earnings" className="block">
            <GlassCard className="p-5 hover:border-white/20 transition-all cursor-pointer">
              <span className="text-[11px] font-mono uppercase text-foreground/50 block">Total Earned</span>
              <div className="text-2xl font-bold text-[#2DD4BF] mt-1 font-mono">
                ${(totalEarned || 1500).toLocaleString()} <span className="text-xs font-normal">USDC</span>
              </div>
              <span className="text-[11px] text-[#2DD4BF]/80 mt-1 flex items-center gap-1">
                <span>View earnings proof</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </GlassCard>
          </Link>

          <GlassCard className="p-5">
            <span className="text-[11px] font-mono uppercase text-foreground/50 block">Completed Projects</span>
            <div className="text-2xl font-bold text-white mt-1 font-mono">
              {profile.completedProjectsCount || 14}
            </div>
            <span className="text-[11px] text-foreground/40 mt-1 block">100% on-chain delivery</span>
          </GlassCard>

          <GlassCard className="p-5">
            <span className="text-[11px] font-mono uppercase text-foreground/50 block">Gonka Match Rank</span>
            <div className="text-2xl font-bold text-[#A78BFA] mt-1 font-mono">Top 2%</div>
            <span className="text-[11px] text-foreground/40 mt-1 block">Move / React Ecosystem</span>
          </GlassCard>
        </div>

        {/* Active Work Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#4DA2FF]" />
              <span>Active Work & Contracts</span>
            </h2>
            <Link href="/freelancer/active-work" className="text-xs text-[#4DA2FF] hover:underline flex items-center gap-1">
              <span>View all active contracts</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {activeContracts.length === 0 ? (
            <GlassCard className="text-center py-10 space-y-3">
              <p className="text-xs sm:text-sm text-foreground/60">No active contracts right now.</p>
              <Link href="/freelancer/browse">
                <GradientButton size="sm">Browse Recommended Projects</GradientButton>
              </Link>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeContracts.map((proj) => {
                const projMs = milestones.filter((m) => m.projectId === proj.id);
                const nextPending = projMs.find((m) => m.status === "pending" || m.status === "changes_requested");

                return (
                  <Link key={proj.id} href={`/project/${proj.id}/workspace`} className="block group">
                    <GlassCard hoverEffect className="p-5 sm:p-6 space-y-4 h-full border-white/10 group-hover:border-[#4DA2FF]/40">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-sm sm:text-base text-white group-hover:text-[#4DA2FF] transition-colors">
                            {proj.title}
                          </h3>
                          <p className="text-xs text-foreground/50 font-mono">
                            ${proj.estimatedBudget.toLocaleString()} USDC • Escrow Funded
                          </p>
                        </div>
                        <StatusBadge status={proj.status} />
                      </div>

                      <div className="pt-1">
                        <MilestoneStepper milestones={projMs} orientation="horizontal" />
                      </div>

                      {nextPending && (
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                          <span className="text-xs text-foreground/60 truncate max-w-[200px]">
                            Next: {nextPending.title}
                          </span>
                          <span className="text-xs font-semibold text-[#2DD4BF] group-hover:underline">
                            Submit Deliverables ?
                          </span>
                        </div>
                      )}
                    </GlassCard>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* AI-Recommended Projects For You Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-[#8B5CF6]/20 text-[#A78BFA]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">AI-Recommended Projects For You</h2>
                <span className="text-[11px] text-[#A78BFA] font-mono">Powered by Gonka Router AI</span>
              </div>
            </div>

            <Link href="/freelancer/browse" className="text-xs text-[#A78BFA] hover:underline flex items-center gap-1">
              <span>See all recommendations</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {openProjects.slice(0, 3).map((proj) => {
              const matchResult = computeFreelancerMatchForProject(
                profile.skills,
                proj.requiredSkills,
                profile.trustScore
              );

              return (
                <GlassCard key={proj.id} className="p-5 space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm sm:text-base text-white line-clamp-1">
                        {proj.title}
                      </h3>
                      <ScoreBadge score={matchResult.matchScore} type="ai_match" size="sm" />
                    </div>

                    <div className="text-xs font-mono text-[#2DD4BF] font-semibold">
                      ${proj.estimatedBudget.toLocaleString()} USDC • {proj.timelineDays} days
                    </div>

                    <p className="text-xs text-foreground/75 line-clamp-2 leading-relaxed bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                      <span className="text-[#A78BFA] font-semibold mr-1">AI Match:</span>
                      {matchResult.reasoning}
                    </p>

                    <div className="flex flex-wrap gap-1">
                      {proj.requiredSkills.slice(0, 3).map((s) => (
                        <SkillChip
                          key={s}
                          label={s}
                          size="sm"
                          highlighted={profile.skills.includes(s)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-foreground/45 font-mono">
                      Posted {new Date(proj.createdAt).toLocaleDateString()}
                    </span>
                    <Link href={`/project/${proj.id}`}>
                      <GradientButton size="sm">View & Apply</GradientButton>
                    </Link>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
