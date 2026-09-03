"use client";

import React, { useState, useRef, useEffect } from "react";
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
  Send,
  Bot,
  User as UserIcon,
  ChevronRight,
  FileText,
  CheckCircle2,
  Layers,
  ShieldCheck,
  Coins,
  Lock,
  Check
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { AppShell } from "@/components/layout/app-shell";
import { GradientButton } from "@/components/ui/gradient-button";
import { GhostButton } from "@/components/ui/ghost-button";
import { GlassCard } from "@/components/ui/glass-card";
import { SkillChip } from "@/components/ui/skill-chip";
import { Milestone } from "@/types";
import { clsx } from "clsx";

interface ChatMessage {
  id: string;
  sender: "gonka" | "client";
  text: string;
  timestamp: string;
  suggestions?: string[];
  requestId?: string;
  showGenerateSpecification?: boolean;
}

interface MilestoneRow {
  title: string;
  deliverable: string;
  percentOfBudget: number;
  amount: number;
  deadlineDays: number;
}


function extractExplicitClientSkills(
  requirements: unknown,
  chatMessages: ChatMessage[],
): string[] {
  const clientText = chatMessages
    .filter((message) => message.sender === "client")
    .map((message) => message.text)
    .join("\n");

  const requirementTexts = Array.isArray(requirements)
    ? requirements
        .filter((item) => item && typeof item === "object")
        .map((item) => {
          const data = item as Record<string, unknown>;
          return typeof data.requirement === "string" ? data.requirement : "";
        })
        .filter(Boolean)
        .join("\n")
    : "";

  const sourceText = `${clientText}\n${requirementTexts}`;

  const candidates: Array<{ skill: string; pattern: RegExp }> = [
    { skill: "Sui Move", pattern: /\b(?:sui\s+move|move\s+(?:smart\s+)?contract|move\s+language)\b/i },
    { skill: "Sui blockchain", pattern: /\b(?:sui\s+blockchain|sui\s+network|sui\s+cryptocurrency|sui\s+token|sui\s+tokens|on\s+sui|built?\s+on\s+sui)\b/i },
    { skill: "Solidity", pattern: /\bsolidity\b/i },
    { skill: "Ethereum", pattern: /\bethereum\b/i },
    { skill: "Solana", pattern: /\bsolana\b/i },
    { skill: "Polygon", pattern: /\bpolygon\b/i },
    { skill: "Rust", pattern: /\brust\b/i },
    { skill: "React", pattern: /\breact(?:\.js)?\b/i },
    { skill: "Next.js", pattern: /\bnext\.?js\b/i },
    { skill: "Vue.js", pattern: /\bvue(?:\.js)?\b/i },
    { skill: "Angular", pattern: /\bangular\b/i },
    { skill: "TypeScript", pattern: /\btypescript\b/i },
    { skill: "JavaScript", pattern: /\bjavascript\b/i },
    { skill: "Flutter", pattern: /\bflutter\b/i },
    { skill: "React Native", pattern: /\breact\s+native\b/i },
    { skill: "Node.js", pattern: /\bnode\.?js\b/i },
    { skill: "Python", pattern: /\bpython\b/i },
    { skill: "Django", pattern: /\bdjango\b/i },
    { skill: "FastAPI", pattern: /\bfastapi\b/i },
    { skill: "PHP", pattern: /\bphp\b/i },
    { skill: "Laravel", pattern: /\blaravel\b/i },
    { skill: "PostgreSQL", pattern: /\bpostgres(?:ql)?\b/i },
    { skill: "MySQL", pattern: /\bmysql\b/i },
    { skill: "MongoDB", pattern: /\bmongodb\b/i },
    { skill: "Supabase", pattern: /\bsupabase\b/i },
    { skill: "Firebase", pattern: /\bfirebase\b/i },
    { skill: "Sui SDK", pattern: /\bsui\s+sdk\b/i },
    { skill: "Stripe", pattern: /\bstripe\b/i },
    { skill: "PayPal", pattern: /\bpaypal\b/i },
  ];

  const seen = new Set<string>();
  const skills: string[] = [];

  for (const candidate of candidates) {
    if (!candidate.pattern.test(sourceText)) continue;

    if (
      candidate.skill === "Sui blockchain" &&
      seen.has("sui move") &&
      !/\b(?:sui\s+blockchain|sui\s+network|sui\s+cryptocurrency|sui\s+token|sui\s+tokens|on\s+sui|built?\s+on\s+sui)\b/i.test(clientText)
    ) {
      continue;
    }

    const key = candidate.skill.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    skills.push(candidate.skill);
  }

  return skills;
}

