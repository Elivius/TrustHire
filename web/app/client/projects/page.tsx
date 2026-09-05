"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  PlusCircle,
  Clock,
  ArrowRight,
  User,
  Users,
  Coins,
  Search
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { AppShell } from "@/components/layout/app-shell";
import { GradientButton } from "@/components/ui/gradient-button";
import { GhostButton } from "@/components/ui/ghost-button";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectStatus } from "@/types";
import { clsx } from "clsx";

const STATUS_TABS = [
  {
    key: "all" as const,
    label: "All",
    active:
      "border-[#7C3AED]/40 bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#A78BFA] shadow-sm",
    inactive:
      "text-foreground/70 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 border-black/10 dark:border-white/10",
    badgeActive: "bg-[#7C3AED]/20 text-[#7C3AED] dark:text-[#A78BFA]",
    badgeInactive: "bg-black/5 dark:bg-white/10 text-foreground/60",
  },
  {
    key: "draft" as const,
    label: "Drafts",
    active:
      "border-zinc-400/40 bg-zinc-500/15 text-zinc-800 dark:text-zinc-200 shadow-sm",
    inactive:
      "text-foreground/70 hover:text-foreground hover:bg-zinc-500/10 border-black/10 dark:border-white/10",
    badgeActive: "bg-zinc-500/20 text-zinc-800 dark:text-zinc-200",
    badgeInactive: "bg-black/5 dark:bg-white/10 text-foreground/60",
  },
  {
    key: "open" as const,
    label: "Open",
    active:
      "border-blue-500/40 bg-blue-500/15 text-blue-700 dark:text-[#4DA2FF] shadow-sm",
    inactive:
      "text-foreground/70 hover:text-blue-600 dark:hover:text-[#4DA2FF] hover:bg-blue-500/10 border-black/10 dark:border-white/10",
    badgeActive: "bg-blue-500/20 text-blue-700 dark:text-[#4DA2FF]",
    badgeInactive: "bg-black/5 dark:bg-white/10 text-foreground/60",
  },
  {
    key: "matched" as const,
    label: "Matched",
    active:
      "border-purple-500/40 bg-purple-500/15 text-purple-700 dark:text-[#A78BFA] shadow-sm",
    inactive:
      "text-foreground/70 hover:text-purple-600 dark:hover:text-[#A78BFA] hover:bg-purple-500/10 border-black/10 dark:border-white/10",
    badgeActive: "bg-purple-500/20 text-purple-700 dark:text-[#A78BFA]",
    badgeInactive: "bg-black/5 dark:bg-white/10 text-foreground/60",
  },
  {
    key: "in_progress" as const,
    label: "In Progress",
    active:
      "border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-[#F59E0B] shadow-sm",
    inactive:
      "text-foreground/70 hover:text-amber-600 dark:hover:text-[#F59E0B] hover:bg-amber-500/10 border-black/10 dark:border-white/10",
    badgeActive: "bg-amber-500/20 text-amber-700 dark:text-[#F59E0B]",
    badgeInactive: "bg-black/5 dark:bg-white/10 text-foreground/60",
  },
  {
    key: "completed" as const,
    label: "Completed",
    active:
      "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-[#10B981] shadow-sm",
    inactive:
      "text-foreground/70 hover:text-emerald-600 dark:hover:text-[#10B981] hover:bg-emerald-500/10 border-black/10 dark:border-white/10",
    badgeActive: "bg-emerald-500/20 text-emerald-700 dark:text-[#10B981]",
    badgeInactive: "bg-black/5 dark:bg-white/10 text-foreground/60",
  },
];

