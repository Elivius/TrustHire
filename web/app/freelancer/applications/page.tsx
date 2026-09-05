"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileCheck2,
  Send,
  Bookmark,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Trash2
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { AppShell } from "@/components/layout/app-shell";
import { GradientButton } from "@/components/ui/gradient-button";
import { GhostButton } from "@/components/ui/ghost-button";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { clsx } from "clsx";

export default function FreelancerApplicationsPage() {
  const {
    currentUser,
    projects,
    users,
    invitations,
    applications,
    savedProjects,
    respondToInvitation,
    toggleSaveProject
  } = useApp();

  const [activeTab, setActiveTab] = useState<"applications" | "invitations" | "saved">("applications");

  const myApplications = applications.filter(
    (a) =>
      a.freelancerId === currentUser.id ||
      (currentUser.walletAddress &&
        a.freelancerId?.toLowerCase() === currentUser.walletAddress.toLowerCase()) ||
      a.freelancerId?.toLowerCase() === currentUser.id.toLowerCase()
  );
  const myInvitations = invitations.filter(
    (i) =>
      i.freelancerId === currentUser.id ||
      (currentUser.walletAddress &&
        i.freelancerId?.toLowerCase() === currentUser.walletAddress.toLowerCase()) ||
      i.freelancerId?.toLowerCase() === currentUser.id.toLowerCase()
  );
  const mySaved = savedProjects.filter(
    (s) =>
      s.freelancerId === currentUser.id ||
      (currentUser.walletAddress &&
        s.freelancerId?.toLowerCase() === currentUser.walletAddress.toLowerCase()) ||
      s.freelancerId?.toLowerCase() === currentUser.id.toLowerCase()
  );

  const pendingInvitationsCount = myInvitations.filter((i) => i.status === "pending").length;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Applications & Invitations
          </h1>
          <p className="text-xs sm:text-sm text-foreground/60 mt-1">
            Track outbound applications, respond to client invitations, and revisit bookmarked projects.
          </p>
        </div>

        {/* 3 Tabs */}
        <div className="flex items-center gap-2 border-b border-black/10 dark:border-white/10 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("applications")}
            className={clsx(
              "px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2",
              activeTab === "applications"
                ? "bg-[#4DA2FF]/20 text-[#2563EB] dark:text-[#4DA2FF] border border-[#4DA2FF]/40 shadow-sm"
                : "text-foreground/60 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Applications</span>
            <span className="font-mono text-xs px-1.5 py-0.2 rounded-full bg-black/5 dark:bg-white/10 text-foreground">
              {myApplications.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("invitations")}
            className={clsx(
              "px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2",
              activeTab === "invitations"
                ? "bg-[#7B61FF]/20 text-[#7C3AED] dark:text-[#A78BFA] border border-[#7B61FF]/40 shadow-sm"
                : "text-foreground/60 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            <Send className="w-4 h-4" />
            <span>Direct Invitations</span>
            {pendingInvitationsCount > 0 && (
              <span className="font-mono text-xs px-1.5 py-0.2 rounded-full bg-[#7B61FF] text-white">
                {pendingInvitationsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("saved")}
            className={clsx(
              "px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2",
              activeTab === "saved"
                ? "bg-[#2DD4BF]/20 text-[#0D9488] dark:text-[#2DD4BF] border border-[#2DD4BF]/40 shadow-sm"
                : "text-foreground/60 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            <Bookmark className="w-4 h-4" />
            <span>Saved Projects</span>
            <span className="font-mono text-xs px-1.5 py-0.2 rounded-full bg-black/5 dark:bg-white/10 text-foreground">
              {mySaved.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Applications */}
        {activeTab === "applications" && (
          <div className="space-y-4">
            {myApplications.length === 0 ? (
              <EmptyState
                icon={<FileCheck2 className="w-10 h-10 text-foreground/30" />}
                title="You haven't applied to anything yet"
                description="Browse recommended open projects and submit applications with your verified Trust Score."
                action={
                  <Link href="/freelancer/browse">
                    <GradientButton size="sm">Browse Projects</GradientButton>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {myApplications.map((app) => {
                  const proj = projects.find((p) => p.id === app.projectId);
                  const clientUser = proj ? users.find((u) => u.id === proj.clientId) : null;
                  if (!proj) return null;

                  return (
                    <GlassCard key={app.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <Link href={`/project/${proj.id}`}>
                            <h3 className="font-semibold text-base text-foreground hover:text-[#2563EB] dark:hover:text-[#4DA2FF] transition-colors">
                              {proj.title}
                            </h3>
                          </Link>
                          <StatusBadge status={app.status} />
                        </div>

                        <div className="flex items-center gap-3 text-xs text-foreground/50 font-mono">
                          <span className="text-[#0D9488] dark:text-[#2DD4BF] font-semibold">${proj.estimatedBudget.toLocaleString()} USDC</span>
                          <span>•</span>
                          <span>Client: {clientUser?.name || "Client"}</span>
                          <span>•</span>
                          <span>Applied {new Date(app.appliedAt).toLocaleDateString()}</span>
                        </div>

                        {app.coverNote && (
                          <p className="text-xs text-foreground/75 italic line-clamp-1 pt-1">
                            "{app.coverNote}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link href={`/project/${proj.id}`}>
                          <GhostButton size="sm">
                            <span>View Project</span>
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </GhostButton>
                        </Link>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Invitations */}
        {activeTab === "invitations" && (
          <div className="space-y-4">
            {myInvitations.length === 0 ? (
              <EmptyState
                icon={<Send className="w-10 h-10 text-foreground/30" />}
                title="No invitations right now"
                description="Clients can invite you directly once your profile is visible in the talent matching pool."
              />
            ) : (
              <div className="space-y-3">
                {myInvitations.map((inv) => {
                  const proj = projects.find((p) => p.id === inv.projectId);
                  const clientUser = proj ? users.find((u) => u.id === proj.clientId) : null;
                  if (!proj) return null;

                  return (
                    <GlassCard
                      key={inv.id}
                      className="p-5 sm:p-6 space-y-4 border-l-4 border-l-[#4DA2FF]"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          {clientUser && (
                            <img
                              src={clientUser.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                              alt={clientUser.name}
                              className="w-11 h-11 rounded-xl object-cover border border-black/10 dark:border-white/10"
                            />
                          )}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-base text-foreground">{proj.title}</h3>
                              <StatusBadge status={inv.status} />
                            </div>
                            <p className="text-xs text-foreground/70">
                              Invited by <strong>{clientUser?.name}</strong> • ${proj.estimatedBudget.toLocaleString()} USDC
                            </p>
                            <span className="text-[11px] font-mono text-foreground/45 block">
                              Invited {new Date(inv.invitedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Accept / Decline actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {inv.status === "pending" ? (
                            <>
                              <GhostButton
                                variant="danger"
                                size="sm"
                                onClick={() => respondToInvitation(inv.id, "declined")}
                              >
                                Decline
                              </GhostButton>
                              <GradientButton
                                size="sm"
                                onClick={() => respondToInvitation(inv.id, "accepted")}
                                icon={<CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                              >
                                Accept Invitation
                              </GradientButton>
                            </>
                          ) : (
                            <Link href={`/project/${proj.id}`}>
                              <GhostButton size="sm">Open Project</GhostButton>
                            </Link>
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Saved */}
        {activeTab === "saved" && (
          <div className="space-y-4">
            {mySaved.length === 0 ? (
              <EmptyState
                icon={<Bookmark className="w-10 h-10 text-foreground/30" />}
                title="Nothing saved yet"
                description="Bookmark a project from its detail page to find and review it here later."
                action={
                  <Link href="/freelancer/browse">
                    <GradientButton size="sm">Browse Projects</GradientButton>
                  </Link>
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mySaved.map((item) => {
                  const proj = projects.find((p) => p.id === item.projectId);
                  if (!proj) return null;

                  return (
                    <GlassCard key={item.projectId} className="p-5 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-sm sm:text-base text-foreground line-clamp-1">
                            {proj.title}
                          </h3>
                          <button
                            type="button"
                            onClick={() => toggleSaveProject(currentUser.id, proj.id)}
                            className="text-foreground/40 hover:text-red-500 dark:hover:text-red-400 p-1"
                            title="Remove bookmark"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-xs font-mono text-[#0D9488] dark:text-[#2DD4BF] font-semibold">
                          ${proj.estimatedBudget.toLocaleString()} USDC • {proj.timelineDays} days
                        </div>

                        <p className="text-xs text-foreground/70 line-clamp-2 leading-relaxed">
                          {proj.descriptionRaw}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                        <span className="text-[10px] text-foreground/45 font-mono">
                          Saved {new Date(item.savedAt).toLocaleDateString()}
                        </span>
                        <Link href={`/project/${proj.id}`}>
                          <GradientButton size="sm">View & Apply</GradientButton>
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
