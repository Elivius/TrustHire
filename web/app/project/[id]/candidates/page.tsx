"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Sparkles,
  Users,
  Send,
  FileCheck2,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { AppShell } from "@/components/layout/app-shell";
import { GradientButton } from "@/components/ui/gradient-button";
import { GhostButton } from "@/components/ui/ghost-button";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ScoreBadge } from "@/components/ui/score-badge";
import { SkillChip } from "@/components/ui/skill-chip";
import { EmptyState } from "@/components/ui/empty-state";
import { computeFreelancerMatchForProject } from "@/lib/simulation";
import { clsx } from "clsx";

export default function CandidatesPage() {
  const params = useParams();
  const projectId = params.id as string;

  const {
    currentUser,
    projects,
    users,
    freelancerProfiles,
    invitations,
    applications,
    inviteFreelancer
  } = useApp();

  const [activeTab, setActiveTab] = useState<"recommended" | "applications" | "invited">("recommended");
  const [isMatchingLoading, setIsMatchingLoading] = useState(true);

  const project = projects.find((p) => p.id === projectId);

  // Simulated Match Freelancers loading state (1.5-3s)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMatchingLoading(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, [projectId]);

  if (!project) {
    return (
      <AppShell>
        <div className="text-center py-20">Project not found.</div>
      </AppShell>
    );
  }

  const projectInvitations = invitations.filter((i) => i.projectId === projectId);
  const projectApplications = applications.filter((a) => a.projectId === projectId);
  const matchedFreelancer = project.matchedFreelancerId
    ? users.find((u) => u.id === project.matchedFreelancerId)
    : null;

  // Ranked recommended freelancers
  const rankedFreelancers = Object.values(freelancerProfiles)
    .map((prof) => {
      const match = computeFreelancerMatchForProject(
        prof.skills,
        project.requiredSkills,
        prof.trustScore
      );
      return {
        profile: prof,
        user: users.find(
          (u) =>
            u.id.toLowerCase() === prof.userId.toLowerCase() ||
            (u.walletAddress && u.walletAddress.toLowerCase() === prof.userId.toLowerCase())
        ),
        match
      };
    })
    .filter((item) => item.user && item.profile.isDiscoverable)
    .sort((a, b) => b.match.matchScore - a.match.matchScore);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link
            href={`/project/${project.id}`}
            className="inline-flex items-center gap-1.5 text-xs text-foreground/60 hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Project Hub</span>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Candidates: {project.title}
              </h1>
              <p className="text-xs sm:text-sm text-foreground/60 mt-1">
                Review AI-matched engineers, active applicants, and outgoing invitations.
              </p>
            </div>
            <StatusBadge status={project.status} />
          </div>
        </div>

        {/* Deprioritization Banner if already matched */}
        {project.status === "matched" && matchedFreelancer && (
          <div className="p-4 rounded-2xl border border-[#2DD4BF]/30 bg-[#2DD4BF]/10 text-xs text-foreground/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF]" />
              <span>This project has already been matched with <strong>{matchedFreelancer.name}</strong>.</span>
            </div>
            <Link href={`/project/${project.id}/fund`}>
              <GradientButton size="sm">Continue to Escrow</GradientButton>
            </Link>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-black/10 dark:border-white/10 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("recommended")}
            className={clsx(
              "px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2",
              activeTab === "recommended"
                ? "bg-[#8B5CF6]/20 text-[#7C3AED] dark:text-[#A78BFA] border border-[#8B5CF6]/40"
                : "text-foreground/60 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            <Sparkles className="w-4 h-4 text-[#7C3AED] dark:text-[#8B5CF6]" />
            <span>Recommended</span>
            <span className="font-mono text-xs px-1.5 py-0.2 rounded-full bg-black/5 dark:bg-white/10 text-foreground">
              {rankedFreelancers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("applications")}
            className={clsx(
              "px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2",
              activeTab === "applications"
                ? "bg-[#4DA2FF]/20 text-[#2563EB] dark:text-[#4DA2FF] border border-[#4DA2FF]/40"
                : "text-foreground/60 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Applications</span>
            {projectApplications.length > 0 && (
              <span className="font-mono text-xs px-1.5 py-0.2 rounded-full bg-[#2563EB] dark:bg-[#4DA2FF] text-white">
                {projectApplications.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("invited")}
            className={clsx(
              "px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2",
              activeTab === "invited"
                ? "bg-black/10 dark:bg-white/15 text-foreground dark:text-white border border-black/15 dark:border-white/20"
                : "text-foreground/60 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            <Send className="w-4 h-4" />
            <span>Invited</span>
            <span className="font-mono text-xs px-1.5 py-0.2 rounded-full bg-black/5 dark:bg-white/10 text-foreground">
              {projectInvitations.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Recommended */}
        {activeTab === "recommended" && (
          <div className="space-y-4">
            {isMatchingLoading ? (
              <div className="p-12 text-center rounded-2xl border border-[#8B5CF6]/20 bg-[#8B5CF6]/[0.04] space-y-3">
                <div className="w-8 h-8 rounded-full bg-[#8B5CF6]/20 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center mx-auto animate-pulse">
                  <Sparkles className="w-5 h-5 animate-spin-slow" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Finding your best matches…</h3>
                <p className="text-xs text-foreground/60 max-w-sm mx-auto font-mono">
                  Gonka AI is evaluating verified skill vectors & on-chain trust scores.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {rankedFreelancers.map(({ profile, user, match }) => {
                  if (!user) return null;
                  const existingInv = projectInvitations.find((i) => i.freelancerId === user.id);

                  return (
                    <GlassCard
                      key={user.id}
                      className="p-5 sm:p-6 space-y-4 hover:border-black/20 dark:hover:border-white/20 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <img
                            src={user.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80"}
                            alt={user.name}
                            className="w-12 h-12 rounded-2xl object-cover border border-black/10 dark:border-white/10"
                          />
                          <div className="space-y-1">
                            <h3 className="text-base font-bold text-foreground">{user.name}</h3>
                            <p className="text-xs text-foreground/60 line-clamp-1">{profile.headline}</p>
                            <div className="flex items-center gap-2 pt-1">
                              <ScoreBadge score={match.matchScore} type="ai_match" size="sm" />
                              <ScoreBadge score={profile.trustScore} type="trust" size="sm" />
                            </div>
                          </div>
                        </div>

                        {/* Top Action */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          {existingInv ? (
                            <StatusBadge status={`Invited: ${existingInv.status}`} />
                          ) : project.status === "open" ? (
                            <GradientButton
                              size="sm"
                              onClick={() => inviteFreelancer(project.id, user.id)}
                              icon={<Send className="w-3.5 h-3.5 mr-1" />}
                            >
                              Invite
                            </GradientButton>
                          ) : null}

                          <Link href={`/project/${project.id}/candidates/${user.id}?source=recommended`}>
                            <GhostButton size="sm">View Profile</GhostButton>
                          </Link>
                        </div>
                      </div>

                      {/* AI Reasoning */}
                      <p className="text-xs text-foreground/75 leading-relaxed bg-black/[0.02] dark:bg-white/[0.02] p-3 rounded-xl border border-black/5 dark:border-white/5">
                        <span className="text-[#7C3AED] dark:text-[#A78BFA] font-semibold mr-1.5">Gonka AI:</span>
                        {match.reasoning}
                      </p>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {profile.skills.map((s) => (
                          <SkillChip
                            key={s}
                            label={s}
                            size="sm"
                            highlighted={project.requiredSkills.includes(s)}
                          />
                        ))}
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Applications */}
        {activeTab === "applications" && (
          <div className="space-y-4">
            {projectApplications.length === 0 ? (
              <EmptyState
                icon={<FileCheck2 className="w-10 h-10 text-foreground/30" />}
                title="No applications yet"
                description="Freelancers can apply once your project is visible in the open pool. In the meantime, check the Recommended tab to invite top AI matches."
                action={
                  <GhostButton size="sm" onClick={() => setActiveTab("recommended")}>
                    View AI Recommendations
                  </GhostButton>
                }
              />
            ) : (
              <div className="space-y-3">
                {projectApplications.map((app) => {
                  const applicant = users.find(
                    (u) =>
                      u.id.toLowerCase() === app.freelancerId.toLowerCase() ||
                      (u.walletAddress && u.walletAddress.toLowerCase() === app.freelancerId.toLowerCase())
                  ) || {
                    id: app.freelancerId,
                    name: app.freelancerId.startsWith("0x")
                      ? `Freelancer (${app.freelancerId.slice(0, 6)}...${app.freelancerId.slice(-4)})`
                      : "Applicant",
                    email: `${app.freelancerId.slice(0, 10)}@trusthire.io`,
                    roles: ["freelancer" as const],
                    walletAddress: app.freelancerId.startsWith("0x") ? app.freelancerId : undefined,
                    avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(app.freelancerId)}`
                  };

                  const prof = freelancerProfiles[app.freelancerId] ||
                    Object.entries(freelancerProfiles).find(([k]) => k.toLowerCase() === app.freelancerId.toLowerCase())?.[1] || {
                      userId: app.freelancerId,
                      headline: "Web3 Developer",
                      bio: "",
                      skills: project?.requiredSkills || ["Sui Move", "TypeScript"],
                      experienceLevel: "Intermediate" as const,
                      portfolioLinks: [],
                      trustScore: 92,
                      trustScoreConfidence: "High" as const,
                      trustScoreReasoning: [],
                      trustScoreRequestId: "req",
                      trustScoreUpdatedAt: new Date().toISOString(),
                      isDiscoverable: true,
                      completedProjectsCount: 5,
                      onTimeDeliveryPct: 95,
                      averageRating: 4.8
                    };

                  return (
                    <GlassCard key={app.id} className="p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={applicant.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80"}
                            alt={applicant.name}
                            className="w-11 h-11 rounded-2xl object-cover border border-black/10 dark:border-white/10"
                          />
                          <div>
                            <h4 className="font-semibold text-sm sm:text-base text-foreground">{applicant.name}</h4>
                            <p className="text-xs text-foreground/50">{prof.headline}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <ScoreBadge score={prof.trustScore} type="trust" size="sm" />
                          <StatusBadge status={app.status} />
                        </div>
                      </div>

                      {app.coverNote && (
                        <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 text-xs text-foreground/80 leading-relaxed">
                          <span className="text-foreground/50 block mb-1 font-semibold">Cover Note:</span>
                          "{app.coverNote}"
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
                        <span className="text-[11px] font-mono text-foreground/45">
                          Applied {new Date(app.appliedAt).toLocaleDateString()}
                        </span>
                        <Link href={`/project/${project.id}/candidates/${applicant.id}?source=applications&appId=${app.id}`}>
                          <GradientButton size="sm" icon={<ArrowRight className="w-3.5 h-3.5 ml-1" />}>
                            View Profile & Respond
                          </GradientButton>
                        </Link>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Invited */}
        {activeTab === "invited" && (
          <div className="space-y-4">
            {projectInvitations.length === 0 ? (
              <EmptyState
                icon={<Send className="w-10 h-10 text-foreground/30" />}
                title="You haven't invited anyone yet"
                description="Check the Recommended tab for AI-matched suggestions and invite top engineers directly."
                action={
                  <GradientButton size="sm" onClick={() => setActiveTab("recommended")}>
                    Explore Recommended Matches
                  </GradientButton>
                }
              />
            ) : (
              <div className="space-y-3">
                {projectInvitations.map((inv) => {
                  const invitee = users.find((u) => u.id === inv.freelancerId);
                  const prof = freelancerProfiles[inv.freelancerId];
                  if (!invitee || !prof) return null;

                  return (
                    <GlassCard key={inv.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={invitee.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"}
                          alt={invitee.name}
                          className="w-10 h-10 rounded-xl object-cover border border-black/10 dark:border-white/10"
                        />
                        <div>
                          <h4 className="font-semibold text-sm text-foreground">{invitee.name}</h4>
                          <p className="text-xs text-foreground/50">{prof.headline}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <ScoreBadge score={prof.trustScore} type="trust" size="sm" />
                        <StatusBadge status={inv.status} />
                        <Link href={`/project/${project.id}/candidates/${invitee.id}`}>
                          <GhostButton size="sm">Profile</GhostButton>
                        </Link>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