function renderInlineGonkaMarkdown(text: string) {
  // Gonka can return escaped markdown such as \**Key Feature\**.
  const normalized = text.replace(/\\+\*/g, "*");
  const parts = normalized.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (
      part.startsWith("**") &&
      part.endsWith("**") &&
      part.length >= 4
    ) {
      return (
        <strong key={index} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

function renderGonkaMessage(text: string) {
  return text.split(/\r?\n/).map((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return <div key={index} className="h-2" />;
    }

    if (trimmed.startsWith("- ")) {
      return (
        <div key={index} className="flex gap-2">
          <span>•</span>
          <span>{renderInlineGonkaMarkdown(trimmed.slice(2))}</span>
        </div>
      );
    }

    return <p key={index}>{renderInlineGonkaMarkdown(line)}</p>;
  });
}

export default function PostProjectPage() {
  const router = useRouter();
  const { createProject, currentUser } = useApp();

  const [stage, setStage] = useState<1 | 2>(1);
  const [chatInput, setChatInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [gonkaRequestId, setGonkaRequestId] = useState("");
  const [projectAssistantResult, setProjectAssistantResult] = useState<any>(null);
  const [projectAnalysisResult, setProjectAnalysisResult] = useState<any>(null);
  const [projectConfirmed, setProjectConfirmed] = useState(false);
  const [isProjectAnalysisRunning, setIsProjectAnalysisRunning] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Chat Conversation State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-init",
      sender: "gonka",
      text: "Hello! I'm Gonka AI, your Web3 hiring architect. Describe what you'd like to build, and I'll help you refine the technical scope, deliverables, and milestone breakdown.",
      timestamp: "Just now",
      suggestions: [
        "Hi, I need a Sui payment app for businesses.",
        "I need a Sui Move smart contract for escrow.",
        "Build a Next.js 15 Web3 dashboard with wallet connect."
      ]
    }
  ]);

  // Stage 2 Form Fields (AI Structured Specification)
  const [title, setTitle] = useState("Sui Merchant Payment App & Checkout Widget");
  const [descriptionRaw, setDescriptionRaw] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<"Beginner" | "Intermediate" | "Expert">("Expert");
  const [estimatedBudget, setEstimatedBudget] = useState(4500);
  const [timelineDays, setTimelineDays] = useState(21);
  const [deliverables, setDeliverables] = useState<string[]>([
    "Sui Move smart contract for merchant payment requests and settlements",
    "Next.js merchant portal to create payment invoices and view transaction status",
    "Embeddable customer checkout modal supporting Sui Wallet & zkLogin",
    "Comprehensive testnet verification suite and developer documentation"
  ]);
  const [newDeliverableInput, setNewDeliverableInput] = useState("");
  const [milestones, setMilestones] = useState<MilestoneRow[]>([
    {
      title: "Milestone 1: Architecture, Smart Contract & Design System",
      deliverable: "Technical specification document, Move escrow/payment contracts, and UI component wireframes.",
      percentOfBudget: 35,
      amount: 1575,
      deadlineDays: 7
    },
    {
      title: "Milestone 2: Frontend Merchant Portal & Wallet Integration",
      deliverable: "Interactive Next.js dashboard, invoice generator, and Sui Wallet signing integration.",
      percentOfBudget: 40,
      amount: 1800,
      deadlineDays: 15
    },
    {
      title: "Milestone 3: End-to-End QA, Testnet Deployment & Handoff",
      deliverable: "Full integration test suite, live testnet deployment, and developer documentation.",
      percentOfBudget: 25,
      amount: 1125,
      deadlineDays: 21
    }
  ]);

  const [isPosting, setIsPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (stage === 1) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isThinking, stage]);

  // Handle Client Sending a Chat Message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || chatInput).trim();

    if (!text || isThinking || projectConfirmed || isProjectAnalysisRunning) return;

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: "client",
      text,
      timestamp: "Just now"
    };

    const newMessages = [...messages, userMsg];

    setMessages(newMessages);
    setChatInput("");
    setIsThinking(true);

    try {
      // Keep the initial static greeting out of the AI conversation.
      // Real assistant responses are included so Gonka retains context
      // across multiple turns.
      const conversation = newMessages
        .filter((message) => message.id !== "msg-init")
        .map((message) => ({
          role: message.sender === "client" ? "user" : "assistant",
          content: message.text
        }));

      const response = await fetch("/api/gonka/project-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: conversation
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Project Assistant request failed."
        );
      }

      const completed =
        result.confirmed === true ||
        (result.status === "COMPLETED" && !!result.proposal);

      // Latch the approved proposal. Do not allow a later casual message
      // to replace the approved result.
      if (completed) {
        setProjectConfirmed(true);
        setProjectAssistantResult(result);
      } else if (!projectConfirmed) {
        setProjectAssistantResult(result);
      }

      // Show the real Gonka request ID in the UI.
      if (result.requestId) {
        setGonkaRequestId(result.requestId);
      }

      // Display Gonka's real natural-language response.
      const aiMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: "gonka",
        text:
          result.message ||
          "I received your request. Let me help you refine the project requirements.",
        timestamp: "Just now",
        requestId: result.requestId,
        suggestions: [],
        showGenerateSpecification: completed
      };

      setMessages([...newMessages, aiMsg]);
    } catch (error) {
      console.error("Project Assistant request failed:", error);

      const errorMsg: ChatMessage = {
        id: `msg-ai-error-${Date.now()}`,
        sender: "gonka",
        text:
          error instanceof Error
            ? `Sorry, I couldn't process your request. ${error.message}`
            : "Sorry, I couldn't reach Gonka AI right now. Please try again.",
        timestamp: "Just now"
      };

      setMessages([...newMessages, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  // Manual configuration bypasses Project Assistant and Project Analysis.
  const handleManualStage2 = () => {
    setStage(2);
  };

  // Run Project Analysis only after the client explicitly clicks
  // "Generate Specification" on the completed Project Assistant message.
  const handleTransitionToStage2 = async () => {
    const proposal = projectAssistantResult?.proposal;

    if (
      !projectConfirmed ||
      projectAssistantResult?.status !== "COMPLETED" ||
      !proposal
    ) {
      console.error(
        "Cannot start Project Analysis: Project Assistant proposal has not been approved."
      );
      return;
    }

    if (isProjectAnalysisRunning) return;

    setIsProjectAnalysisRunning(true);
    setIsThinking(true);

    try {
      const requirements = {
        projectTitle: proposal.title,
        description: proposal.description,
        coreFeatures: Array.isArray(proposal.coreFeatures)
          ? proposal.coreFeatures
          : [],
        explicitSkills: extractExplicitClientSkills(
          projectAssistantResult?.requirements,
          messages,
        ),
        budget: {
          amount: Number(proposal.budgetUsdc),
          currency: "USDC"
        },
        timeline: {
          days: Number(proposal.timelineDays)
        }
      };

      if (
        !requirements.projectTitle?.trim() ||
        !requirements.description?.trim() ||
        requirements.coreFeatures.length === 0 ||
        !Number.isFinite(requirements.budget.amount) ||
        requirements.budget.amount <= 0 ||
        !Number.isInteger(requirements.timeline.days) ||
        requirements.timeline.days <= 0
      ) {
        throw new Error(
          "The approved Project Assistant proposal is incomplete."
        );
      }

      console.log(
        "Sending approved requirements to Project Analysis:",
        requirements
      );

      const response = await fetch("/api/gonka/project-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          requirements
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Project Analysis request failed."
        );
      }

      const analysis = result.analysis;

      if (!analysis) {
        throw new Error("Project Analysis returned no analysis.");
      }

      console.log("Gonka Project Analysis result:", result);

      setProjectAnalysisResult(result);

      // Populate Stage 2 from Project Analysis only.
      setTitle(analysis.projectTitle);
      setDescriptionRaw(analysis.projectDescription);

      // IMPORTANT:
      // requiredSkills are decided by projectAnalysis.ts.
      // The UI must not hardcode React/TypeScript/etc.
      setRequiredSkills(
        Array.isArray(analysis.requiredSkills)
          ? analysis.requiredSkills
          : []
      );

      setDeliverables(
        Array.isArray(analysis.keyDeliverables)
          ? analysis.keyDeliverables
          : []
      );

      setEstimatedBudget(
        Number(analysis.budget?.amount) ||
          requirements.budget.amount
      );

      setTimelineDays(
        Number(analysis.estimatedTimelineDays) ||
          requirements.timeline.days
      );

      if (
        analysis.experienceLevel === "Beginner" ||
        analysis.experienceLevel === "Intermediate" ||
        analysis.experienceLevel === "Expert"
      ) {
        setExperienceLevel(analysis.experienceLevel);
      } else if (analysis.experienceLevel === "Senior") {
        setExperienceLevel("Expert");
      }

      const uiMilestones: MilestoneRow[] =
        Array.isArray(analysis.milestones)
          ? analysis.milestones.map(
              (
                milestone: {
                  title: string;
                  description: string;
                  percentageAllocation: number;
                  amount: number;
                },
                index: number
              ) => ({
                title: `Milestone ${index + 1}: ${milestone.title}`,
                deliverable: milestone.description,
                percentOfBudget: Number(
                  milestone.percentageAllocation
                ),
                amount: Number(milestone.amount),
                deadlineDays: Math.max(
                  1,
                  Math.round(
                    (Number(analysis.estimatedTimelineDays) *
                      Number(milestone.percentageAllocation)) /
                      100
                  )
                )
              })
            )
          : [];

      if (uiMilestones.length > 0) {
        setMilestones(uiMilestones);
      }

      // Only move to Stage 2 after Project Analysis succeeds.
      setStage(2);
    } catch (error) {
      console.error("Project Analysis failed:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Project Analysis request failed.";

      const aiErrorMsg: ChatMessage = {
        id: `msg-analysis-error-${Date.now()}`,
        sender: "gonka",
        text: `I couldn't generate the project specification yet. ${errorMessage}`,
        timestamp: "Just now"
      };

      setMessages((current) => [...current, aiErrorMsg]);
    } finally {
      setIsThinking(false);
      setIsProjectAnalysisRunning(false);
    }
  };

  // Skill Add / Remove
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

  // Deliverable Add / Remove
  const handleAddDeliverable = () => {
    if (!newDeliverableInput.trim()) return;
    setDeliverables([...deliverables, newDeliverableInput.trim()]);
    setNewDeliverableInput("");
  };

  const handleRemoveDeliverable = (index: number) => {
    setDeliverables(deliverables.filter((_, i) => i !== index));
  };

  const handleDeliverableChange = (index: number, val: string) => {
    const updated = [...deliverables];
    updated[index] = val;
    setDeliverables(updated);
  };

  // Milestone Row Handlers
  const handleMilestoneChange = (index: number, field: keyof MilestoneRow, value: any) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "percentOfBudget") {
      updated[index].amount = Math.round((estimatedBudget * Number(value)) / 100);
    }
    setMilestones(updated);
  };

  const handleAddMilestone = () => {
    const allocated = milestones.reduce((sum, m) => sum + m.percentOfBudget, 0);
    const remaining = Math.max(0, 100 - allocated);
    const newMs: MilestoneRow = {
      title: `Milestone ${milestones.length + 1}: Extension Scope`,
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

  // 100% Invariant Validation
  const totalPercentage = milestones.reduce((sum, m) => sum + Number(m.percentOfBudget || 0), 0);
  const isBudgetValid = Math.abs(totalPercentage - 100) < 0.01;

  // Save as Draft or Post Project
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
        descriptionRaw,
        requiredSkills,
        estimatedBudget,
        timelineDays,
        experienceLevel,
        deliverables,
        status: isDraft ? "draft" : "open",
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-xs text-[#7C3AED] dark:text-[#A78BFA] mb-2 font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gonka AI • Conversational Project Assistant</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {stage === 1 ? "Discuss & Scope Your Project" : "Review & Customize Specification"}
            </h1>
            <p className="text-xs sm:text-sm text-foreground/60 mt-1">
              {stage === 1
                ? "Chat naturally with Gonka AI to clarify requirements, deliverables, and milestone schedules."
                : "Review and fine-tune your project parameters before publishing to the candidates pool."}
            </p>
          </div>

          {stage === 1 && (
            <GhostButton
              size="sm"
              onClick={handleManualStage2}
            >
              Skip AI & Configure Manually →
            </GhostButton>
          )}
        </div>

        {/* ========================================================================= */}
        {/* STAGE 1: CONVERSATIONAL AI CHAT INTERFACE                                 */}
        {/* ========================================================================= */}
        {stage === 1 && (
          <div className="space-y-4">
            {/* Main Chat Box Container */}
            <GlassCard className="p-0 overflow-hidden flex flex-col h-[520px] sm:h-[580px] border border-black/10 dark:border-white/10 shadow-xl">
              {/* Chat Top Banner */}
              <div className="px-5 py-3.5 border-b border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-[#4DA2FF] text-white flex items-center justify-center shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span>Gonka AI Hiring Agent</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                    </h3>
                    <p className="text-[10px] font-mono text-foreground/50">Gonka Router v2.4 • Active Session</p>
                  </div>
                </div>
              </div>

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {messages.map((msg) => {
                  const isGonka = msg.sender === "gonka";
                  return isGonka ? (
                    <div key={msg.id} className="flex items-start gap-3 justify-start w-full">
                      {/* Gonka Avatar */}
                      <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold shadow-sm bg-[#8B5CF6]/20 text-[#7C3AED] dark:text-[#A78BFA] border border-[#8B5CF6]/30">
                        <Bot className="w-4 h-4" />
                      </div>

                      {/* Gonka Bubble */}
                      <div className="flex-1 max-w-[95%] sm:max-w-[90%] space-y-2">
                        <div className="p-4 rounded-2xl rounded-tl-none text-xs sm:text-sm leading-relaxed bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-foreground space-y-2.5">
                          <p className="whitespace-pre-line">{msg.text}</p>

                          {/* Gonka Request ID Badge */}
                          {msg.requestId && (
                            <div className="flex items-center gap-2 pt-2 border-t border-black/5 dark:border-white/5 text-[10px] font-mono text-foreground/50">
                              <span className="flex items-center gap-1 text-[#7C3AED] dark:text-[#A78BFA] font-medium">
                                <Cpu className="w-3 h-3 text-[#7C3AED] dark:text-[#8B5CF6]" />
                                <span>Gonka Router</span>
                              </span>
                              <span>•</span>
                              <span className="bg-purple-500/10 dark:bg-black/30 px-2 py-0.5 rounded border border-purple-500/20 dark:border-white/5 text-[#7C3AED] dark:text-[#A78BFA]">
                                {msg.requestId}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Client-approved Project Analysis action */}
                        {msg.showGenerateSpecification && projectConfirmed && (
                          <div className="mt-2 p-4 rounded-2xl border border-[#8B5CF6]/30 bg-gradient-to-r from-[#8B5CF6]/10 via-[#7B61FF]/5 to-[#4DA2FF]/10 shadow-sm">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/15 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center shrink-0">
                                <Sparkles className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-semibold text-foreground">
                                  Your project proposal is confirmed.
                                </p>
                                <p className="text-[11px] sm:text-xs text-foreground/60 mt-1 leading-relaxed">
                                  The approved requirements are ready. Click Generate Specification to let Gonka Project Analysis build the structured project specification.
                                </p>
                                <button
                                  type="button"
                                  onClick={handleTransitionToStage2}
                                  disabled={isProjectAnalysisRunning}
                                  className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#4DA2FF] text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Sparkles className="w-4 h-4" />
                                  {isProjectAnalysisRunning ? "Generating Specification..." : "Generate Specification"}
                                  {!isProjectAnalysisRunning && <ArrowRight className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Suggested Quick Reply Chips */}
                        {msg.suggestions && msg.suggestions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {msg.suggestions.map((sugg, sIdx) => (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={() => {
                                  if (sugg.includes("Review & Finalize")) {
                                    handleTransitionToStage2();
                                  } else {
                                    handleSendMessage(sugg);
                                  }
                                }}
                                className="px-3 py-1.5 rounded-xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 text-[11px] font-medium text-[#7C3AED] dark:text-[#A78BFA] transition-all text-left flex items-center gap-1.5 cursor-pointer"
                              >
                                <span>{sugg}</span>
                                <ChevronRight className="w-3 h-3 opacity-60" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div key={msg.id} className="flex items-start gap-3 justify-end w-full">
                      {/* Client Bubble */}
                      <div className="max-w-[85%] sm:max-w-[75%] space-y-1 text-right">
                        <div className="inline-block text-left p-3.5 sm:p-4 rounded-2xl rounded-tr-none text-xs sm:text-sm leading-relaxed bg-gradient-to-r from-[#4DA2FF] to-[#7B61FF] text-white shadow-md">
                          <p className="whitespace-pre-line">{msg.text}</p>
                        </div>
                      </div>

                      {/* Client Avatar */}
                      <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold shadow-sm bg-black/10 dark:bg-white/10 text-foreground">
                        <UserIcon className="w-4 h-4" />
                      </div>
                    </div>
                  );
                })}

                {/* Thinking Indicator */}
                {isThinking && (
                  <div className="flex items-start gap-3 justify-start w-full">
                    <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/20 text-[#7C3AED] dark:text-[#A78BFA] border border-[#8B5CF6]/30 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 animate-spin-slow" />
                    </div>
                    <div className="p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs text-foreground/60 flex items-center gap-2">
                      <span className="inline-flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                      <span>{isProjectAnalysisRunning ? "Gonka is analyzing your project specification…" : "Gonka AI is analyzing requirements…"}</span>
                    </div>
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 sm:p-4 border-t border-black/10 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.02]">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={projectConfirmed ? "Proposal confirmed — click Generate Specification above to continue." : "Type requirements, deliverables, or answer Gonka's questions…"}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/30 text-xs sm:text-sm text-foreground focus:outline-none focus:border-[#7B61FF]"
                  />
                  <GradientButton
                    size="md"
                    type="submit"
                    disabled={!chatInput.trim() || isThinking || projectConfirmed || isProjectAnalysisRunning}
                    icon={<Send className="w-3.5 h-3.5" />}
                  >
                    Send
                  </GradientButton>
                </form>
              </div>
            </GlassCard>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 2: EDITABLE SPECIFICATION & MILESTONE ALLOCATION FORM               */}
        {/* ========================================================================= */}
        {stage === 2 && (
          <div className="space-y-6">
            {/* Top AI Spec Banner */}
            <div className="rounded-2xl border border-[#8B5CF6]/30 bg-gradient-to-r from-[#8B5CF6]/10 via-[#7B61FF]/5 to-[#4DA2FF]/10 p-5 backdrop-blur-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#8B5CF6] to-[#4DA2FF] text-white flex items-center justify-center shadow-md shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-bold text-sm sm:text-base text-foreground">
                      Gonka AI Structured Specification
                    </h3>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#0D9488] dark:text-[#10B981] text-[11px] font-medium border border-[#10B981]/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                      Synthesized & Ready
                    </span>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-purple-500/10 dark:bg-black/30 border border-purple-500/20 dark:border-white/10 text-[#7C3AED] dark:text-[#A78BFA]">
                    </span>
                  </div>
                  <p className="text-xs text-foreground/70 leading-relaxed">
                    Review and fine-tune scope, deliverables, and on-chain escrow milestones before publishing to the candidate pool.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <GhostButton
                  size="sm"
                  onClick={() => setStage(1)}
                  icon={<RotateCcw className="w-3.5 h-3.5" />}
                >
                  Back to AI Chat
                </GhostButton>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#151622]/70 backdrop-blur-md flex items-center gap-3 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-[#0D9488] dark:text-[#2DD4BF] flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-foreground/50 block">Total Budget</span>
                  <span className="text-xs sm:text-sm font-bold font-mono text-foreground">${estimatedBudget.toLocaleString()} USDC</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#151622]/70 backdrop-blur-md flex items-center gap-3 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-[#2563EB] dark:text-[#4DA2FF] flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-foreground/50 block">Timeline</span>
                  <span className="text-xs sm:text-sm font-bold font-mono text-foreground">{timelineDays} Days</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#151622]/70 backdrop-blur-md flex items-center gap-3 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-foreground/50 block">Seniority</span>
                  <span className="text-xs sm:text-sm font-bold text-foreground">{experienceLevel}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#151622]/70 backdrop-blur-md flex items-center gap-3 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-[#D97706] dark:text-[#F59E0B] flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-foreground/50 block">Escrow Milestones</span>
                  <span className="text-xs sm:text-sm font-bold font-mono text-foreground">{milestones.length} Phases</span>
                </div>
              </div>
            </div>

            {/* SECTION 1: Scope & Project Identity */}
            <GlassCard className="p-6 sm:p-7 space-y-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-black/10 dark:border-white/10">
                <div className="p-1.5 rounded-lg bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#A78BFA]">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Project Identity & Scope</h3>
                  <p className="text-xs text-foreground/60">Define the project title and detailed technical narrative.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wider">
                    Project Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Sui Merchant Payment App & Checkout SDK"
                    className="w-full px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] text-sm sm:text-base font-semibold text-foreground focus:outline-none focus:border-[#7B61FF] transition-colors shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wider">
                    Scope & Technical Description
                  </label>
                  <textarea
                    rows={4}
                    value={descriptionRaw}
                    onChange={(e) => setDescriptionRaw(e.target.value)}
                    placeholder="Detailed description of the project requirements, use cases, and technical expectations..."
                    className="w-full p-4 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] text-xs sm:text-sm text-foreground focus:outline-none focus:border-[#7B61FF] resize-none leading-relaxed transition-colors shadow-sm"
                  />
                </div>
              </div>
            </GlassCard>

            {/* SECTION 2: Budget, Timeline & Talent Criteria */}
            <GlassCard className="p-6 sm:p-7 space-y-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-black/10 dark:border-white/10">
                <div className="p-1.5 rounded-lg bg-[#2DD4BF]/15 text-[#0D9488] dark:text-[#2DD4BF]">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Parameters & Talent Criteria</h3>
                  <p className="text-xs text-foreground/60">Set budget caps, expected timeline, and developer experience level.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Budget */}
                <div className="p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">Total Budget</span>
                    <span className="text-[10px] font-mono text-[#0D9488] dark:text-[#2DD4BF] bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Sui Escrow
                    </span>
                  </div>
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
                      className="w-full pl-9 pr-14 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] text-sm font-mono font-bold text-foreground focus:outline-none focus:border-[#7B61FF]"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-mono font-bold text-foreground/50">USDC</span>
                  </div>
                </div>

                {/* Timeline */}
                <div className="p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">Timeline</span>
                    <span className="text-[10px] font-mono text-[#2563EB] dark:text-[#4DA2FF] bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                      ~{Math.ceil(timelineDays / 7)} Weeks
                    </span>
                  </div>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-foreground/40 absolute left-3 top-3" />
                    <input
                      type="number"
                      value={timelineDays}
                      onChange={(e) => setTimelineDays(Number(e.target.value))}
                      className="w-full pl-9 pr-14 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] text-sm font-mono font-bold text-foreground focus:outline-none focus:border-[#7B61FF]"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-mono font-bold text-foreground/50">Days</span>
                  </div>
                </div>

                {/* Experience Tier */}
                <div className="p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">Experience Level</span>
                    <span className="text-[10px] font-mono text-[#7C3AED] dark:text-[#A78BFA] bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                      Gonka Matching
                    </span>
                  </div>
                  <div className="flex items-center gap-1 p-1 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03]">
                    {(["Beginner", "Intermediate", "Expert"] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setExperienceLevel(lvl)}
                        className={clsx(
                          "flex-1 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                          experienceLevel === lvl
                            ? "bg-gradient-to-r from-[#4DA2FF] to-[#7B61FF] text-white shadow-sm"
                            : "text-foreground/60 hover:text-foreground"
                        )}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* SECTION 3: Required Tech Stack */}
            <GlassCard className="p-6 sm:p-7 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-black/10 dark:border-white/10">
                <div className="p-1.5 rounded-lg bg-[#4DA2FF]/15 text-[#2563EB] dark:text-[#4DA2FF]">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Required Skills & Tech Stack</h3>
                  <p className="text-xs text-foreground/60">Gonka AI uses these skill vectors to score and rank candidates.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 p-3.5 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
                {requiredSkills.map((s) => (
                  <SkillChip key={s} label={s} onRemove={() => handleRemoveSkill(s)} />
                ))}
                <div className="flex items-center gap-1 flex-1 min-w-[160px]">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={handleAddSkill}
                    placeholder="+ Type skill & press Enter"
                    className="text-xs bg-transparent text-foreground focus:outline-none px-2 py-1 w-full placeholder:text-foreground/40"
                  />
                </div>
              </div>
            </GlassCard>

            {/* SECTION 4: Key Deliverables Checklist */}
            <GlassCard className="p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-500/15 text-[#0D9488] dark:text-[#10B981]">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Key Deliverables & Outcomes</h3>
                    <p className="text-xs text-foreground/60">Clear concrete expectations required from the hired developer.</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-foreground/50 bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-full">
                  {deliverables.length} Deliverables
                </span>
              </div>

              <div className="space-y-2.5">
                {deliverables.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2.5 rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] hover:border-black/20 dark:hover:border-white/20 transition-all group"
                  >
                    <span className="w-7 h-7 rounded-xl bg-purple-500/15 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center font-mono text-xs font-bold shrink-0">
                      D{idx + 1}
                    </span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleDeliverableChange(idx, e.target.value)}
                      className="flex-1 bg-transparent text-xs sm:text-sm text-foreground focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveDeliverable(idx)}
                      className="p-1.5 text-foreground/30 hover:text-red-500 transition-colors opacity-60 group-hover:opacity-100 cursor-pointer"
                      title="Remove deliverable"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newDeliverableInput}
                    onChange={(e) => setNewDeliverableInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddDeliverable())}
                    placeholder="+ Add new deliverable..."
                    className="flex-1 px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-xs text-foreground focus:outline-none focus:border-[#7B61FF]"
                  />
                  <GhostButton size="sm" onClick={handleAddDeliverable} icon={<Plus className="w-3.5 h-3.5" />}>
                    Add Deliverable
                  </GhostButton>
                </div>
              </div>
            </GlassCard>

            {/* SECTION 5: Sui Escrow Milestone Allocation Plan */}
            <GlassCard className="p-6 sm:p-7 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/10 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-500/15 text-[#D97706] dark:text-[#F59E0B]">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-foreground">Sui Escrow Milestone Allocation Plan</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#7C3AED] dark:text-[#A78BFA]">
                        100% Invariant
                      </span>
                    </div>
                    <p className="text-xs text-foreground/60">
                      Funds remain locked on Sui and are released milestone-by-milestone upon your verification.
                    </p>
                  </div>
                </div>

                {/* Running Total Indicator Badge */}
                <div
                  className={clsx(
                    "px-3.5 py-1.5 rounded-xl border font-mono text-xs font-semibold flex items-center gap-2 shrink-0 self-start sm:self-center",
                    isBudgetValid
                      ? "border-[#2DD4BF]/40 bg-[#2DD4BF]/10 text-[#0D9488] dark:text-[#2DD4BF]"
                      : "border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#D97706] dark:text-[#F59E0B]"
                  )}
                >
                  <span className="w-2 h-2 rounded-full bg-current" />
                  <span>{totalPercentage.toFixed(0)}% Allocated</span>
                  {!isBudgetValid && (
                    <span className="text-[10px] font-sans font-normal opacity-90">
                      (must equal 100%)
                    </span>
                  )}
                </div>
              </div>

              {/* Segmented Visual Allocation Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-foreground/60">
                  <span>Milestone Funding Distribution:</span>
                  <span className="font-bold text-foreground">${estimatedBudget.toLocaleString()} USDC Total</span>
                </div>
                <div className="h-3.5 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden flex gap-1 p-0.5">
                  {milestones.map((m, idx) => {
                    const colors = [
                      "bg-[#4DA2FF]",
                      "bg-[#7B61FF]",
                      "bg-[#2DD4BF]",
                      "bg-[#F59E0B]",
                      "bg-[#EC4899]"
                    ];
                    return (
                      <div
                        key={idx}
                        style={{ width: `${Math.max(4, m.percentOfBudget)}%` }}
                        className={clsx(
                          "h-full rounded-full transition-all flex items-center justify-center text-[9px] font-mono text-white font-bold",
                          colors[idx % colors.length]
                        )}
                        title={`Milestone ${idx + 1}: ${m.percentOfBudget}% ($${Math.round((estimatedBudget * m.percentOfBudget) / 100)} USDC)`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Repeatable Milestone Cards */}
              <div className="space-y-3.5">
                {milestones.map((m, idx) => {
                  const colors = [
                    "from-[#4DA2FF] to-[#7B61FF]",
                    "from-[#7B61FF] to-[#8B5CF6]",
                    "from-[#2DD4BF] to-[#10B981]",
                    "from-[#F59E0B] to-[#D97706]"
                  ];
                  return (
                    <div
                      key={idx}
                      className="p-4 sm:p-5 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#151622]/70 backdrop-blur-md space-y-3 relative group shadow-sm hover:border-[#7B61FF]/40 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 flex-1">
                          <div className={clsx(
                            "w-8 h-8 rounded-xl bg-gradient-to-tr text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 shadow-sm",
                            colors[idx % colors.length]
                          )}>
                            M{idx + 1}
                          </div>
                          <input
                            type="text"
                            value={m.title}
                            onChange={(e) => handleMilestoneChange(idx, "title", e.target.value)}
                            placeholder="Milestone title..."
                            className="w-full px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:border-[#7B61FF]"
                          />
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          {/* Percentage Input */}
                          <div className="flex items-center gap-1 bg-black/[0.03] dark:bg-black/30 border border-black/10 dark:border-white/10 px-2.5 py-1 rounded-xl">
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={m.percentOfBudget}
                              onChange={(e) =>
                                handleMilestoneChange(idx, "percentOfBudget", Number(e.target.value))
                              }
                              className="w-10 bg-transparent text-right font-mono text-xs font-bold text-foreground focus:outline-none"
                            />
                            <span className="text-xs font-mono text-foreground/50">%</span>
                          </div>

                          {/* Calculated Amount */}
                          <div className="px-3 py-1 rounded-xl bg-teal-500/10 border border-teal-500/20 text-right min-w-[85px]">
                            <span className="font-mono text-xs font-bold text-[#0D9488] dark:text-[#2DD4BF]">
                              ${Math.round((estimatedBudget * m.percentOfBudget) / 100).toLocaleString()}
                            </span>
                          </div>

                          {/* Delete Milestone Button */}
                          {milestones.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMilestone(idx)}
                              className="p-1.5 text-foreground/30 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
                              title="Delete milestone"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Deliverables Description */}
                      <textarea
                        rows={2}
                        value={m.deliverable}
                        onChange={(e) => handleMilestoneChange(idx, "deliverable", e.target.value)}
                        placeholder="Milestone deliverables and acceptance criteria..."
                        className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-xs text-foreground/80 focus:outline-none focus:border-[#7B61FF] resize-none leading-relaxed"
                      />
                    </div>
                  );
                })}
              </div>

              <GhostButton
                size="sm"
                onClick={handleAddMilestone}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Another Milestone
              </GhostButton>
            </GlassCard>

            {/* Bottom Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#151622]/80 backdrop-blur-xl shadow-lg">
              <div className="flex items-center gap-2 text-xs text-foreground/60">
                <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                <span>Escrow funds remain in your custody until milestone work is delivered and approved.</span>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <GhostButton
                  onClick={() => handleSaveDraftOrPost(true)}
                  disabled={isPosting}
                >
                  Save as Draft
                </GhostButton>

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
          </div>
        )}
      </div>
    </AppShell>
  );
}
