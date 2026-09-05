"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Calendar,
  DollarSign,
  Users,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowLeft,
  MessageSquare,
  Send
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { AppShell } from "@/components/layout/app-shell";
import { GradientButton } from "@/components/ui/gradient-button";
import { GhostButton } from "@/components/ui/ghost-button";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ScoreBadge } from "@/components/ui/score-badge";
import {
  useSearchParams,
} from "next/navigation";
import { SkillChip } from "@/components/ui/skill-chip";
import { AIReasoningCallout } from "@/components/ui/ai-reasoning-callout";
import { MilestoneStepper } from "@/components/ui/milestone-stepper";
import { MessagingModalStub } from "@/components/layout/messaging-modal-stub";
import { computeFreelancerMatchForProject } from "@/lib/simulation";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.id as string;

  const {
    currentUser,
    activeRole,
    projects,
    milestones,
    users,
    freelancerProfiles,
    invitations,
    applications,
    savedProjects,
    toggleSaveProject,
    applyToProject
  } = useApp();

  /*
   * GitHub OAuth callback handling
   *
   * The GitHub OAuth callback redirects back to this
   * workspace with:
   *
   * ?github=connected
   * &sessionId=...
   * &username=...
   *
   * Save the session ID locally so the milestone
   * submission modal can use the real GitHub session.
   */
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const params = new URLSearchParams(
        window.location.search,
      );

      const githubStatus =
        params.get("github");

      const sessionId =
        params.get("sessionId");

      const username =
        params.get("username");

      console.log(
        "[Workspace GitHub] OAuth callback:",
        {
          githubStatus,
          sessionId,
          username,
        },
      );

      /*
       * Nothing to do if this is a normal
       * workspace visit.
       */
      if (
        githubStatus !== "connected" ||
        !sessionId
      ) {
        return;
      }

      /*
       * Store the GitHub session returned by
       * the backend OAuth callback.
       */
      sessionStorage.setItem(
        "trusthire_github_session",
        sessionId,
      );

      /*
       * Store the GitHub username as well.
       * This is useful for displaying the
       * connected GitHub account.
       */
      if (username) {
        sessionStorage.setItem(
          "trusthire_github_username",
          username,
        );
      }

      console.log(
        "[Workspace GitHub] Session saved:",
        sessionStorage.getItem(
          "trusthire_github_session",
        ),
      );

      /*
       * Remove OAuth parameters from the URL
       * after the session has been saved.
       *
       * Keep the current workspace path.
       */
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname,
      );
    } catch (error) {
      console.error(
        "[Workspace GitHub] Failed to process OAuth callback:",
        error,
      );
    }
  }, []);

  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [coverNote, setCoverNote] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);

  const project = projects.find((p) => p.id === projectId);
  const projMilestones = milestones.filter((m) => m.projectId === projectId);

  if (!project) {
    return (
      <AppShell>
        <div className="text-center py-20 space-y-4">
          <p className="text-foreground/60">Project not found.</p>
          <Link href={activeRole === "client" ? "/client/projects" : "/freelancer/browse"}>
            <GhostButton>Return to Dashboard</GhostButton>
          </Link>
        </div>
      </AppShell>
    );
  }

  const isClientOwner =
    currentUser.id === project.clientId ||
    (Boolean(currentUser.walletAddress) &&
      Boolean(project.clientId) &&
      project.clientId.toLowerCase() === currentUser.walletAddress?.toLowerCase());
  const isFreelancerRole = activeRole === "freelancer";
  const matchedFreelancer = project.matchedFreelancerId
    ? users.find(
        (u) =>
          u.id === project.matchedFreelancerId ||
          (u.walletAddress &&
            u.walletAddress.toLowerCase() === project.matchedFreelancerId?.toLowerCase())
      )
    : null;

  const isSaved = savedProjects.some(
    (s) =>
      s.projectId === projectId &&
      (s.freelancerId === currentUser.id ||
        (currentUser.walletAddress &&
          s.freelancerId.toLowerCase() === currentUser.walletAddress.toLowerCase()))
  );
  const myApplication = applications.find(
    (a) =>
      a.projectId === projectId &&
      (a.freelancerId === currentUser.id ||
        (currentUser.walletAddress &&
          a.freelancerId.toLowerCase() === currentUser.walletAddress.toLowerCase()))
  );
  const myProfile =
    freelancerProfiles[currentUser.id] ||
    (currentUser.walletAddress ? freelancerProfiles[currentUser.walletAddress] : undefined);
  const aiMatch = myProfile
    ? computeFreelancerMatchForProject(myProfile.skills, project.requiredSkills, myProfile.trustScore)
    : null;

  const candidateCount = new Set([
    ...invitations.filter((i) => i.projectId === projectId).map((i) => i.freelancerId.toLowerCase()),
    ...applications.filter((a) => a.projectId === projectId).map((a) => a.freelancerId.toLowerCase())
  ]).size;

  const handleApply = async () => {
    setIsApplying(true);
    const applicantId = currentUser.walletAddress || currentUser.id;
    await applyToProject(projectId, applicantId, coverNote);
    setIsApplying(false);
    setAppliedSuccess(true);
    setTimeout(() => {
      setApplyModalOpen(false);
      setAppliedSuccess(false);
    }, 1500);
  };

  

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <Link
            href={isClientOwner ? "/client/projects" : "/freelancer/browse"}
            className="inline-flex items-center gap-1.5 text-xs text-foreground/60 hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to {isClientOwner ? "My Projects" : "Browse Projects"}</span>
          </Link>
        </div>

        {isClientOwner && project.status === "matched" && matchedFreelancer && (
          <div className="rounded-2xl border border-[#2DD4BF]/40 bg-[#2DD4BF]/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#2DD4BF]/20 text-[#0D9488] dark:text-[#2DD4BF] shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm sm:text-base text-foreground">
                  You've matched with {matchedFreelancer.name}!
                </h4>
                <p className="text-xs text-foreground/75">
                  Finalize your milestone plan and lock funds in Sui smart escrow to begin active work.
                </p>
              </div>
            </div>

            <Link href={`/project/${project.id}/fund`}>
              <GradientButton size="md" icon={<Lock className="w-4 h-4 ml-1" />}>
                Continue to Escrow
              </GradientButton>
            </Link>
          </div>
        )}

        <GlassCard className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  {project.title}
                </h1>
                <StatusBadge status={project.status} />
              </div>
              <div className="flex items-center gap-4 text-xs font-mono text-foreground/60 flex-wrap">
                <span className="text-[#0D9488] dark:text-[#2DD4BF] font-semibold text-sm">
                  {project.estimatedBudget.toLocaleString()} SUI
                </span>
                <span>•</span>
                <span>{project.timelineDays} days duration</span>
                <span>•</span>
                <span>Posted {new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isFreelancerRole && (
                <button
                  type="button"
                  onClick={() => toggleSaveProject(currentUser.id, projectId)}
                  className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-foreground/75 hover:text-foreground transition-all cursor-pointer"
                  title={isSaved ? "Saved" : "Save for later"}
                >
                  {isSaved ? (
                    <BookmarkCheck className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF]" />
                  ) : (
                    <Bookmark className="w-4 h-4" />
                  )}
                </button>
              )}

              {isClientOwner && (
                <Link href={`/project/${project.id}/candidates`}>
                  <GradientButton size="sm" icon={<Users className="w-4 h-4" />}>
                    Candidates Pool ({candidateCount})
                  </GradientButton>
                </Link>
              )}
            </div>
          </div>

          {isFreelancerRole && aiMatch && (
            <AIReasoningCallout
              reasoning={aiMatch.reasoning}
              requestId={aiMatch.requestId}
              confidence="High"
            />
          )}

          <div className="space-y-2 pt-2 border-t border-black/5 dark:border-white/5">
            <h3 className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
              Project Description
            </h3>
            <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
              {project.descriptionRaw}
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
              Required Skills & Technologies
            </h3>
            <div className="flex flex-wrap gap-2">
              {project.requiredSkills.map((s) => (
                <SkillChip
                  key={s}
                  label={s}
                  highlighted={isFreelancerRole && myProfile?.skills.includes(s)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-black/10 dark:border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">Escrow Milestone Plan</h3>
                <p className="text-xs text-foreground/60">
                  Deliverables and budget allocations agreed for this contract.
                </p>
              </div>
              <span className="text-xs font-mono text-foreground/50">
                {projMilestones.length} Milestones
              </span>
            </div>

            <MilestoneStepper milestones={projMilestones} />
          </div>

          {isFreelancerRole && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                <GhostButton size="sm" onClick={() => setMessageModalOpen(true)}>
                  <MessageSquare className="w-3.5 h-3.5 mr-1" />
                  <span>Message Client</span>
                </GhostButton>
              </div>

              <div>
                {myApplication ? (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs font-medium text-foreground/80">
                    <CheckCircle2 className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF]" />
                    <span>Applied — Pending Client Review</span>
                  </div>
                ) : (
                  <GradientButton
                    size="lg"
                    onClick={() => setApplyModalOpen(true)}
                    icon={<Send className="w-4 h-4 ml-1" />}
                  >
                    Apply to This Project
                  </GradientButton>
                )}
              </div>
            </div>
          )}
        </GlassCard>

        {applyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setApplyModalOpen(false)}
            />
            <div className="relative w-full max-w-lg rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#151622] p-6 sm:p-8 shadow-2xl space-y-5 transition-colors">
              <div>
                <h3 className="text-xl font-bold text-foreground">Apply to {project.title}</h3>
                <p className="text-xs text-foreground/60 mt-1">
                  Your Trust Score ({myProfile?.trustScore || 90}/100) and verified portfolio will be attached automatically.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground/80">
                  Optional Cover Note to Client
                </label>
                <textarea
                  rows={4}
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder="Explain why you're a great fit, highlight similar projects you've shipped on Sui..."
                  className="w-full p-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] text-xs text-foreground focus:outline-none focus:border-[#7B61FF] resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <GhostButton onClick={() => setApplyModalOpen(false)}>Cancel</GhostButton>
                <GradientButton
                  loading={isApplying}
                  onClick={handleApply}
                  icon={<Send className="w-4 h-4 ml-1" />}
                >
                  {appliedSuccess ? "Application Sent ✓" : "Confirm Application"}
                </GradientButton>
              </div>
            </div>
          </div>
        )}

        <MessagingModalStub
          isOpen={messageModalOpen}
          onClose={() => setMessageModalOpen(false)}
          counterpartyName="Client"
        />
      </div>
    </AppShell>
  );
}
