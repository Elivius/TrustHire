"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  ShieldCheck,
  ExternalLink,
  ArrowLeft,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Star,
  Send,
  Globe,
  Briefcase
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { AppShell } from "@/components/layout/app-shell";
import { GradientButton } from "@/components/ui/gradient-button";
import { GhostButton } from "@/components/ui/ghost-button";
import { GlassCard } from "@/components/ui/glass-card";
import { ScoreBadge } from "@/components/ui/score-badge";
import { SkillChip } from "@/components/ui/skill-chip";
import { StatusBadge } from "@/components/ui/status-badge";
import { AIReasoningCallout } from "@/components/ui/ai-reasoning-callout";
import { MessagingModalStub } from "@/components/layout/messaging-modal-stub";
import { computeFreelancerMatchForProject } from "@/lib/simulation";

export default function CandidateProfilePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const projectId = params.id as string;
  const freelancerId = params.freelancerId as string;
  const source = searchParams.get("source"); // "recommended" | "applications"
  const appId = searchParams.get("appId");

  const {
    projects,
    users,
    freelancerProfiles,
    invitations,
    applications,
    inviteFreelancer,
    respondToApplication,
    ratings
  } = useApp();

  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const project = projects.find((p) => p.id === projectId);
  const freelancerUser = users.find((u) => u.id === freelancerId);
  const profile = freelancerProfiles[freelancerId];

  if (!project || !freelancerUser || !profile) {
    return (
      <AppShell>
        <div className="text-center py-20">Profile not found.</div>
      </AppShell>
    );
  }

  const existingInvitation = invitations.find(
    (i) => i.projectId === projectId && i.freelancerId === freelancerId
  );
  const existingApplication = applications.find(
    (a) => a.projectId === projectId && a.freelancerId === freelancerId
  );

  const isMatchedToThis = project.matchedFreelancerId === freelancerId;
  const isAiMatched = source === "recommended" || !source;

  const matchData = isAiMatched
    ? computeFreelancerMatchForProject(profile.skills, project.requiredSkills, profile.trustScore)
    : null;

  const freelancerRatings = ratings.filter((r) => r.freelancerId === freelancerId);

  const handleInvite = () => {
    inviteFreelancer(projectId, freelancerId);
  };

  const handleApproveApplication = async () => {
    if (!existingApplication) return;
    setActionLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    respondToApplication(existingApplication.id, "accepted");
    router.push(`/project/${projectId}`);
  };

  const handleDeclineApplication = async () => {
    if (!existingApplication) return;
    setActionLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    respondToApplication(existingApplication.id, "declined");
    router.push(`/project/${projectId}/candidates`);
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Link */}
        <div>
          <Link
            href={`/project/${projectId}/candidates`}
            className="inline-flex items-center gap-1.5 text-xs text-foreground/60 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Candidates Pool</span>
          </Link>
        </div>

        {/* Profile Card */}
        <GlassCard className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <img
                src={freelancerUser.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"}
                alt={freelancerUser.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl object-cover border border-white/10 shadow-lg"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-white">
                    {freelancerUser.name}
                  </h1>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 font-mono text-foreground/70">
                    {profile.experienceLevel}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-foreground/70">{profile.headline}</p>

                {/* Score Badges */}
                <div className="flex items-center gap-2.5 pt-2">
                  <ScoreBadge score={profile.trustScore} type="trust" size="md" />
                  {isAiMatched && matchData && (
                    <ScoreBadge score={matchData.matchScore} type="ai_match" size="md" />
                  )}
                </div>
              </div>
            </div>

            {/* Wallet address chip */}
            {freelancerUser.walletAddress && (
              <div className="text-[11px] font-mono text-foreground/45 bg-black/20 px-3 py-1.5 rounded-xl border border-white/5 self-start">
                Sui Address: {freelancerUser.walletAddress}
              </div>
            )}
          </div>

          {/* If from application: Cover Note */}
          {existingApplication?.coverNote && (
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5">
              <span className="text-xs font-semibold text-foreground/70 uppercase tracking-wider block">
                Applicant's Cover Note
              </span>
              <p className="text-xs sm:text-sm text-white italic leading-relaxed">
                "{existingApplication.coverNote}"
              </p>
              <span className="text-[10px] text-foreground/40 font-mono block pt-1">
                Submitted {new Date(existingApplication.appliedAt).toLocaleString()}
              </span>
            </div>
          )}

          {/* AI Reasoning Callout (Only if AI-matched) */}
          {isAiMatched && matchData && (
            <AIReasoningCallout
              reasoning={matchData.reasoning}
              requestId={matchData.requestId}
              confidence={profile.trustScoreConfidence}
            />
          )}

          {/* Bio */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <h3 className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
              About Freelancer
            </h3>
            <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
              {profile.bio}
            </p>
          </div>

          {/* Skills */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
              Verified Skills & Core Tech
            </h3>
            <div className="flex flex-wrap gap-2">
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
            <div className="space-y-3 pt-2 border-t border-white/5">
              <h3 className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                Verified Portfolio Artifacts
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {profile.portfolioLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 transition-all text-xs group"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[#4DA2FF]" />
                      <span className="font-semibold text-white group-hover:text-[#4DA2FF] transition-colors">
                        {link.title}
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-foreground/40 group-hover:text-white transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Past Projects & Reputation */}
          <div className="space-y-3 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                On-Chain Track Record on TrustHire
              </h3>
              <div className="flex items-center gap-3 text-xs font-mono text-foreground/60">
                <span>{profile.completedProjectsCount} completed</span>
                <span>•</span>
                <span className="text-[#2DD4BF]">{profile.onTimeDeliveryPct}% on-time</span>
              </div>
            </div>

            <div className="space-y-2">
              {freelancerRatings.length > 0 ? (
                freelancerRatings.map((r, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02] space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[#2DD4BF]">
                        {[...Array(r.stars)].map((_, s) => (
                          <Star key={s} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                      <span className="font-mono text-[11px] text-foreground/40">
                        {new Date(r.ratedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {r.comment && <p className="text-foreground/80 italic">"{r.comment}"</p>}
                  </div>
                ))
              ) : (
                <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] text-xs text-foreground/50 text-center">
                  Verified milestone delivery records secured on Sui.
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-white/10">
            <div className="flex items-center gap-2">
              <GhostButton size="sm" onClick={() => setMessageModalOpen(true)}>
                <MessageSquare className="w-3.5 h-3.5 mr-1" />
                <span>Message</span>
              </GhostButton>
            </div>

            <div className="flex items-center gap-3">
              {existingApplication ? (
                <>
                  <GhostButton
                    variant="danger"
                    size="md"
                    disabled={actionLoading}
                    onClick={handleDeclineApplication}
                  >
                    Decline
                  </GhostButton>
                  <GradientButton
                    size="md"
                    loading={actionLoading}
                    onClick={handleApproveApplication}
                    icon={<CheckCircle2 className="w-4 h-4 ml-1" />}
                  >
                    Approve Application & Match
                  </GradientButton>
                </>
              ) : existingInvitation ? (
                <div className="flex items-center gap-2">
                  <StatusBadge status={`Invitation: ${existingInvitation.status}`} />
                </div>
              ) : project.status === "open" ? (
                <GradientButton
                  size="md"
                  onClick={handleInvite}
                  icon={<Send className="w-4 h-4 ml-1" />}
                >
                  Invite to Project
                </GradientButton>
              ) : isMatchedToThis ? (
                <Link href={`/project/${projectId}/fund`}>
                  <GradientButton size="md">Continue to Escrow Funding</GradientButton>
                </Link>
              ) : null}
            </div>
          </div>
        </GlassCard>

        <MessagingModalStub
          isOpen={messageModalOpen}
          onClose={() => setMessageModalOpen(false)}
          counterpartyName={freelancerUser.name}
        />
      </div>
    </AppShell>
  );
}
