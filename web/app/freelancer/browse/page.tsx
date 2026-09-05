"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Compass,
  Sparkles,
  Search,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { AppShell } from "@/components/layout/app-shell";
import { GradientButton } from "@/components/ui/gradient-button";
import { GhostButton } from "@/components/ui/ghost-button";
import { GlassCard } from "@/components/ui/glass-card";
import { ScoreBadge } from "@/components/ui/score-badge";
import { SkillChip } from "@/components/ui/skill-chip";
import { EmptyState } from "@/components/ui/empty-state";
import { clsx } from "clsx";

type ProjectMatchResult = {
  projectId: string;
  matchScore: number;
  reasoning: string;
  skillEvaluation: {
    skill: string;
    matched: boolean;
    evidence: string;
  }[];
  gonkaRequestId: string;
};

export default function BrowseProjectsPage() {
  const {
    currentUser,
    projects,
    users,
    freelancerProfiles,
    savedProjects,
    toggleSaveProject,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"recommended" | "all">(
    "recommended"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBudgetFilter, setSelectedBudgetFilter] =
    useState<string>("all");
  const [selectedSkillFilter, setSelectedSkillFilter] =
    useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "best_match" | "newest" | "budget"
  >("best_match");

  const [matchResults, setMatchResults] = useState<
    Record<string, ProjectMatchResult>
  >({});
  const [isMatching, setIsMatching] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);

  // Do not use mock/fallback freelancer data here.
  const myProfile = freelancerProfiles[currentUser.id];

  const openProjects = useMemo(
    () => projects.filter((p) => p.status === "open"),
    [projects]
  );

  /*
   * Run the real Gonka freelancer -> project matching.
   *
   * We deliberately use a stable key so a normal React/context re-render
   * does not repeatedly submit the same Gonka request.
   */
  const matchingKey = useMemo(() => {
    if (!myProfile) return "";

    return JSON.stringify({
      freelancerId: currentUser.id,
      skills: myProfile.skills,
      bio: myProfile.bio,
      experienceLevel: myProfile.experienceLevel,
      trustScore: myProfile.trustScore,
      projects: openProjects.map((project) => ({
        id: project.id,
        title: project.title,
        description: project.descriptionRaw,
        requiredSkills: project.requiredSkills,
        experienceLevel: project.experienceLevel,
        budget: project.estimatedBudget,
        timelineDays: project.timelineDays,
        deliverables: project.deliverables ?? [],
      })),
    });
  }, [currentUser.id, myProfile, openProjects]);

  useEffect(() => {
    if (activeTab !== "recommended" || !myProfile || openProjects.length === 0) {
      return;
    }

    let cancelled = false;

    const runMatching = async () => {
      setIsMatching(true);
      setMatchError(null);

      try {
        const response = await fetch("/api/gonka/match-projects", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            freelancer: {
              id: currentUser.id,
              name: currentUser.name,
              skills: myProfile.skills,
              bio: myProfile.bio,
              portfolioLinks: myProfile.portfolioLinks.map(
                (portfolio) => portfolio.url
              ),
              experienceLevel: myProfile.experienceLevel,
              trustScore: myProfile.trustScore,
            },
            projects: openProjects.map((project) => ({
              id: project.id,
              projectTitle: project.title,
              projectDescription: project.descriptionRaw,
              requiredSkills: project.requiredSkills,
              experienceLevel: project.experienceLevel,
              budget: {
                amount: project.estimatedBudget,
                currency: "USDC",
              },
              estimatedTimelineDays: project.timelineDays,
              keyDeliverables: project.deliverables ?? [],
            })),
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to get Gonka project recommendations."
          );
        }

        const nextResults: Record<string, ProjectMatchResult> = {};

        for (const result of data.results ?? []) {
          if (
            result &&
            typeof result.projectId === "string" &&
            typeof result.matchScore === "number"
          ) {
            nextResults[result.projectId] = result;
          }
        }

        if (!cancelled) {
          setMatchResults(nextResults);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("[Freelancer Project Matching]", error);
          setMatchError(
            error instanceof Error
              ? error.message
              : "Unable to load Gonka recommendations."
          );
          setMatchResults({});
        }
      } finally {
        if (!cancelled) {
          setIsMatching(false);
        }
      }
    };

    void runMatching();

    return () => {
      cancelled = true;
    };
  }, [
    activeTab,
    currentUser.id,
    currentUser.name,
    matchingKey,
    myProfile,
    openProjects,
  ]);

  // Filtering
  const filteredProjects = openProjects.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        p.title.toLowerCase().includes(q) ||
        p.descriptionRaw.toLowerCase().includes(q) ||
        p.requiredSkills.some((s) => s.toLowerCase().includes(q));

      if (!match) return false;
    }

    if (selectedBudgetFilter !== "all") {
      if (selectedBudgetFilter === "<500" && p.estimatedBudget >= 500) {
        return false;
      }
      if (
        selectedBudgetFilter === "500-2k" &&
        (p.estimatedBudget < 500 || p.estimatedBudget > 2000)
      ) {
        return false;
      }
      if (
        selectedBudgetFilter === "2k-10k" &&
        (p.estimatedBudget < 2000 || p.estimatedBudget > 10000)
      ) {
        return false;
      }
      if (selectedBudgetFilter === "10k+" && p.estimatedBudget < 10000) {
        return false;
      }
    }

    if (selectedSkillFilter !== "all") {
      if (
        !p.requiredSkills.some(
          (s) => s.toLowerCase() === selectedSkillFilter.toLowerCase()
        )
      ) {
        return false;
      }
    }

    return true;
  });

  // Recommended projects are sorted using the actual Gonka score.
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (activeTab === "recommended" && sortBy === "best_match") {
      const scoreA = matchResults[a.id]?.matchScore ?? -1;
      const scoreB = matchResults[b.id]?.matchScore ?? -1;
      return scoreB - scoreA;
    }

    if (sortBy === "budget") {
      return b.estimatedBudget - a.estimatedBudget;
    }

    return (
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedBudgetFilter("all");
    setSelectedSkillFilter("all");
    setSortBy(activeTab === "recommended" ? "best_match" : "newest");
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Browse Opportunities
          </h1>
          <p className="text-xs sm:text-sm text-foreground/60 mt-1">
            Explore open projects with guaranteed escrow deposits and verified
            scopes.
          </p>
        </div>

        {/* 2 Tabs: Recommended vs All Open */}
        <div className="flex items-center gap-2 border-b border-black/10 dark:border-white/10 pb-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab("recommended");
              setSortBy("best_match");
            }}
            className={clsx(
              "px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2",
              activeTab === "recommended"
                ? "bg-[#8B5CF6]/20 text-[#7C3AED] dark:text-[#A78BFA] border border-[#8B5CF6]/40 shadow-sm"
                : "text-foreground/60 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            <Sparkles className="w-4 h-4 text-[#7C3AED] dark:text-[#8B5CF6]" />
            <span>Recommended for You</span>
            <span className="font-mono text-xs px-1.5 py-0.2 rounded-full bg-black/5 dark:bg-white/10 text-foreground">
              {openProjects.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("all");
              if (sortBy === "best_match") setSortBy("newest");
            }}
            className={clsx(
              "px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2",
              activeTab === "all"
                ? "bg-black/10 dark:bg-white/15 text-foreground dark:text-white border border-black/15 dark:border-white/20 shadow-sm"
                : "text-foreground/60 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            <Compass className="w-4 h-4" />
            <span>All Open Projects</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-2xl border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-[#151622]/60 backdrop-blur-md space-y-3 shadow-sm dark:shadow-none">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-foreground/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search skills, titles, keywords..."
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] text-foreground focus:outline-none focus:border-[#7B61FF]"
              />
            </div>

            <div>
              <select
                value={selectedBudgetFilter}
                onChange={(e) => setSelectedBudgetFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] text-foreground focus:outline-none"
              >
                <option value="all" className="bg-white dark:bg-[#151622] text-foreground">All Budget Ranges</option>
                <option value="<500" className="bg-white dark:bg-[#151622] text-foreground">&lt; 500 SUI</option>
                <option value="500-2k" className="bg-white dark:bg-[#151622] text-foreground">500 – 2k SUI</option>
                <option value="2k-10k" className="bg-white dark:bg-[#151622] text-foreground">2k – 10k SUI</option>
                <option value="10k+" className="bg-white dark:bg-[#151622] text-foreground">10k+ SUI</option>
              </select>
            </div>

            <div>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as "best_match" | "newest" | "budget"
                  )
                }
                className="w-full px-3 py-2 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] text-foreground focus:outline-none"
              >
                {activeTab === "recommended" && (
                  <option value="best_match" className="bg-white dark:bg-[#151622] text-foreground">
                    Sort: Best AI Match
                  </option>
                )}
                <option value="newest" className="bg-white dark:bg-[#151622] text-foreground">
                  Sort: Newest First
                </option>
                <option value="budget" className="bg-white dark:bg-[#151622] text-foreground">
                  Sort: Highest Budget
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Matching status */}
        {activeTab === "recommended" && isMatching && (
          <div className="text-xs text-foreground/60 font-mono">
            Gonka is analyzing your profile against the open projects…
          </div>
        )}

        {activeTab === "recommended" && matchError && (
          <div className="text-xs text-red-500 dark:text-red-400 bg-red-500/5 border border-red-500/20 rounded-xl p-3">
            Gonka matching failed: {matchError}
          </div>
        )}

        {activeTab === "recommended" && !myProfile && (
          <EmptyState
            title="Complete your freelancer profile first"
            description="Gonka needs your real profile, skills, experience, and portfolio to recommend projects."
          />
        )}

        {sortedProjects.length === 0 ? (
          <EmptyState
            title="No open projects match these filters"
            description="Try widening your budget or skill filters to see more available project escrows."
            action={
              <GhostButton size="sm" onClick={clearFilters}>
                Clear Filters
              </GhostButton>
            }
          />
        ) : (
          <div className="space-y-4">
            {sortedProjects.map((project) => {
              const clientUser = users.find(
                (u) => u.id === project.clientId
              );

              const isSaved = savedProjects.some(
                (s) =>
                  s.freelancerId === currentUser.id &&
                  s.projectId === project.id
              );

              const matchResult = matchResults[project.id];

              return (
                <GlassCard
                  key={project.id}
                  className="p-5 sm:p-6 space-y-4 hover:border-black/20 dark:hover:border-white/20 transition-all group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <Link href={`/project/${project.id}`}>
                          <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-[#2563EB] dark:group-hover:text-[#4DA2FF] transition-colors">
                            {project.title}
                          </h3>
                        </Link>

                        {activeTab === "recommended" && matchResult && (
                          <ScoreBadge
                            score={matchResult.matchScore}
                            type="ai_match"
                            size="sm"
                          />
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-foreground/50 font-mono flex-wrap">
                        <span className="text-[#0D9488] dark:text-[#2DD4BF] font-semibold">
                          {project.estimatedBudget.toLocaleString()} SUI
                        </span>
                        <span>•</span>
                        <span>{project.timelineDays} days</span>
                        <span>•</span>
                        <span>
                          Client: {clientUser?.name || "Verified Client"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          toggleSaveProject(
                            currentUser.id,
                            project.id
                          )
                        }
                        className="p-2 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-foreground/75 hover:text-foreground transition-all cursor-pointer"
                        title={isSaved ? "Saved" : "Save for later"}
                      >
                        {isSaved ? (
                          <BookmarkCheck className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF]" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>

                      <Link href={`/project/${project.id}`}>
                        <GradientButton
                          size="sm"
                          icon={
                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          }
                        >
                          View Details
                        </GradientButton>
                      </Link>
                    </div>
                  </div>

                  <p className="text-xs text-foreground/75 line-clamp-2 leading-relaxed">
                    {project.descriptionRaw}
                  </p>

                  {activeTab === "recommended" && matchResult && (
                    <p className="text-xs text-foreground/70 bg-[#8B5CF6]/[0.06] p-2.5 rounded-xl border border-[#8B5CF6]/20 font-mono">
                      <span className="text-[#A78BFA] font-semibold mr-1.5">
                        Gonka Match:
                      </span>
                      {matchResult.reasoning}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {project.requiredSkills.map((s) => (
                      <SkillChip
                        key={s}
                        label={s}
                        size="sm"
                        highlighted={myProfile?.skills.includes(s) ?? false}
                      />
                    ))}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