export default function ClientProjectsPage() {
  const router = useRouter();
  const { currentUser, projects, users, invitations, applications } = useApp();
  const [selectedFilter, setSelectedFilter] = useState<"all" | ProjectStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const clientProjects = projects.filter(
    (p) =>
      Boolean(p.clientId) &&
      (p.clientId === currentUser.id ||
        p.clientId.toLowerCase() === currentUser.id.toLowerCase() ||
        (currentUser.walletAddress &&
          p.clientId.toLowerCase() === currentUser.walletAddress.toLowerCase()))
  );

  const filteredProjects = clientProjects.filter((p) => {
    if (selectedFilter !== "all" && p.status !== selectedFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.descriptionRaw.toLowerCase().includes(q) ||
        p.requiredSkills.some((s) => s.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getCandidateCount = (projectId: string) => {
    const invCount = invitations.filter((i) => i.projectId === projectId).length;
    const appCount = applications.filter((a) => a.projectId === projectId).length;
    return invCount + appCount;
  };

  const handleRowClick = (project: typeof clientProjects[0]) => {
    if (project.status === "draft") {
      router.push(`/client/projects/new?draftId=${project.id}`);
    } else if (project.status === "open") {
      router.push(`/project/${project.id}/candidates`);
    } else if (project.status === "matched") {
      router.push(`/project/${project.id}/fund`);
    } else {
      router.push(`/project/${project.id}/workspace`);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              My Projects
            </h1>
            <p className="text-xs sm:text-sm text-foreground/60 mt-1">
              Manage your drafts, active recruitments, and on-chain escrow contracts.
            </p>
          </div>

          <Link href="/client/projects/new">
            <GradientButton size="md" icon={<PlusCircle className="w-4 h-4" />}>
              New Project
            </GradientButton>
          </Link>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {STATUS_TABS.map((tab) => {
              const count =
                tab.key === "all"
                  ? clientProjects.length
                  : clientProjects.filter((p) => p.status === tab.key).length;

              const isSelected = selectedFilter === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedFilter(tab.key)}
                  className={clsx(
                    "px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 border",
                    isSelected ? tab.active : tab.inactive
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={clsx(
                      "text-[10px] font-mono px-1.5 py-0.5 rounded-full transition-colors",
                      isSelected ? tab.badgeActive : tab.badgeInactive
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-foreground/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] text-foreground focus:outline-none focus:border-[#4DA2FF]"
            />
          </div>
        </div>

        {/* Projects List */}
        {filteredProjects.length === 0 ? (
          <EmptyState
            title={selectedFilter === "all" ? "You haven't posted any projects yet" : `No projects matching "${selectedFilter}"`}
            description={
              selectedFilter === "all"
                ? "Use the AI Hiring Assistant to generate a structured project plan and start matching talent."
                : "Try selecting a different filter or search query."
            }
            action={
              selectedFilter === "all" ? (
                <Link href="/client/projects/new">
                  <GradientButton size="sm">Create First Project</GradientButton>
                </Link>
              ) : (
                <GhostButton size="sm" onClick={() => setSelectedFilter("all")}>
                  View All Projects
                </GhostButton>
              )
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredProjects.map((project) => {
              const matchId = project.matchedFreelancerId;
              const freelancer = matchId
                ? users.find(
                    (u) =>
                      u.id === matchId ||
                      u.id.toLowerCase() === matchId.toLowerCase() ||
                      (u.walletAddress && u.walletAddress.toLowerCase() === matchId.toLowerCase())
                  )
                : null;
              const candCount = getCandidateCount(project.id);

              return (
                <div
                  key={project.id}
                  onClick={() => handleRowClick(project)}
                  className="p-4 sm:p-5 rounded-2xl border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-[#151622]/80 hover:bg-white dark:hover:bg-[#151622] hover:border-[#4DA2FF]/40 cursor-pointer transition-all duration-200 backdrop-blur-md group shadow-sm dark:shadow-none"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-base font-semibold text-foreground group-hover:text-[#2563EB] dark:group-hover:text-[#4DA2FF] transition-colors">
                          {project.title}
                        </h3>
                        <StatusBadge status={project.status} />
                      </div>

                      <p className="text-xs text-foreground/60 line-clamp-1">
                        {project.descriptionRaw}
                      </p>

                      <div className="flex items-center gap-4 text-xs font-mono text-foreground/50 pt-1 flex-wrap">
                        <span className="text-foreground font-semibold">
                          {project.estimatedBudget.toLocaleString()} <span className="text-[10px] text-foreground/50 font-normal">SUI</span>
                        </span>
                        <span>•</span>
                        <span>{project.timelineDays} days</span>
                        <span>•</span>
                        {project.status === "open" ? (
                          <span className="text-[#A78BFA] font-sans flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            <span>{candCount} candidates active</span>
                          </span>
                        ) : freelancer ? (
                          <span className="text-[#2DD4BF] font-sans flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            <span>Matched with {freelancer.name}</span>
                          </span>
                        ) : (
                          <span className="text-foreground/40 font-sans">
                            Edited {new Date(project.updatedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <GhostButton size="sm">
                        <span>
                          {project.status === "draft"
                            ? "Resume Draft"
                            : project.status === "open" || project.status === "matched"
                            ? "Manage Candidates"
                            : "Open Workspace"}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </GhostButton>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
