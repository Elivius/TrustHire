"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  RotateCcw,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Cpu,
  AlertCircle,
  CheckCircle2,
  Lock
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { AppShell } from "@/components/layout/app-shell";
import { GradientButton } from "@/components/ui/gradient-button";
import { GhostButton } from "@/components/ui/ghost-button";
import { GlassCard } from "@/components/ui/glass-card";
import { SkillChip } from "@/components/ui/skill-chip";
import { simulateGonkaParse, generateGonkaRequestId } from "@/lib/simulation";
import { Milestone } from "@/types";
import { clsx } from "clsx";

interface MilestoneRow {
  title: string;
  deliverable: string;
  percentOfBudget: number;
  amount: number;
  deadlineDays: number;
}

export default function PostProjectPage() {
  const router = useRouter();
  const { createProject, simulatedFailuresEnabled } = useApp();

  const [stage, setStage] = useState<1 | 2>(1);
  const [descriptionInput, setDescriptionInput] = useState(
    "We need a senior Sui Move developer to build a smart escrow contract and a TypeScript SDK. Estimated budget is $4,500 USDC for 3 weeks of work."
  );
  const [loading, setLoading] = useState(false);
  const [parseError, setParseError] = useState("");
  const [gonkaRequestId, setGonkaRequestId] = useState("");

  // Stage 2 Form Fields
  const [title, setTitle] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [estimatedBudget, setEstimatedBudget] = useState(4500);
  const [timelineDays, setTimelineDays] = useState(21);
  const [milestones, setMilestones] = useState<MilestoneRow[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);

  const handleGenerateAI = async () => {
    if (!descriptionInput.trim()) return;
    setLoading(true);
    setParseError("");

    try {
      const result = await simulateGonkaParse(
        descriptionInput,
        simulatedFailuresEnabled && Math.random() < 0.1
      );

      setTitle(result.title);
      setRequiredSkills(result.requiredSkills);
      setEstimatedBudget(result.estimatedBudget);
      setTimelineDays(result.timelineDays);
      setMilestones(result.suggestedMilestones);
      setGonkaRequestId(result.gonkaRequestId);
      setStage(2);
    } catch (err: any) {
      setParseError(err.message || "Couldn't generate a structured plan right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkipToManual = () => {
    setTitle("Custom Web3 Milestone Project");
    setRequiredSkills(["React", "TypeScript", "Tailwind CSS"]);
    setEstimatedBudget(3000);
    setTimelineDays(14);
    setMilestones([
      {
        title: "Milestone 1: Setup & Architecture",
        deliverable: "Initial project setup and wireframe architecture.",
        percentOfBudget: 50,
        amount: 1500,
        deadlineDays: 7
      },
      {
        title: "Milestone 2: Final Delivery & Hand-off",
        deliverable: "Full code delivery and documentation.",
        percentOfBudget: 50,
        amount: 1500,
        deadlineDays: 14
      }
    ]);
    setGonkaRequestId(generateGonkaRequestId());
    setStage(2);
  };

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newSkillInput.trim()) {
      e.preventDefault();
      if (!requiredSkills.includes(newSkillInput.trim())) {
        setRequiredSkills([...requiredSkills, newSkillInput.trim()]);
      }
      setNewSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setRequiredSkills(requiredSkills.filter((s) => s !== skill));
  };

  const handleMilestoneChange = (index: number, field: keyof MilestoneRow, value: any) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-recalculate amounts if budget or percent changes
    if (field === "percentOfBudget") {
      updated[index].amount = Math.round((estimatedBudget * Number(value)) / 100);
    }
    setMilestones(updated);
  };

  const handleAddMilestone = () => {
    const allocated = milestones.reduce((sum, m) => sum + m.percentOfBudget, 0);
    const remaining = Math.max(0, 100 - allocated);
    const newMs: MilestoneRow = {
      title: `Milestone ${milestones.length + 1}: Next Phase`,
      deliverable: "Implementation of subsequent milestone deliverables.",
      percentOfBudget: remaining,
      amount: Math.round((estimatedBudget * remaining) / 100),
      deadlineDays: timelineDays
    };
    setMilestones([...milestones, newMs]);
  };

  const handleRemoveMilestone = (index: number) => {
    if (milestones.length <= 1) return;
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  // Compute total percentage
  const totalPercentage = milestones.reduce((sum, m) => sum + Number(m.percentOfBudget || 0), 0);
  const isBudgetValid = Math.abs(totalPercentage - 100) < 0.01;

  const handleSaveDraftOrPost = async (isDraft: boolean) => {
    if (!isDraft && !isBudgetValid) return;

    setIsPosting(true);

    const now = new Date();
    const milestonePayload: Omit<Milestone, "id" | "projectId">[] = milestones.map((m) => {
      const deadlineDate = new Date(now.getTime() + m.deadlineDays * 24 * 60 * 60 * 1000);
      return {
        title: m.title,
        deliverable: m.deliverable,
        amount: Math.round((estimatedBudget * m.percentOfBudget) / 100),
        percentOfBudget: m.percentOfBudget,
        deadline: deadlineDate.toISOString(),
        status: "pending"
      };
    });

    const newProjId = createProject(
      {
        title,
        descriptionRaw: descriptionInput,
        requiredSkills,
        estimatedBudget,
        timelineDays,
        status: isDraft ? "draft" : "open",
        gonkaParseRequestId: gonkaRequestId
      },
      milestonePayload
    );

    if (!isDraft) {
      setPostSuccess(true);
      await new Promise((r) => setTimeout(r, 1200));
      router.push(`/project/${newProjId}/candidates`);
    } else {
      router.push("/client/projects");
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-xs text-[#7C3AED] dark:text-[#A78BFA] mb-2 font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Hiring Assistant • Gonka Router</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Post a New Project
          </h1>
          <p className="text-xs sm:text-sm text-foreground/60 mt-1">
            Describe your project goals in plain language. Gonka AI will structure scope, milestones, and match scores.
          </p>
        </div>

        {/* Stage 1: Natural Language Prompt */}
        {stage === 1 && (
          <GlassCard className="p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">
                Describe what you want to build
              </label>
              <p className="text-xs text-foreground/60">
                Mention your required stack, estimated budget, key deliverables, and target timeline in plain English.
              </p>
              <textarea
                rows={6}
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                placeholder="e.g. We need a frontend developer to build an interactive Web3 dashboard in Next.js 15 and Tailwind CSS. We have $3,500 USDC budget and need 3 milestones over 2 weeks."
                className="w-full p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] text-sm text-foreground focus:outline-none focus:border-[#7B61FF]/60 resize-none leading-relaxed"
              />
            </div>

            {/* Error Message with Fallback */}
            {parseError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  <span>{parseError}</span>
                </div>
                <div className="flex items-center gap-4 pt-1">
                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    className="text-foreground underline hover:opacity-80 font-medium"
                  >
                    Try Again
                  </button>
                  <button
                    type="button"
                    onClick={handleSkipToManual}
                    className="text-[#2563EB] dark:text-[#4DA2FF] underline hover:opacity-80 font-medium"
                  >
                    Skip AI and fill in manually →
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={handleSkipToManual}
                className="text-xs text-foreground/50 hover:text-foreground underline text-left"
              >
                Skip AI and configure manually
              </button>

              <GradientButton
                size="lg"
                loading={loading}
                disabled={!descriptionInput.trim()}
                onClick={handleGenerateAI}
                icon={<Sparkles className="w-4 h-4" />}
              >
                {loading ? "Gonka AI is analyzing your project…" : "Generate Structured Plan with AI"}
              </GradientButton>
            </div>
          </GlassCard>
        )}

        {/* Stage 2: AI-Generated Editable Form */}
        {stage === 2 && (
          <div className="space-y-6">
            {/* AI Banner */}
            <div className="rounded-2xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/[0.08] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#8B5CF6]/20 text-[#7C3AED] dark:text-[#A78BFA] shrink-0">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-xs sm:text-sm text-foreground flex items-center gap-2">
                    <span>AI-Generated Milestone Proposal</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/10 dark:bg-black/40 text-[#7C3AED] dark:text-[#A78BFA]">
                      {gonkaRequestId}
                    </span>
                  </h4>
                  <p className="text-xs text-foreground/70">
                    Review and adjust title, budget, and milestone allocations before publishing.
                  </p>
                </div>
              </div>

              <GhostButton
                size="sm"
                onClick={() => setStage(1)}
                icon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Re-prompt AI
              </GhostButton>
            </div>

            {/* Core Fields Form */}
            <GlassCard className="space-y-6 p-6 sm:p-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wider">
                    Project Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] text-sm sm:text-base font-semibold text-foreground focus:outline-none focus:border-[#7B61FF]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wider">
                      Total Budget (USDC)
                    </label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 text-foreground/40 absolute left-3 top-3" />
                      <input
                        type="number"
                        value={estimatedBudget}
                        onChange={(e) => {
                          const nb = Number(e.target.value);
                          setEstimatedBudget(nb);
                          setMilestones(
                            milestones.map((m) => ({
                              ...m,
                              amount: Math.round((nb * m.percentOfBudget) / 100)
                            }))
                          );
                        }}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] text-sm font-mono text-foreground focus:outline-none focus:border-[#7B61FF]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wider">
                      Estimated Timeline (Days)
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-foreground/40 absolute left-3 top-3" />
                      <input
                        type="number"
                        value={timelineDays}
                        onChange={(e) => setTimelineDays(Number(e.target.value))}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] text-sm font-mono text-foreground focus:outline-none focus:border-[#7B61FF]"
                      />
                    </div>
                  </div>
                </div>

                {/* Skills Tag Input */}
                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-2 uppercase tracking-wider">
                    Required Skills & Technologies
                  </label>
                  <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
                    {requiredSkills.map((s) => (
                      <SkillChip key={s} label={s} onRemove={() => handleRemoveSkill(s)} />
                    ))}
                    <input
                      type="text"
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={handleAddSkill}
                      placeholder="+ Add skill & press Enter"
                      className="text-xs bg-transparent text-foreground focus:outline-none px-2 py-1 min-w-[140px]"
                    />
                  </div>
                </div>
              </div>

              {/* Milestones Breakdown */}
              <div className="space-y-4 pt-4 border-t border-black/10 dark:border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-foreground">Milestone Allocation Plan</h3>
                    <p className="text-xs text-foreground/60">
                      Funds will be escrowed and released incrementally per milestone.
                    </p>
                  </div>

                  {/* Running Total Indicator */}
                  <div
                    className={clsx(
                      "px-3.5 py-1.5 rounded-xl border font-mono text-xs font-semibold flex items-center gap-2 shrink-0",
                      isBudgetValid
                        ? "border-[#2DD4BF]/40 bg-[#2DD4BF]/10 text-[#0D9488] dark:text-[#2DD4BF]"
                        : "border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#D97706] dark:text-[#F59E0B]"
                    )}
                  >
                    <span>{totalPercentage.toFixed(0)}% allocated</span>
                    {!isBudgetValid && (
                      <span className="text-[10px] font-sans font-normal opacity-90">
                        (must equal 100%)
                      </span>
                    )}
                  </div>
                </div>

                {/* Repeatable Milestone Finalize Rows */}
                <div className="space-y-3">
                  {milestones.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="font-mono text-xs font-bold text-foreground/50">
                            #{idx + 1}
                          </span>
                          <input
                            type="text"
                            value={m.title}
                            onChange={(e) => handleMilestoneChange(idx, "title", e.target.value)}
                            placeholder="Milestone title"
                            className="w-full px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 text-xs font-semibold text-foreground focus:outline-none focus:border-[#7B61FF]"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-black/[0.03] dark:bg-black/30 border border-black/10 dark:border-white/10 px-2 py-1 rounded-lg">
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={m.percentOfBudget}
                              onChange={(e) =>
                                handleMilestoneChange(idx, "percentOfBudget", Number(e.target.value))
                              }
                              className="w-12 bg-transparent text-right font-mono text-xs text-foreground focus:outline-none"
                            />
                            <span className="text-xs font-mono text-foreground/50">%</span>
                          </div>

                          <span className="font-mono text-xs font-semibold text-[#0D9488] dark:text-[#2DD4BF] min-w-[70px] text-right">
                            ${Math.round((estimatedBudget * m.percentOfBudget) / 100).toLocaleString()}
                          </span>

                          {milestones.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMilestone(idx)}
                              className="p-1 text-foreground/30 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                              title="Delete milestone"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <textarea
                        rows={2}
                        value={m.deliverable}
                        onChange={(e) => handleMilestoneChange(idx, "deliverable", e.target.value)}
                        placeholder="Detailed deliverables for this milestone..."
                        className="w-full p-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 text-xs text-foreground/80 focus:outline-none focus:border-[#7B61FF] resize-none"
                      />
                    </div>
                  ))}
                </div>

                <GhostButton
                  size="sm"
                  onClick={handleAddMilestone}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Milestone
                </GhostButton>
              </div>

              {/* Bottom Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-black/10 dark:border-white/10">
                <GhostButton
                  onClick={() => handleSaveDraftOrPost(true)}
                  disabled={isPosting}
                >
                  Save as Draft
                </GhostButton>

                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                  {!isBudgetValid && (
                    <span className="text-xs text-[#D97706] dark:text-[#F59E0B]">
                      Milestone allocations sum to {totalPercentage.toFixed(0)}% (must equal 100%)
                    </span>
                  )}

                  <GradientButton
                    size="lg"
                    disabled={!isBudgetValid || !title.trim() || isPosting}
                    loading={isPosting}
                    onClick={() => handleSaveDraftOrPost(false)}
                    icon={<ArrowRight className="w-4 h-4 ml-1" />}
                  >
                    {postSuccess ? "Project Posted ✓" : "Post Project to Candidates Pool"}
                  </GradientButton>
                </div>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </AppShell>
  );
}
