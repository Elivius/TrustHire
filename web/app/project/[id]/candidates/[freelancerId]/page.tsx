"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Globe,
  ExternalLink,
  Star,
  Clock,
  Briefcase
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { AppShell } from "@/components/layout/app-shell";
import { GlassCard } from "@/components/ui/glass-card";
import { ScoreBadge } from "@/components/ui/score-badge";
import { GradientButton } from "@/components/ui/gradient-button";
import { GhostButton } from "@/components/ui/ghost-button";
import { SkillChip } from "@/components/ui/skill-chip";
import { StatusBadge } from "@/components/ui/status-badge";
import { computeFreelancerMatchForProject } from "@/lib/simulation";
import { MessagingModalStub } from "@/components/layout/messaging-modal-stub";
import { useCurrentClient } from "@mysten/dapp-kit-react";
import {
  resolveFreelancerReputationRecordId,
  fetchOnChainReputationRecord,
  getSuiscanObjectUrl,
  formatSuiAddress,
  type OnChainReputationData,
} from "@/lib/sui/escrow";

export default function FreelancerProfileDetailClientViewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.id as string;
  const freelancerId = params.freelancerId as string;
  const fromTab = searchParams.get("from") || searchParams.get("source") || "recommended";

  const {
    projects,
    milestones,
    users,
    freelancerProfiles,
    invitations,
    applications,
    inviteFreelancer,
    respondToApplication,
    ratings
  } = useApp();

  const client = useCurrentClient();
  const [repRecordId, setRepRecordId] = useState<string | null>(null);
  const [onChainRep, setOnChainRep] = useState<OnChainReputationData | null>(null);

  const [messagingOpen, setMessagingOpen] = useState(false);
  const [messagingName, setMessagingName] = useState("");

  const project = projects.find((p) => p.id === projectId);
  const freelancerUser = users.find(
    (u) =>
      u.id.toLowerCase() === freelancerId.toLowerCase() ||
      (u.walletAddress && u.walletAddress.toLowerCase() === freelancerId.toLowerCase())
  ) || {
    id: freelancerId,
    name: freelancerId.startsWith("0x")
      ? `Freelancer (${freelancerId.slice(0, 6)}...${freelancerId.slice(-4)})`
      : "Applicant",
    email: `${freelancerId.slice(0, 10)}@trusthire.io`,
    roles: ["freelancer" as const],
    walletAddress: freelancerId.startsWith("0x") ? freelancerId : undefined,
    avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(freelancerId)}`
  };

  const profile = freelancerProfiles[freelancerId] ||
    Object.entries(freelancerProfiles).find(([k]) => k.toLowerCase() === freelancerId.toLowerCase())?.[1] || {
      userId: freelancerId,
      headline: "Web3 & Distributed Systems Specialist",
      bio: "Web3 developer and contributor.",
      skills: project?.requiredSkills || ["Sui Move", "TypeScript"],
      experienceLevel: "Intermediate" as const,
      portfolioLinks: [],
      trustScore: 92,
      trustScoreConfidence: "High" as const,
      trustScoreReasoning: [
        { label: "Verified applicant", note: "Identity confirmed on Sui testnet." }
      ],
      trustScoreRequestId: "gonka_applicant",
      trustScoreUpdatedAt: new Date().toISOString(),
      isDiscoverable: true,
      completedProjectsCount: 6,
      onTimeDeliveryPct: 96,
      averageRating: 4.8
    };

  const existingInvitation = project
    ? invitations.find(
        (i) => i.projectId === projectId && i.freelancerId.toLowerCase() === freelancerId.toLowerCase()
      )
    : undefined;
  const existingApplication = project
    ? applications.find(
        (a) => a.projectId === projectId && a.freelancerId.toLowerCase() === freelancerId.toLowerCase()
      )
    : undefined;

  const matchResult = computeFreelancerMatchForProject(
    profile.skills,
    project?.requiredSkills || [],
    profile.trustScore
  );

  const candidateAddress = freelancerUser.walletAddress || (freelancerUser.id.startsWith("0x") ? freelancerUser.id : null);

  useEffect(() => {
    let isCancelled = false;
    async function loadRep() {
      if (!client || !candidateAddress) return;
      try {
        const recordId = await resolveFreelancerReputationRecordId(client, candidateAddress);
        if (!isCancelled) {
          setRepRecordId(recordId);
        }
        if (recordId) {
          const rec = await fetchOnChainReputationRecord(client, candidateAddress);
          if (!isCancelled && rec) {
            setOnChainRep(rec);
          }
        }
      } catch (err) {
        console.error("Failed to load candidate on-chain reputation:", err);
      }
    }
    loadRep();
    return () => {
      isCancelled = true;
    };
  }, [client, candidateAddress]);

  // Candidate's verified project earnings from released milestones across projects
  const candidateEarnedSui = React.useMemo(() => {
    const candidateProjects = projects.filter(
      (p) =>
        Boolean(p.matchedFreelancerId) &&
        (p.matchedFreelancerId === freelancerId ||
          p.matchedFreelancerId?.toLowerCase() === freelancerId.toLowerCase() ||
          (candidateAddress && p.matchedFreelancerId?.toLowerCase() === candidateAddress.toLowerCase()))
    );
    const releasedMs = milestones.filter(
      (m) => m.status === "released" && candidateProjects.some((p) => p.id === m.projectId)
    );
    return releasedMs.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  }, [projects, milestones, freelancerId, candidateAddress]);

  const candidateCompletedCount = React.useMemo(() => {
    const candidateProjects = projects.filter(
      (p) =>
        Boolean(p.matchedFreelancerId) &&
        (p.matchedFreelancerId === freelancerId ||
          p.matchedFreelancerId?.toLowerCase() === freelancerId.toLowerCase() ||
          (candidateAddress && p.matchedFreelancerId?.toLowerCase() === candidateAddress.toLowerCase()))
    );
    const completed = candidateProjects.filter((p) => p.status === "completed").length;
    if (completed > 0) return completed;
    if (onChainRep && onChainRep.completedProjects > 0) return onChainRep.completedProjects;
    return profile.completedProjectsCount || 0;
  }, [projects, freelancerId, candidateAddress, onChainRep, profile.completedProjectsCount]);

  if (!project) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
          <h2 className="text-xl font-bold text-white">Project not found</h2>
          <Link href="/client/projects">
            <GhostButton icon={<ArrowLeft className="w-4 h-4" />}>Return to Projects</GhostButton>
          </Link>
        </div>
      </AppShell>
    );
  }

  const freelancerRatings = ratings.filter((r) => r.freelancerId === freelancerId);

  const handleInvite = () => {
    inviteFreelancer(projectId, freelancerId);
  };

  const handleApproveApplication = () => {
    if (existingApplication) {
      respondToApplication(existingApplication.id, "accepted");
      router.push(`/project/${projectId}`);
    }
  };

  const handleDeclineApplication = () => {
    if (existingApplication) {
      respondToApplication(existingApplication.id, "declined");
    }
  };

  const openMessage = () => {
    setMessagingName(freelancerUser.name);
    setMessagingOpen(true);
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Back link */}
        <Link
          href={`/project/${projectId}/candidates`}
          className="inline-flex items-center gap-1.5 text-xs text-foreground/60 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Candidate Pool for {project.title}</span>
        </Link>

        {/* Header Profile Card */}
        <GlassCard className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <img
                src={freelancerUser.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"}
                alt={freelancerUser.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-black/10 dark:border-white/10 shrink-0"
              />
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">{freelancerUser.name}</h1>
                <p className="text-xs sm:text-sm text-[#2563EB] dark:text-[#4DA2FF] font-medium">{profile.headline}</p>
                <div className="flex items-center gap-2.5 pt-1 text-xs text-foreground/60 flex-wrap">
                  <span className="flex items-center gap-1 text-amber-500 dark:text-amber-400 font-mono font-semibold">
                    <Star className="w-3.5 h-3.5 fill-amber-500 dark:fill-amber-400" />
                    {profile.averageRating.toFixed(1)} ({candidateCompletedCount} projects)
                  </span>

                  {candidateAddress && (
                    <>
                      <span>•</span>
                      {repRecordId ? (
                        <a
                          href={getSuiscanObjectUrl(repRecordId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0D9488]/10 text-[#0D9488] dark:text-[#2DD4BF] border border-[#0D9488]/20 font-mono text-[11px] font-semibold hover:underline"
                          title={`View verified on-chain ReputationRecord on Sui Explorer (${repRecordId})`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-[#0D9488] dark:text-[#2DD4BF]" />
                          <span>On-Chain Rep: {formatSuiAddress(repRecordId)}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                        </a>
                      ) : (
                        <a
                          href={`https://suiscan.xyz/testnet/account/${candidateAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-foreground/70 border border-black/10 dark:border-white/10 font-mono text-[11px] hover:text-foreground hover:underline"
                          title={`View candidate Sui address on Explorer (${candidateAddress})`}
                        >
                          <Globe className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#4DA2FF]" />
                          <span>Sui: {formatSuiAddress(candidateAddress)}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Score Rings */}
            <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-black/10 dark:border-white/10 pt-4 sm:pt-0 sm:pl-6 shrink-0">
              <div className="text-center">
                <ScoreBadge score={profile.trustScore} type="trust" size="md" />
                <span className="text-[10px] text-foreground/50 font-mono block mt-1">Trust Score</span>
              </div>

              {fromTab === "recommended" && (
                <div className="text-center">
                  <ScoreBadge score={matchResult.matchScore} type="ai_match" size="md" />
                  <span className="text-[10px] text-[#7C3AED] dark:text-[#A78BFA] font-mono block mt-1">AI Match</span>
                </div>
              )}
            </div>
          </div>

          {/* Verified On-Chain Reputation Banner */}
          {repRecordId && onChainRep && (
            <div className="p-4 rounded-2xl border border-[#0D9488]/30 bg-[#0D9488]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0D9488]/20 text-[#0D9488] dark:text-[#2DD4BF] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                    Verified Sui On-Chain Reputation
                    <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-[#0D9488]/20 text-[#0D9488] dark:text-[#2DD4BF]">
                      Live on Testnet
                    </span>
                  </h4>
                  <p className="text-xs text-foreground/70 mt-0.5 font-mono">
                    Completed: <strong>{candidateCompletedCount}</strong> projects • Earned:{" "}
                    <strong>{candidateEarnedSui > 0 ? `${candidateEarnedSui.toLocaleString()} SUI` : (onChainRep.totalEarnedSui >= 1 ? `${onChainRep.totalEarnedSui.toFixed(1)} SUI` : "0 SUI")}</strong>
                    {onChainRep.ratingCount > 0 && ` • Rated: ★ ${onChainRep.avgRating.toFixed(1)} (${onChainRep.ratingCount})`}
                  </p>
                </div>
              </div>
              <a
                href={getSuiscanObjectUrl(repRecordId)}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D9488]/20 hover:bg-[#0D9488]/30 text-[#0D9488] dark:text-[#2DD4BF] border border-[#0D9488]/30 text-xs font-semibold transition-all font-mono"
              >
                <span>View Record on Suiscan</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Application Cover Note if arrived from Application */}
          {fromTab === "applications" && existingApplication?.coverNote && (
            <div className="p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] space-y-1.5">
              <span className="text-[11px] font-semibold text-[#2563EB] dark:text-[#4DA2FF] uppercase tracking-wider block">
                Freelancer's Application Cover Note
              </span>
              <p className="text-xs text-foreground/90 leading-relaxed italic">
                "{existingApplication.coverNote}"
              </p>
            </div>
          )}

          {/* AI Reasoning Callout */}
          {fromTab === "recommended" && (
            <div className="p-4 rounded-2xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#7C3AED] dark:text-[#A78BFA]">
                  <Sparkles className="w-4 h-4" />
                  <span>GONKA AI MATCH REASONING FOR THIS PROJECT</span>
                </div>
                <span className="text-[10px] font-mono text-[#7C3AED] dark:text-[#A78BFA]/80">ID: {matchResult.requestId}</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                {matchResult.reasoning}
              </p>
            </div>
          )}

          {/* Bio */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">About</h3>
            <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">{profile.bio}</p>
          </div>

          {/* Skills */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">Verified Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.map((s) => (
                <SkillChip
                  key={s}
                  label={s}
                  highlighted={project.requiredSkills.includes(s)}
                />
              ))}
            </div>
          </div>

          {/* Portfolio Links */}
          {profile.portfolioLinks.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-black/5 dark:border-white/5">
              <h3 className="text-xs font-semibold text-foreground/80 uppercase tracking-wider flex items-center justify-between">
                <span>Verified Portfolio Artifacts</span>
                {profile.isGithubVerified && (
                  <span className="text-[10px] text-[#0D9488] dark:text-[#2DD4BF] font-mono font-normal">
                    GitHub Profile Verified ✓ (@{profile.githubUsername || "alex-rivera-dev"})
                  </span>
                )}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {profile.portfolioLinks.map((link, idx) => {
                  const isVerifiedRepo = link.isVerified || link.url.includes("github.com");
                  return (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:border-black/20 dark:hover:border-white/20 transition-all text-xs group"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden mr-2">
                        {isVerifiedRepo ? (
                          <div className="p-1.5 rounded-lg bg-black/5 dark:bg-white/10 text-foreground dark:text-white shrink-0">
                            <Globe className="w-3.5 h-3.5 text-[#0D9488] dark:text-[#2DD4BF]" />
                          </div>
                        ) : (
                          <div className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 text-foreground/60 shrink-0">
                            <Globe className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#4DA2FF]" />
                          </div>
                        )}
                        <div className="truncate">
                          <span className="font-semibold text-foreground group-hover:text-[#2563EB] dark:group-hover:text-[#4DA2FF] transition-colors truncate block">
                            {link.title}
                          </span>
                          {isVerifiedRepo && (
                            <span className="text-[10px] text-[#0D9488] dark:text-[#2DD4BF] font-mono block">
                              GitHub Verified ✓ {link.primaryLanguage ? `• ${link.primaryLanguage}` : ""}
                            </span>
                          )}
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-foreground/40 group-hover:text-foreground transition-colors shrink-0" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ratings & Client Feedback */}
          {freelancerRatings.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-black/5 dark:border-white/5">
              <h3 className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                Client Reviews on TrustHire
              </h3>
              <div className="space-y-2">
                {freelancerRatings.map((r, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400 font-mono font-semibold">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < r.stars ? "fill-amber-500 dark:fill-amber-400 text-amber-500 dark:text-amber-400" : "text-black/20 dark:text-white/20"}`}
                          />
                        ))}
                        <span className="ml-1 text-foreground">{r.stars}.0</span>
                      </div>
                      <span className="text-[10px] text-foreground/40 font-mono">
                        {new Date(r.ratedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {r.comment && <p className="text-foreground/80 italic">"{r.comment}"</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contextual Action Bar */}
          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <GhostButton onClick={openMessage} icon={<MessageSquare className="w-4 h-4" />}>
              Message Freelancer
            </GhostButton>

            <div className="flex items-center gap-3">
              {fromTab === "applications" && existingApplication ? (
                existingApplication.status === "pending" ? (
                  <>
                    <GhostButton onClick={handleDeclineApplication} icon={<XCircle className="w-4 h-4" />}>
                      Decline
                    </GhostButton>
                    <GradientButton onClick={handleApproveApplication} icon={<CheckCircle2 className="w-4 h-4" />}>
                      Approve Application
                    </GradientButton>
                  </>
                ) : (
                  <StatusBadge status={existingApplication.status} />
                )
              ) : (
                existingInvitation ? (
                  <StatusBadge status={existingInvitation.status} />
                ) : (
                  <GradientButton onClick={handleInvite} icon={<Briefcase className="w-4 h-4" />}>
                    Invite to Project
                  </GradientButton>
                )
              )}
            </div>
          </div>
        </GlassCard>
      </div>

      <MessagingModalStub
        isOpen={messagingOpen}
        counterpartyName={messagingName}
        onClose={() => setMessagingOpen(false)}
      />
    </AppShell>
  );
}
