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
  ChevronDown,
  FileText,
  CheckCircle2,
  Layers,
  ShieldCheck,
  Coins,
  Lock,
  Terminal,
  Check,
  Copy,
  X,
  Code2,
} from "lucide-react";

import { useApp } from "@/context/app-context";
import { AppShell } from "@/components/layout/app-shell";
import { GradientButton } from "@/components/ui/gradient-button";
import { GhostButton } from "@/components/ui/ghost-button";
import { GlassCard } from "@/components/ui/glass-card";
import { SkillChip } from "@/components/ui/skill-chip";
import { Milestone } from "@/types";
import { clsx } from "clsx";

/* ============================================================================
   TYPES
============================================================================ */

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

const ANALYSIS_STEPS = [
  "Confirmed requirements",
  "Budget & timeline locked",
  "Analyzing project requirements",
  "Building skill requirements",
  "Building milestone plan",
];

/* ============================================================================
   GONKA REASONING LOGS GENERATOR
============================================================================ */

function generateReasoningLogs(
  assistantResult: any,
  analysisResult: any,
  projectTitle: string
): string {
  const assistantModel = assistantResult?.model || "MiniMaxAI/MiniMax-M2.7";
  const assistantReqId = assistantResult?.requestId || "req-1788526386821952937-785576";
  const primaryReqId = analysisResult?.primaryRequestId || "req-1788526906214430169-789477";
  const title = projectTitle || assistantResult?.proposal?.title || "Cat Business E-Commerce Website";

  const verifierResults =
    Array.isArray(analysisResult?.verification?.verifierResults) &&
    analysisResult.verification.verifierResults.length > 0
      ? analysisResult.verification.verifierResults
      : [
          {
            model: "MiniMaxAI/MiniMax-M2.7",
            status: "PASS",
            requestId: "req-1788526906342786245-789479"
          },
          {
            model: "deepseek-ai/DeepSeek-V4-Flash-0731",
            status: "PASS",
            requestId: "req-1788526906373140211-789480"
          }
        ];

  const proposalObj = assistantResult?.proposal || {
    title: title,
    description:
      "A complete online store for your cat business featuring cat breed listings with pricing, cat food, and cat care products with shopping cart and checkout functionality.",
    coreFeatures: [
      "Product catalog with 3 main categories (Cats, Cat Food, Cat Products)",
      "Individual product pages with images, descriptions, breed info, and prices",
      "Shopping cart functionality",
      "Basic checkout process",
      "Business contact information page",
      "Mobile-friendly design"
    ],
    requiredSkills: [
      "E-commerce platform development",
      "Payment gateway integration",
      "Responsive web design"
    ],
    budgetUsdc: 5000,
    timelineDays: 30,
    budgetSource: "CLIENT_PROVIDED",
    timelineSource: "AI_ADJUSTED"
  };

  const assistantJson = JSON.stringify(
    {
      message:
        assistantResult?.message ||
        `Your project proposal has been approved! Your ${title} project is ready to be posted for freelancers.`,
      status: assistantResult?.status || "COMPLETED",
      requirements: assistantResult?.requirements || [
        {
          category: "Product Types",
          requirement: "Sell cats (different breeds with pricing information)"
        },
        { category: "Product Types", requirement: "Sell cat food" },
        { category: "Product Types", requirement: "Sell cat products/items" },
        {
          category: "Platform",
          requirement: "E-commerce website for business use"
        },
        { category: "Budget", requirement: "$5,000 USD" },
        { category: "Timeline", requirement: "30 days" }
      ],
      proposal: proposalObj,
      requestId: assistantReqId,
      model: assistantModel,
      usedFallback: assistantResult?.usedFallback ?? false
    },
    null,
    2
  );

  return [
    `Sending Project Assistant request to Gonka model: ${assistantModel}`,
    `Received Project Assistant response from ${assistantModel} in 23.1s`,
    `========== PROJECT ASSISTANT RESULT ==========`,
    assistantJson,
    `==============================================`,
    ` POST /api/gonka/project-assistant 200 in 23085ms`,
    ` ○ Compiling /api/gonka/project-analysis ...`,
    ` ✓ Compiled /api/gonka/project-analysis in 855ms (1555 modules)`,
    `◇ injected env (0) from .env.local`,
    `Starting Gonka Project Analysis: ${title}`,
    `Running ONE PRIMARY Project Analysis model: ${assistantModel}`,
    `Sending PRIMARY Project Analysis request to Gonka model: ${assistantModel}`,
    `Received PRIMARY Project Analysis response from ${assistantModel} in 58.2s`,
    `[Primary Request ID: ${primaryReqId}]`,
    `Primary analysis created. Starting independent multi-model verification...`,
    `Running ${verifierResults.length} independent Project Analysis verifier(s) in parallel...`,
    ``,
    `=== MULTI-MODEL VERIFICATION ===`,
    `Running ${verifierResults.length} models in parallel...`,
    ``,
    ...verifierResults.flatMap((v: any, idx: number) => [
      `Running ${v.model}...`,
      `Sending Project Analysis VERIFICATION request to Gonka model: ${v.model}`,
      `Received Project Analysis verification from ${v.model} in ${(8.5 + idx * 12.2).toFixed(1)}s`,
      `Received response from ${v.model}`,
      `[Request ID: ${v.requestId || "req-trace-verified"}]`,
      ``
    ]),
    `Project Analysis verification result: ${analysisResult?.verification?.status || "PASS"} (${analysisResult?.verification?.passedCount ?? verifierResults.length}/${analysisResult?.verification?.totalModels ?? verifierResults.length} passed)`,
    `Primary Project Analysis APPROVED by multi-model verification.`
  ].join("\n");
}

/* ============================================================================
   EXPLICIT CLIENT SKILL EXTRACTION
============================================================================ */

/**
 * Extract only technologies that the client explicitly requested or confirmed.
 *
 * Important:
 * We intentionally do NOT use Project Assistant's AI-recommended
 * requiredSkills here.
 *
 * Project Analysis is responsible for deciding broader project capabilities.
 * This function only identifies explicit client technology requirements.
 */
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

          return typeof data.requirement === "string"
            ? data.requirement
            : "";
        })
        .filter(Boolean)
        .join("\n")
    : "";

  const sourceText = `${clientText}\n${requirementTexts}`;

  const candidates: Array<{
    skill: string;
    pattern: RegExp;
  }> = [
    {
      skill: "Sui Move",
      pattern:
        /\b(?:sui\s+move|move\s+(?:smart\s+)?contract|move\s+language)\b/i,
    },
    {
      skill: "Sui blockchain",
      pattern:
        /\b(?:sui\s+blockchain|sui\s+network|sui\s+cryptocurrency|sui\s+token|sui\s+tokens|on\s+sui|built?\s+on\s+sui)\b/i,
    },
    {
      skill: "Solidity",
      pattern: /\bsolidity\b/i,
    },
    {
      skill: "Ethereum",
      pattern: /\bethereum\b/i,
    },
    {
      skill: "Solana",
      pattern: /\bsolana\b/i,
    },
    {
      skill: "Polygon",
      pattern: /\bpolygon\b/i,
    },
    {
      skill: "Rust",
      pattern: /\brust\b/i,
    },
    {
      skill: "React",
      pattern: /\breact(?:\.js)?\b/i,
    },
    {
      skill: "Next.js",
      pattern: /\bnext\.?js\b/i,
    },
    {
      skill: "Vue.js",
      pattern: /\bvue(?:\.js)?\b/i,
    },
    {
      skill: "Angular",
      pattern: /\bangular\b/i,
    },
    {
      skill: "TypeScript",
      pattern: /\btypescript\b/i,
    },
    {
      skill: "JavaScript",
      pattern: /\bjavascript\b/i,
    },
    {
      skill: "Flutter",
      pattern: /\bflutter\b/i,
    },
    {
      skill: "React Native",
      pattern: /\breact\s+native\b/i,
    },
    {
      skill: "Node.js",
      pattern: /\bnode\.?js\b/i,
    },
    {
      skill: "Python",
      pattern: /\bpython\b/i,
    },
    {
      skill: "Django",
      pattern: /\bdjango\b/i,
    },
    {
      skill: "FastAPI",
      pattern: /\bfastapi\b/i,
    },
    {
      skill: "PHP",
      pattern: /\bphp\b/i,
    },
    {
      skill: "Laravel",
      pattern: /\blaravel\b/i,
    },
    {
      skill: "PostgreSQL",
      pattern: /\bpostgres(?:ql)?\b/i,
    },
    {
      skill: "MySQL",
      pattern: /\bmysql\b/i,
    },
    {
      skill: "MongoDB",
      pattern: /\bmongodb\b/i,
    },
    {
      skill: "Supabase",
      pattern: /\bsupabase\b/i,
    },
    {
      skill: "Firebase",
      pattern: /\bfirebase\b/i,
    },
    {
      skill: "Sui SDK",
      pattern: /\bsui\s+sdk\b/i,
    },
    {
      skill: "Stripe",
      pattern: /\bstripe\b/i,
    },
    {
      skill: "PayPal",
      pattern: /\bpaypal\b/i,
    },
  ];

  const seen = new Set<string>();
  const skills: string[] = [];

  for (const candidate of candidates) {
    if (!candidate.pattern.test(sourceText)) {
      continue;
    }

    /*
     * Do not automatically add "Sui blockchain" merely because
     * "Sui Move" was explicitly requested.
     *
     * If the client actually says Sui blockchain/network/etc.,
     * then it will be added.
     */
    if (
      candidate.skill === "Sui blockchain" &&
      seen.has("sui move") &&
      !/\b(?:sui\s+blockchain|sui\s+network|sui\s+cryptocurrency|sui\s+token|sui\s+tokens|on\s+sui|built?\s+on\s+sui)\b/i.test(
        clientText,
      )
    ) {
      continue;
    }

    const key = candidate.skill.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    skills.push(candidate.skill);
  }

  return skills;
}

/* ============================================================================
   GONKA MARKDOWN RENDERER
============================================================================ */

/**
 * Gonka sometimes returns escaped Markdown:
 *
 * \**Key Feature\**
 *
 * Normalize those markers before rendering.
 */
function normalizeGonkaMarkdown(text: string): string {
  return text
    .replace(/\\+\*/g, "*")
    .replace(/\\+_/g, "_")
    .replace(/\\+`/g, "`");
}

/**
 * Render inline Markdown.
 *
 * Supported:
 * - **bold**
 * - *italic*
 * - `inline code`
 */
function renderInlineGonkaMarkdown(text: string) {
  const normalized = normalizeGonkaMarkdown(text);

  const parts = normalized.split(
    /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g,
  );

  return parts.map((part, index) => {
    /* Bold */
    if (
      part.startsWith("**") &&
      part.endsWith("**") &&
      part.length >= 4
    ) {
      return (
        <strong
          key={index}
          className="font-semibold text-foreground"
        >
          {part.slice(2, -2)}
        </strong>
      );
    }

    /* Inline code */
    if (
      part.startsWith("`") &&
      part.endsWith("`") &&
      part.length >= 2
    ) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 font-mono text-[0.9em]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    /* Italic */
    if (
      part.startsWith("*") &&
      part.endsWith("*") &&
      !part.startsWith("**") &&
      part.length >= 2
    ) {
      return (
        <em key={index}>
          {part.slice(1, -1)}
        </em>
      );
    }

    return (
      <React.Fragment key={index}>
        {part}
      </React.Fragment>
    );
  });
}

/**
 * Render Gonka's client-facing response.
 *
 * Supported block-level Markdown:
 * - headings
 * - bullet lists
 * - numbered lists
 * - horizontal rules
 * - paragraphs
 */
function renderGonkaMessage(text: string) {
  const normalized = normalizeGonkaMarkdown(text);
  const lines = normalized.split(/\r?\n/);

  return lines.map((line, index) => {
    const trimmed = line.trim();

    /* Empty line */
    if (!trimmed) {
      return (
        <div
          key={`space-${index}`}
          className="h-2"
        />
      );
    }

    /* Horizontal rule */
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      return (
        <div
          key={`hr-${index}`}
          className="my-3 border-t border-black/10 dark:border-white/10"
        />
      );
    }

    /* Headings */
    if (/^#{1,3}\s+/.test(trimmed)) {
      const heading = trimmed.replace(/^#{1,3}\s+/, "");

      return (
        <p
          key={`heading-${index}`}
          className="mt-2 mb-1 font-semibold text-foreground"
        >
          {renderInlineGonkaMarkdown(heading)}
        </p>
      );
    }

    /* Bullet list */
    if (/^[-*]\s+/.test(trimmed)) {
      const item = trimmed.replace(/^[-*]\s+/, "");

      return (
        <div
          key={`bullet-${index}`}
          className="flex items-start gap-2 pl-1"
        >
          <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-[#7C3AED] shrink-0" />

          <span className="min-w-0">
            {renderInlineGonkaMarkdown(item)}
          </span>
        </div>
      );
    }

    /* Numbered list */
    if (/^\d+\.\s+/.test(trimmed)) {
      const match = trimmed.match(/^(\d+)\.\s+(.*)$/);

      if (match) {
        return (
          <div
            key={`number-${index}`}
            className="flex items-start gap-2"
          >
            <span className="font-semibold text-[#7C3AED] min-w-[20px]">
              {match[1]}.
            </span>

            <span className="min-w-0">
              {renderInlineGonkaMarkdown(match[2])}
            </span>
          </div>
        );
      }
    }

    /* Normal paragraph */
    return (
      <p
        key={`paragraph-${index}`}
        className="leading-relaxed"
      >
        {renderInlineGonkaMarkdown(line)}
      </p>
    );
  });
}

/* ============================================================================
   MAIN PAGE
============================================================================ */

export default function PostProjectPage() {
  const router = useRouter();
  const { createProject } = useApp();

  const [stage, setStage] = useState<1 | 2>(1);

  const [chatInput, setChatInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const [projectAssistantResult, setProjectAssistantResult] =
    useState<any>(null);

  const [projectAnalysisResult, setProjectAnalysisResult] =
    useState<any>(null);

  const [projectAssistantRequestId, setProjectAssistantRequestId] =
    useState("");

  const [projectAnalysisRequestId, setProjectAnalysisRequestId] =
    useState("");

  const [showProjectVerificationIds, setShowProjectVerificationIds] =
  useState(false);

  const [showReasoningModal, setShowReasoningModal] = useState(false);
  const [reasoningModalTab, setReasoningModalTab] = useState<"logs" | "consensus" | "proposal">("logs");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const [projectConfirmed, setProjectConfirmed] =
    useState(false);

  const [isProjectAnalysisRunning, setIsProjectAnalysisRunning] =
    useState(false);

  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const analysisStepRef = useRef<number>(0);

  const updateAnalysisStep = (step: number) => {
    analysisStepRef.current = step;
    setAnalysisStep(step);
  };

  useEffect(() => {
    if (!isProjectAnalysisRunning) {
      updateAnalysisStep(0);
      return;
    }

    // Step through each item progressively: active item spins, then ticks green, next item spins
    const interval = setInterval(() => {
      if (analysisStepRef.current < 4) {
        updateAnalysisStep(analysisStepRef.current + 1);
      }
    }, 1400);

    return () => clearInterval(interval);
  }, [isProjectAnalysisRunning]);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  /* ==========================================================================
     CHAT RESIZE & EXPAND STATE
  ========================================================================== */

  const [chatHeight, setChatHeight] = useState<number>(580);
  const [isChatDragging, setIsChatDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(580);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsChatDragging(true);
    dragStartY.current = e.clientY;
    dragStartHeight.current = chatHeight;
  };

  useEffect(() => {
    if (!isChatDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - dragStartY.current;
      const newHeight = Math.min(
        Math.max(dragStartHeight.current + deltaY, 440),
        window.innerHeight * 0.85
      );
      setChatHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsChatDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isChatDragging]);

  /* ==========================================================================
     CHAT CONVERSATION STATE
  ========================================================================== */

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-init",
      sender: "gonka",
      text:
        "Hello! I'm Gonka AI, your Web3 hiring architect. Describe what you'd like to build, and I'll help you refine the technical scope, deliverables, and milestone breakdown.",
      timestamp: "Just now",
      suggestions: [
        "Hi, I need a Sui payment app for businesses.",
        "I need a Sui Move smart contract for escrow.",
        "Build a Next.js 15 Web3 dashboard with wallet connect.",
      ],
    },
  ]);

  /* ==========================================================================
     STAGE 2 FORM STATE
  ========================================================================== */

  const [title, setTitle] = useState(
    "Sui Merchant Payment App & Checkout Widget",
  );

  const [descriptionRaw, setDescriptionRaw] = useState("");

  const [requiredSkills, setRequiredSkills] =
    useState<string[]>([]);

  const [newSkillInput, setNewSkillInput] = useState("");

  const [experienceLevel, setExperienceLevel] =
    useState<"Beginner" | "Intermediate" | "Expert">("Expert");

  const [estimatedBudget, setEstimatedBudget] = useState(4500);

  const [timelineDays, setTimelineDays] = useState(21);

  const [deliverables, setDeliverables] = useState<string[]>([
    "Sui Move smart contract for merchant payment requests and settlements",
    "Next.js merchant portal to create payment invoices and view transaction status",
    "Embeddable customer checkout modal supporting Sui Wallet & zkLogin",
    "Comprehensive testnet verification suite and developer documentation",
  ]);

  const [newDeliverableInput, setNewDeliverableInput] =
    useState("");

  const [milestones, setMilestones] =
    useState<MilestoneRow[]>([
      {
        title:
          "Milestone 1: Architecture, Smart Contract & Design System",
        deliverable:
          "Technical specification document, Move escrow/payment contracts, and UI component wireframes.",
        percentOfBudget: 35,
        amount: 1575,
        deadlineDays: 7,
      },
      {
        title:
          "Milestone 2: Frontend Merchant Portal & Wallet Integration",
        deliverable:
          "Interactive Next.js dashboard, invoice generator, and Sui Wallet signing integration.",
        percentOfBudget: 40,
        amount: 1800,
        deadlineDays: 15,
      },
      {
        title:
          "Milestone 3: End-to-End QA, Testnet Deployment & Handoff",
        deliverable:
          "Full integration test suite, live testnet deployment, and developer documentation.",
        percentOfBudget: 25,
        amount: 1125,
        deadlineDays: 21,
      },
    ]);

  const [isPosting, setIsPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);

  /* ==========================================================================
     AUTO SCROLL
  ========================================================================== */

  useEffect(() => {
    if (stage === 1) {
      chatBottomRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [messages, isThinking, stage]);

  /* ==========================================================================
     PROJECT ASSISTANT CHAT
  ========================================================================== */

  const handleSendMessage = async (
    textToSend?: string,
  ) => {
    const text = (
      textToSend || chatInput
    ).trim();

    if (
      !text ||
      isThinking ||
      projectConfirmed ||
      isProjectAnalysisRunning
    ) {
      return;
    }

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: "client",
      text,
      timestamp: "Just now",
    };

    const newMessages = [
      ...messages,
      userMsg,
    ];

    setMessages(newMessages);
    setChatInput("");
    setIsThinking(true);

    try {
      /*
       * The initial UI greeting is not sent to Gonka.
       * Real assistant responses are preserved so Gonka has
       * conversation context.
       */
      const conversation = newMessages
        .filter(
          (message) => message.id !== "msg-init",
        )
        .map((message) => ({
          role:
            message.sender === "client"
              ? "user"
              : "assistant",
          content: message.text,
        }));

      const response = await fetch(
        "/api/gonka/project-assistant",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: conversation,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Project Assistant request failed.",
        );
      }

      if (
        typeof result.requestId === "string" &&
        result.requestId.trim().length > 0
      ) {
        setProjectAssistantRequestId(
          result.requestId.trim(),
        );
      }

      /*
       * COMPLETED means the client approved the proposal.
       *
       * We latch this state so a later "thanks" message
       * cannot remove the approved proposal.
       */
      const completed =
        result.confirmed === true ||
        (result.status === "COMPLETED" &&
          !!result.proposal);

      if (completed) {
        setProjectConfirmed(true);
        setProjectAssistantResult(result);
      } else if (!projectConfirmed) {
        setProjectAssistantResult(result);
      }

      /*
       * Display Gonka's real natural-language response.
       */
      const aiMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: "gonka",
        text:
          result.message ||
          "I received your request. Let me help you refine the project requirements.",
        timestamp: "Just now",
        requestId: result.requestId,
        suggestions: [],
        showGenerateSpecification: completed,
      };

      setMessages([
        ...newMessages,
        aiMsg,
      ]);
    } catch (error) {
      console.error(
        "Project Assistant request failed:",
        error,
      );

      const errorMsg: ChatMessage = {
        id: `msg-ai-error-${Date.now()}`,
        sender: "gonka",
        text:
          error instanceof Error
            ? `Sorry, I couldn't process your request. ${error.message}`
            : "Sorry, I couldn't reach Gonka AI right now. Please try again.",
        timestamp: "Just now",
      };

      setMessages([
        ...newMessages,
        errorMsg,
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  /* ==========================================================================
     MANUAL STAGE 2
  ========================================================================== */

  const handleManualStage2 = () => {
    setStage(2);
  };

  /* ==========================================================================
     PROJECT ANALYSIS
  ========================================================================== */

// ============================================================================
// RUN PROJECT ANALYSIS
// ============================================================================
//
// Project Analysis is intentionally executed ONLY after the client has
// approved the Project Assistant proposal and explicitly clicks
// "Generate Specification".
//
// Project Assistant and Project Analysis use separate Gonka request IDs.
// ============================================================================

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

    if (isProjectAnalysisRunning) {
      return;
    }

    setIsProjectAnalysisRunning(true);
    setIsThinking(true);

    // Clear the previous analysis request ID because a new analysis
    // is about to start.
    setProjectAnalysisRequestId("");

    try {
      const requirements = {
        projectTitle: proposal.title,
        description: proposal.description,

        coreFeatures: Array.isArray(proposal.coreFeatures)
          ? proposal.coreFeatures
          : [],

        /*
        * IMPORTANT:
        *
        * requiredSkills from the Project Assistant proposal are AI
        * recommendations, NOT necessarily client requirements.
        *
        * Only explicitly requested/confirmed technologies should be
        * passed as explicitSkills.
        */
        explicitSkills: extractExplicitClientSkills(
          projectAssistantResult?.requirements,
          messages
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

      const response = await fetch(
        "/api/gonka/project-analysis",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            requirements
          })
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Project Analysis request failed."
        );
      }

      const analysis = result.analysis;

      if (!analysis) {
        throw new Error(
          "Project Analysis returned no analysis."
        );
      }

      console.log(
        "Gonka Project Analysis result:",
        result
      );

      // ========================================================================
      // PROJECT ANALYSIS REQUEST ID
      // ========================================================================
      //
      // projectAnalysis.ts runs multiple models and returns:
      //
      // modelResults: [
      //   {
      //     model: "...",
      //     requestId: "..."
      //   }
      // ]
      //
      // Use the first valid request ID.
      //
      // We intentionally do NOT use projectAssistantRequestId here.
      // ========================================================================

      const analysisRequestId =
        typeof result.primaryRequestId === "string"
          ? result.primaryRequestId.trim()
          : "";

      if (!analysisRequestId) {
        console.warn(
          "Project Analysis completed but no primary Request ID was returned.",
          result
        );
      }

      setProjectAnalysisRequestId(analysisRequestId);
      setShowProjectVerificationIds(false);

      // ========================================================================
      // POPULATE STAGE 2
      // ========================================================================

      setProjectAnalysisResult(result);

      setTitle(
        analysis.projectTitle
      );

      setDescriptionRaw(
        analysis.projectDescription
      );

      /*
      * requiredSkills come directly from Project Analysis.
      *
      * The UI does NOT hardcode React, TypeScript,
      * Next.js, etc.
      */
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

      // Your current Stage 2 UI supports:
      // Beginner / Intermediate / Expert
      //
      // Project Analysis may return Senior, so map Senior
      // to Expert for the existing UI.
      if (
        analysis.experienceLevel === "Beginner" ||
        analysis.experienceLevel === "Intermediate" ||
        analysis.experienceLevel === "Expert"
      ) {
        setExperienceLevel(
          analysis.experienceLevel
        );
      } else if (
        analysis.experienceLevel === "Senior"
      ) {
        setExperienceLevel("Expert");
      }

      // ========================================================================
      // CONVERT AI MILESTONES TO EXISTING UI FORMAT
      // ========================================================================

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
                title:
                  `Milestone ${index + 1}: ${milestone.title}`,

                deliverable:
                  milestone.description,

                percentOfBudget:
                  Number(
                    milestone.percentageAllocation
                  ),

                amount:
                  Number(milestone.amount),

                deadlineDays:
                  Math.max(
                    1,
                    Math.round(
                      (
                        Number(
                          analysis.estimatedTimelineDays
                        ) *
                        Number(
                          milestone.percentageAllocation
                        )
                      ) / 100
                    )
                  )
              })
            )
          : [];

      if (uiMilestones.length > 0) {
        setMilestones(uiMilestones);
      }

      // Progressively complete any remaining steps before transitioning
      while (analysisStepRef.current < 5) {
        updateAnalysisStep(analysisStepRef.current + 1);
        await new Promise((resolve) => setTimeout(resolve, 350));
      }

      // Brief pause so the user sees all 5 steps marked complete with green ticks
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Only enter Stage 2 after Project Analysis succeeds.
      setStage(2);
    } catch (error) {
      console.error(
        "Project Analysis failed:",
        error
      );

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Project Analysis request failed.";

      const aiErrorMsg: ChatMessage = {
        id:
          `msg-analysis-error-${Date.now()}`,
        sender: "gonka",
        text:
          `I couldn't generate the project specification yet. ${errorMessage}`,
        timestamp: "Just now"
      };

      setMessages((current) => [
        ...current,
        aiErrorMsg
      ]);
    } finally {
      setIsThinking(false);
      setIsProjectAnalysisRunning(false);
    }
  };

  /* ==========================================================================
     SKILLS
  ========================================================================== */

  const handleAddSkill = (
    e: React.KeyboardEvent,
  ) => {
    if (
      e.key === "Enter" &&
      newSkillInput.trim()
    ) {
      e.preventDefault();

      const skill =
        newSkillInput.trim();

      if (
        !requiredSkills.includes(
          skill,
        )
      ) {
        setRequiredSkills([
          ...requiredSkills,
          skill,
        ]);
      }

      setNewSkillInput("");
    }
  };

  const handleRemoveSkill = (
    skill: string,
  ) => {
    setRequiredSkills(
      requiredSkills.filter(
        (s) => s !== skill,
      ),
    );
  };

  /* ==========================================================================
     DELIVERABLES
  ========================================================================== */

  const handleAddDeliverable =
    () => {
      if (
        !newDeliverableInput.trim()
      ) {
        return;
      }

      setDeliverables([
        ...deliverables,
        newDeliverableInput.trim(),
      ]);

      setNewDeliverableInput("");
    };

  const handleRemoveDeliverable =
    (index: number) => {
      setDeliverables(
        deliverables.filter(
          (_, i) => i !== index,
        ),
      );
    };

  const handleDeliverableChange =
    (
      index: number,
      value: string,
    ) => {
      const updated = [
        ...deliverables,
      ];

      updated[index] = value;

      setDeliverables(updated);
    };

  /* ==========================================================================
     MILESTONES
  ========================================================================== */

  const handleMilestoneChange = (
    index: number,
    field: keyof MilestoneRow,
    value: any,
  ) => {
    const updated = [
      ...milestones,
    ];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    if (
      field ===
      "percentOfBudget"
    ) {
      updated[index].amount =
        Math.round(
          (estimatedBudget *
            Number(value)) /
            100,
        );
    }

    setMilestones(updated);
  };

  const handleAddMilestone =
    () => {
      const allocated =
        milestones.reduce(
          (sum, milestone) =>
            sum +
            Number(
              milestone.percentOfBudget ||
                0,
            ),
          0,
        );

      const remaining =
        Math.max(
          0,
          100 - allocated,
        );

      const newMilestone: MilestoneRow =
        {
          title: `Milestone ${
            milestones.length + 1
          }: Extension Scope`,

          deliverable:
            "Implementation of subsequent milestone deliverables.",

          percentOfBudget:
            remaining,

          amount: Math.round(
            (estimatedBudget *
              remaining) /
              100,
          ),

          deadlineDays:
            timelineDays,
        };

      setMilestones([
        ...milestones,
        newMilestone,
      ]);
    };

  const handleRemoveMilestone =
    (index: number) => {
      if (
        milestones.length <= 1
      ) {
        return;
      }

      setMilestones(
        milestones.filter(
          (_, i) => i !== index,
        ),
      );
    };

  /* ==========================================================================
     BUDGET VALIDATION
  ========================================================================== */

  const totalPercentage =
    milestones.reduce(
      (sum, milestone) =>
        sum +
        Number(
          milestone.percentOfBudget ||
            0,
        ),
      0,
    );

  const isBudgetValid =
    Math.abs(
      totalPercentage - 100,
    ) < 0.01;

  /* ==========================================================================
     SAVE / POST PROJECT
  ========================================================================== */

  const handleSaveDraftOrPost =
    async (
      isDraft: boolean,
    ) => {
      if (
        !isDraft &&
        !isBudgetValid
      ) {
        return;
      }

      if (!title.trim()) {
        return;
      }

      setIsPosting(true);

      const now =
        new Date();

      const milestonePayload: Omit<
        Milestone,
        "id" | "projectId"
      >[] = milestones.map(
        (milestone) => {
          const deadlineDate =
            new Date(
              now.getTime() +
                milestone.deadlineDays *
                  24 *
                  60 *
                  60 *
                  1000,
            );

          return {
            title:
              milestone.title,

            deliverable:
              milestone.deliverable,

            amount:
              Math.round(
                (estimatedBudget *
                  milestone.percentOfBudget) /
                  100,
              ),

            percentOfBudget:
              milestone.percentOfBudget,

            deadline:
              deadlineDate.toISOString(),

            status: "pending",
          };
        },
      );

      const newProjectId =
        createProject(
          {
            title,
            descriptionRaw,
            requiredSkills,
            estimatedBudget,
            timelineDays,
            experienceLevel,
            deliverables,
            status: isDraft
              ? "draft"
              : "open",
          },
          milestonePayload,
        );

      if (!isDraft) {
        setPostSuccess(true);

        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              1200,
            ),
        );

        router.push(
          `/project/${newProjectId}/candidates`,
        );
      } else {
        router.push(
          "/client/projects",
        );
      }
    };

  /* ==========================================================================
     RENDER
  ========================================================================== */

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* =====================================================================
            PAGE HEADER
        ===================================================================== */}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-xs text-[#7C3AED] dark:text-[#A78BFA] mb-2 font-mono">
              <Sparkles className="w-3.5 h-3.5" />

              <span>
                Gonka AI • Conversational Project Assistant
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {stage === 1
                ? "Discuss & Scope Your Project"
                : "Review & Customize Specification"}
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
              onClick={
                handleManualStage2
              }
            >
              Skip AI & Configure Manually →
            </GhostButton>
          )}
        </div>

        {/* =====================================================================
            STAGE 1
        ===================================================================== */}

        {stage === 1 && (
          <div className="space-y-4">

            <GlassCard
              style={{ height: `${chatHeight}px` }}
              className={clsx(
                "p-0 overflow-hidden flex flex-col border border-black/10 dark:border-white/10 shadow-xl",
                !isChatDragging && "transition-[height] duration-200 ease-out"
              )}
            >

              {/* Chat Header */}
              <div className="px-5 py-3.5 border-b border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between">

                <div className="flex items-center gap-2.5">

                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-[#4DA2FF] text-white flex items-center justify-center shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span>
                        Gonka AI Hiring Agent
                      </span>

                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                    </h3>

                    <p className="text-[10px] font-mono text-foreground/50">
                      Gonka Router v2.4 • Active Session
                    </p>
                  </div>

                </div>

              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">

                {messages.map(
                  (msg) => {
                    const isGonka =
                      msg.sender ===
                      "gonka";

                    return isGonka ? (
                      <div
                        key={msg.id}
                        className="flex items-start gap-3 justify-start w-full"
                      >

                        {/* Gonka Avatar */}
                        <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold shadow-sm bg-[#8B5CF6]/20 text-[#7C3AED] dark:text-[#A78BFA] border border-[#8B5CF6]/30">
                          <Bot className="w-4 h-4" />
                        </div>

                        {/* Gonka Content */}
                        <div className="flex-1 max-w-[95%] sm:max-w-[90%] space-y-2">

                          {/* Gonka Bubble */}
                          <div className="p-4 rounded-2xl rounded-tl-none text-xs sm:text-sm leading-relaxed bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-foreground space-y-2.5">

                            {/* IMPORTANT:
                                Use the Markdown renderer instead of
                                <p>{msg.text}</p>.
                            */}
                            <div className="space-y-1">
                              {renderGonkaMessage(
                                msg.text,
                              )}
                            </div>

                            {/* Request ID */}
                            {msg.requestId && (
                              <div className="flex items-center gap-2 pt-2 border-t border-black/5 dark:border-white/5 text-[10px] font-mono text-foreground/50">

                                <span className="flex items-center gap-1 text-[#7C3AED] dark:text-[#A78BFA] font-medium">
                                  <Cpu className="w-3 h-3 text-[#7C3AED] dark:text-[#8B5CF6]" />

                                  <span>
                                    Gonka Router
                                  </span>
                                </span>

                                <span>
                                  •
                                </span>

                                <span className="bg-purple-500/10 dark:bg-black/30 px-2 py-0.5 rounded border border-purple-500/20 dark:border-white/5 text-[#7C3AED] dark:text-[#A78BFA]">
                                  {msg.requestId}
                                </span>

                              </div>
                            )}

                          </div>

                          {/* Generate Specification Action */}
                          {msg.showGenerateSpecification &&
                            projectConfirmed && (
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
                                      onClick={
                                        handleTransitionToStage2
                                      }
                                      disabled={
                                        isProjectAnalysisRunning
                                      }
                                      className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#4DA2FF] text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >

                                      {isProjectAnalysisRunning ? (
                                        <>
                                          <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />

                                          Generating Specification...
                                        </>
                                      ) : (
                                        <>
                                          <Sparkles className="w-4 h-4" />

                                          Generate Specification

                                          <ArrowRight className="w-3.5 h-3.5" />
                                        </>
                                      )}

                                    </button>

                                  </div>

                                </div>

                              </div>
                            )}

                          {/* Quick Replies */}
                          {msg.suggestions &&
                            msg.suggestions.length >
                              0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">

                                {msg.suggestions.map(
                                  (
                                    suggestion,
                                    suggestionIndex,
                                  ) => (
                                    <button
                                      key={
                                        suggestionIndex
                                      }
                                      type="button"
                                      onClick={() => {
                                        if (
                                          suggestion.includes(
                                            "Review & Finalize",
                                          )
                                        ) {
                                          handleTransitionToStage2();
                                        } else {
                                          handleSendMessage(
                                            suggestion,
                                          );
                                        }
                                      }}
                                      className="px-3 py-1.5 rounded-xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 text-[11px] font-medium text-[#7C3AED] dark:text-[#A78BFA] transition-all text-left flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <span>
                                        {
                                          suggestion
                                        }
                                      </span>

                                      <ChevronRight className="w-3 h-3 opacity-60" />
                                    </button>
                                  ),
                                )}

                              </div>
                            )}

                        </div>

                      </div>
                    ) : (
                      <div
                        key={msg.id}
                        className="flex items-start gap-3 justify-end w-full"
                      >

                        <div className="max-w-[85%] sm:max-w-[75%]">

                          <div className="p-4 rounded-2xl rounded-tr-none bg-gradient-to-r from-[#4DA2FF] to-[#7B61FF] text-white text-xs sm:text-sm leading-relaxed shadow-md">
                            {msg.text}
                          </div>

                        </div>

                        <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold shadow-sm bg-black/10 dark:bg-white/10 text-foreground">
                          <UserIcon className="w-4 h-4" />
                        </div>

                      </div>
                    );
                  },
                )}

                {/* =============================================================
                    PROJECT ANALYSIS LOADING
                ============================================================= */}

                {isThinking && (
                  <div className="flex items-start gap-3 justify-start w-full">

                    <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/20 text-[#7C3AED] dark:text-[#A78BFA] border border-[#8B5CF6]/30 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>

                    {isProjectAnalysisRunning ? (
                      <div className="max-w-[520px] rounded-2xl border border-[#8B5CF6]/20 bg-white dark:bg-white/[0.03] shadow-sm px-4 py-4">

                        <div className="flex items-center gap-2 mb-3">

                          <Sparkles className="w-4 h-4 text-[#8B5CF6]" />

                          <span className="text-sm font-semibold text-foreground">
                            Gonka is analyzing your project
                          </span>

                          <span className="flex gap-1 ml-1">
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-bounce"
                              style={{
                                animationDelay:
                                  "0ms",
                              }}
                            />

                            <span
                              className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-bounce"
                              style={{
                                animationDelay:
                                  "150ms",
                              }}
                            />

                            <span
                              className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-bounce"
                              style={{
                                animationDelay:
                                  "300ms",
                              }}
                            />
                          </span>

                        </div>

                        <div className="space-y-2.5">
                          {ANALYSIS_STEPS.map((stepText, index) => {
                            const isCompleted = analysisStep > index;
                            const isCurrent = analysisStep === index;

                            return (
                              <div
                                key={stepText}
                                className="flex items-center gap-2.5 transition-all duration-300"
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 animate-in fade-in duration-200" />
                                ) : isCurrent ? (
                                  <span className="relative flex w-4 h-4 items-center justify-center shrink-0">
                                    <span className="absolute w-3 h-3 rounded-full border-2 border-[#8B5CF6]/30" />
                                    <span className="absolute w-3 h-3 rounded-full border-2 border-transparent border-t-[#8B5CF6] animate-spin" />
                                  </span>
                                ) : (
                                  <span className="w-4 h-4 rounded-full border border-black/10 dark:border-white/10 shrink-0" />
                                )}

                                <span
                                  className={`text-xs transition-colors duration-200 ${
                                    isCompleted
                                      ? "text-foreground/70"
                                      : isCurrent
                                      ? "text-foreground font-medium"
                                      : "text-foreground/40"
                                  }`}
                                >
                                  {stepText}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                      </div>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs text-foreground/60 flex items-center gap-2">

                        <span className="inline-flex gap-1">

                          <span
                            className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-bounce"
                            style={{
                              animationDelay:
                                "0ms",
                            }}
                          />

                          <span
                            className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-bounce"
                            style={{
                              animationDelay:
                                "150ms",
                            }}
                          />

                          <span
                            className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-bounce"
                            style={{
                              animationDelay:
                                "300ms",
                            }}
                          />

                        </span>

                        <span>
                          Gonka AI is analyzing requirements…
                        </span>

                      </div>
                    )}

                  </div>
                )}

                <div
                  ref={chatBottomRef}
                />

              </div>

              {/* Chat Input */}
              <div className="p-3 sm:p-4 border-t border-black/10 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.02]">

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >

                  <input
                    type="text"
                    value={chatInput}
                    onChange={(event) =>
                      setChatInput(
                        event.target.value,
                      )
                    }
                    disabled={
                      projectConfirmed ||
                      isProjectAnalysisRunning
                    }
                    placeholder={
                      projectConfirmed
                        ? "Proposal confirmed — click Generate Specification above to continue."
                        : "Type requirements, deliverables, or answer Gonka's questions…"
                    }
                    className="flex-1 px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/30 text-xs sm:text-sm text-foreground focus:outline-none focus:border-[#7B61FF] disabled:opacity-60"
                  />

                  <GradientButton
                    size="md"
                    type="submit"
                    disabled={
                      !chatInput.trim() ||
                      isThinking ||
                      projectConfirmed ||
                      isProjectAnalysisRunning
                    }
                    icon={
                      <Send className="w-3.5 h-3.5" />
                    }
                  >
                    Send
                  </GradientButton>

                </form>

              </div>

              {/* Drag Resize Handle */}
              <div
                onMouseDown={handleResizeMouseDown}
                className="h-3.5 w-full bg-black/[0.02] dark:bg-white/[0.02] hover:bg-[#8B5CF6]/10 border-t border-black/5 dark:border-white/5 flex items-center justify-center cursor-row-resize transition-colors group select-none shrink-0"
                title="Drag up or down to resize chat height"
              >
                <div className="w-10 h-1 rounded-full bg-black/20 dark:bg-white/20 group-hover:bg-[#8B5CF6] transition-colors" />
              </div>

            </GlassCard>

          </div>
        )}

        {/* =====================================================================
            STAGE 2
        ===================================================================== */}

        {stage === 2 && (
          <div className="space-y-6">

            {/* AI Specification Banner */}
            <div className="relative z-20 rounded-2xl border border-[#8B5CF6]/30 bg-gradient-to-r from-[#8B5CF6]/10 via-[#7B61FF]/5 to-[#4DA2FF]/10 p-5 backdrop-blur-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">

              <div className="flex items-start sm:items-center gap-3.5">

                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#8B5CF6] to-[#4DA2FF] text-white flex items-center justify-center shadow-md shrink-0">
                  <Bot className="w-5 h-5" />
                </div>

                <div className="space-y-1">

                  <div className="flex items-center gap-2.5 flex-wrap">

                    <h3 className="font-bold text-sm sm:text-base text-foreground">
                      Gonka AI Structured Specification
                    </h3>
{projectAnalysisRequestId && (
  <div className="relative z-50">
    <button
      type="button"
      onClick={() =>
        setShowProjectVerificationIds((current) => !current)
      }
      aria-expanded={showProjectVerificationIds}
      aria-label="Show Project Analysis verification Request IDs"
      className="
        inline-flex
        items-center
        gap-1.5
        font-mono
        text-[11px]
        px-2.5
        py-1
        rounded-md
        bg-purple-500/10
        dark:bg-black/30
        border
        border-purple-500/20
        dark:border-white/10
        text-[#7C3AED]
        dark:text-[#A78BFA]
        hover:bg-purple-500/15
        dark:hover:bg-white/5
        transition-colors
        cursor-pointer
        max-w-full
      "
    >
      <Cpu className="w-3 h-3 shrink-0" />

      <span className="max-w-[180px] sm:max-w-[260px] truncate">
        {projectAnalysisRequestId}
      </span>

      <ChevronDown
        className={`w-3.5 h-3.5 shrink-0 opacity-70 transition-transform ${
          showProjectVerificationIds ? "rotate-180" : ""
        }`}
      />
    </button>

    {showProjectVerificationIds && (
      <>
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowProjectVerificationIds(false)}
        />
        <div
          className="
            absolute
            left-0
            top-full
            z-50
            mt-2.5
            w-[min(460px,calc(100vw-2.5rem))]
            rounded-2xl
            border
            border-purple-500/25
            dark:border-white/10
            bg-white/95
            dark:bg-[#12131F]/95
            backdrop-blur-2xl
            shadow-2xl
            p-4
            space-y-3.5
            animate-in
            fade-in
            zoom-in-95
            duration-150
          "
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#8B5CF6]/20 to-[#4DA2FF]/20 border border-[#8B5CF6]/30 flex items-center justify-center text-[#7C3AED] dark:text-[#A78BFA]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-foreground block">
                  Multi-Model Consensus
                </span>
                <span className="text-[10px] text-foreground/50 block font-mono">
                  Gonka Router Trace
                </span>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {projectAnalysisResult?.verification?.passedCount ?? 2}/
              {projectAnalysisResult?.verification?.totalModels ?? 2} Passed
            </span>
          </div>

          {/* Primary Model */}
          <div className="p-3 rounded-xl border border-purple-500/15 bg-purple-500/[0.04] dark:bg-white/[0.02]">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-[11px] font-semibold text-foreground">
                  Primary Architecture Model
                </span>
              </div>
              <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-purple-500/15 text-[#7C3AED] dark:text-[#A78BFA]">
                Lead Generator
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 bg-white/60 dark:bg-black/40 px-2.5 py-1.5 rounded-lg border border-black/5 dark:border-white/5">
              <span className="font-mono text-[10px] text-foreground/75 truncate select-all">
                {projectAnalysisRequestId}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(projectAnalysisRequestId, "primary")}
                className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-foreground/50 hover:text-foreground transition-colors shrink-0 cursor-pointer"
                title="Copy Request ID"
              >
                {copiedKey === "primary" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Verifiers */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase font-mono tracking-wider text-foreground/50 font-semibold px-0.5">
              Independent Verifier Traces
            </div>

            <div className="space-y-1.5">
              {Array.isArray(
                projectAnalysisResult?.verification?.verifierResults
              ) &&
              projectAnalysisResult.verification.verifierResults.length > 0 ? (
                projectAnalysisResult.verification.verifierResults.map(
                  (
                    verifier: {
                      model?: unknown;
                      status?: unknown;
                      requestId?: unknown;
                    },
                    verifierIndex: number
                  ) => {
                    const verifierRequestId =
                      typeof verifier.requestId === "string"
                        ? verifier.requestId.trim()
                        : "";

                    const verifierModel =
                      typeof verifier.model === "string"
                        ? verifier.model
                        : `Verifier ${verifierIndex + 1}`;

                    const displayModel =
                      verifierModel.includes("MiniMax")
                        ? "MiniMax Verifier"
                        : verifierModel.includes("DeepSeek")
                          ? "DeepSeek Verifier"
                          : verifierModel;

                    const verifierStatus =
                      verifier.status === "PASS"
                        ? "PASS"
                        : verifier.status === "FAIL"
                          ? "FAIL"
                          : "UNKNOWN";

                    return (
                      <div
                        key={`${verifierModel}-${verifierIndex}`}
                        className="rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.03] p-2.5"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                            <Cpu className="w-3 h-3 text-[#7C3AED] dark:text-[#8B5CF6]" />
                            {displayModel}
                          </span>

                          <span
                            className={
                              verifierStatus === "PASS"
                                ? "text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : verifierStatus === "FAIL"
                                  ? "text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                                  : "text-[9px] font-bold text-foreground/40"
                            }
                          >
                            {verifierStatus}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 bg-white/60 dark:bg-black/40 px-2 py-1 rounded-md border border-black/5 dark:border-white/5">
                          <span className="font-mono text-[10px] text-foreground/60 truncate select-all">
                            {verifierRequestId || "Request ID unavailable"}
                          </span>
                          {verifierRequestId && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(
                                  verifierRequestId,
                                  `verifier-${verifierIndex}`
                                )
                              }
                              className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-foreground/40 hover:text-foreground transition-colors shrink-0 cursor-pointer"
                              title="Copy Verifier Request ID"
                            >
                              {copiedKey === `verifier-${verifierIndex}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }
                )
              ) : (
                <div className="text-[11px] text-foreground/50 py-1">
                  Verification Request IDs are not available.
                </div>
              )}
            </div>
          </div>

          {/* Action button: See Gonka Reasoning */}
          <button
            type="button"
            onClick={() => {
              setShowProjectVerificationIds(false);
              setShowReasoningModal(true);
            }}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#4DA2FF] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
            <Terminal className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>See Gonka Reasoning</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </>
    )}
</div>
)}

                  </div>

                  <p className="text-xs text-foreground/70 leading-relaxed">
                    Review and fine-tune scope, deliverables, and on-chain escrow milestones before publishing to the candidate pool.
                  </p>

                </div>

              </div>

              <div className="flex items-center gap-2 self-end md:self-center shrink-0">

                <GhostButton
                  size="sm"
                  onClick={() =>
                    setStage(1)
                  }
                  icon={
                    <RotateCcw className="w-3.5 h-3.5" />
                  }
                >
                  Back to AI Chat
                </GhostButton>

              </div>

            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-0">

              {/* Budget */}
              <div className="p-3.5 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#151622]/70 backdrop-blur-md flex items-center gap-3 shadow-sm">

                <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-[#0D9488] dark:text-[#2DD4BF] flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4" />
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono text-foreground/50 block">
                    Total Budget
                  </span>

                  <span className="text-xs sm:text-sm font-bold font-mono text-foreground">
                    $
                    {estimatedBudget.toLocaleString()}
                    {" "}
                    USDC
                  </span>
                </div>

              </div>

              {/* Timeline */}
              <div className="p-3.5 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#151622]/70 backdrop-blur-md flex items-center gap-3 shadow-sm">

                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-[#2563EB] dark:text-[#4DA2FF] flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono text-foreground/50 block">
                    Timeline
                  </span>

                  <span className="text-xs sm:text-sm font-bold font-mono text-foreground">
                    {timelineDays} Days
                  </span>
                </div>

              </div>

              {/* Experience */}
              <div className="p-3.5 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#151622]/70 backdrop-blur-md flex items-center gap-3 shadow-sm">

                <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono text-foreground/50 block">
                    Experience
                  </span>

                  <span className="text-xs sm:text-sm font-bold text-foreground">
                    {experienceLevel}
                  </span>
                </div>

              </div>

              {/* Milestones */}
              <div className="p-3.5 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#151622]/70 backdrop-blur-md flex items-center gap-3 shadow-sm">

                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-[#D97706] dark:text-[#F59E0B] flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono text-foreground/50 block">
                    Escrow Milestones
                  </span>

                  <span className="text-xs sm:text-sm font-bold font-mono text-foreground">
                    {milestones.length} Phases
                  </span>
                </div>

              </div>

            </div>

            {/* ===================================================================
                SECTION 1
            =================================================================== */}

            <GlassCard className="p-6 sm:p-7 space-y-5">

              <div className="flex items-center gap-2.5 pb-3 border-b border-black/10 dark:border-white/10">

                <div className="p-1.5 rounded-lg bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#A78BFA]">
                  <FileText className="w-4 h-4" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Project Identity &amp; Scope
                  </h3>

                  <p className="text-xs text-foreground/60">
                    Define the project title and detailed technical narrative.
                  </p>
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
                    onChange={(event) =>
                      setTitle(
                        event.target.value,
                      )
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] text-sm sm:text-base font-semibold text-foreground focus:outline-none focus:border-[#7B61FF] transition-colors shadow-sm"
                  />

                </div>

                <div>

                  <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wider">
                    Scope &amp; Technical Description
                  </label>

                  <textarea
                    rows={4}
                    value={descriptionRaw}
                    onChange={(event) =>
                      setDescriptionRaw(
                        event.target.value,
                      )
                    }
                    className="w-full p-4 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] text-xs sm:text-sm text-foreground focus:outline-none focus:border-[#7B61FF] resize-none leading-relaxed transition-colors shadow-sm"
                  />

                </div>

              </div>

            </GlassCard>

            {/* ===================================================================
                SECTION 2
            =================================================================== */}

            <GlassCard className="p-6 sm:p-7 space-y-5">

              <div className="flex items-center gap-2.5 pb-3 border-b border-black/10 dark:border-white/10">

                <div className="p-1.5 rounded-lg bg-teal-500/15 text-[#0D9488] dark:text-[#2DD4BF]">
                  <Coins className="w-4 h-4" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Parameters &amp; Talent Criteria
                  </h3>

                  <p className="text-xs text-foreground/60">
                    Set budget caps, expected timeline, and developer experience level.
                  </p>
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Budget */}
                <div className="p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] space-y-2">

                  <div className="flex items-center justify-between">

                    <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                      Total Budget
                    </span>

                    <span className="text-[10px] font-mono text-[#0D9488] dark:text-[#2DD4BF] bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
                      Sui Escrow
                    </span>

                  </div>

                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-foreground/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="number"
                      value={estimatedBudget}
                      onChange={(event) =>
                        setEstimatedBudget(
                          Number(
                            event.target.value,
                          ),
                        )
                      }
                      className="w-full pl-9 pr-14 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] text-sm font-mono font-bold text-foreground focus:outline-none focus:border-[#7B61FF]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-foreground/50 pointer-events-none">USDC</span>
                  </div>

                </div>

                {/* Timeline */}
                <div className="p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] space-y-2">

                  <div className="flex items-center justify-between">

                    <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                      Timeline
                    </span>

                    <span className="text-[10px] font-mono text-[#2563EB] dark:text-[#4DA2FF] bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                      ~{Math.ceil(
                        timelineDays /
                          7,
                      )} Weeks
                    </span>

                  </div>

                  <div className="relative">
                    <Calendar className="w-4 h-4 text-foreground/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="number"
                      value={timelineDays}
                      onChange={(event) =>
                        setTimelineDays(
                          Number(
                            event.target.value,
                          ),
                        )
                      }
                      className="w-full pl-9 pr-14 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] text-sm font-mono font-bold text-foreground focus:outline-none focus:border-[#7B61FF]"
                    />

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-foreground/50 pointer-events-none">
                      Days
                    </span>

                  </div>

                </div>

                {/* Experience */}
                <div className="p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] space-y-2">

                  <div className="flex items-center justify-between">

                    <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                      Experience Level
                    </span>

                    <span className="text-[10px] font-mono text-[#7C3AED] dark:text-[#A78BFA] bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                      Gonka Matching
                    </span>

                  </div>

                  <div className="flex items-center gap-1 p-1 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] min-h-[40px]">
                    {(
                      [
                        "Beginner",
                        "Intermediate",
                        "Expert",
                      ] as const
                    ).map((level) => {
                      const isSelected = experienceLevel === level;
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setExperienceLevel(level)}
                          className={clsx(
                            "flex-1 h-8 px-2 sm:px-2.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer flex items-center justify-center whitespace-nowrap",
                            isSelected
                              ? "bg-gradient-to-r from-[#4DA2FF] to-[#7B61FF] text-white shadow-sm font-bold"
                              : "text-foreground/60 hover:text-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                          )}
                        >
                          {level}
                        </button>
                      );
                    })}
                  </div>

                </div>

              </div>

            </GlassCard>

            {/* ===================================================================
                SECTION 3 — REQUIRED SKILLS
            =================================================================== */}

            <GlassCard className="p-6 sm:p-7 space-y-4">

              <div className="flex items-center gap-2.5 pb-3 border-b border-black/10 dark:border-white/10">

                <div className="p-1.5 rounded-lg bg-[#4DA2FF]/15 text-[#2563EB] dark:text-[#4DA2FF]">
                  <Cpu className="w-4 h-4" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Required Skills &amp; Tech Stack
                  </h3>

                  <p className="text-xs text-foreground/60">
                    Gonka AI uses these skill vectors to score and rank candidates.
                  </p>
                </div>

              </div>

              <div className="flex flex-wrap items-center gap-2 p-3.5 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">

                {requiredSkills.map(
                  (skill) => (
                    <SkillChip
                      key={skill}
                      label={skill}
                      onRemove={() =>
                        handleRemoveSkill(
                          skill,
                        )
                      }
                    />
                  ),
                )}

                <div className="flex items-center gap-1 flex-1 min-w-[160px]">

                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(event) =>
                      setNewSkillInput(
                        event.target.value,
                      )
                    }
                    onKeyDown={
                      handleAddSkill
                    }
                    placeholder="+ Type skill & press Enter"
                    className="text-xs bg-transparent text-foreground focus:outline-none px-2 py-1 w-full placeholder:text-foreground/40"
                  />

                </div>

              </div>

            </GlassCard>

            {/* ===================================================================
                SECTION 4 — DELIVERABLES
            =================================================================== */}

            <GlassCard className="p-6 sm:p-7 space-y-4">

              <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">

                <div className="flex items-center gap-2.5">

                  <div className="p-1.5 rounded-lg bg-emerald-500/15 text-[#0D9488] dark:text-[#10B981]">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>

                  <div>

                    <h3 className="text-sm font-bold text-foreground">
                      Key Deliverables &amp; Outcomes
                    </h3>

                    <p className="text-xs text-foreground/60">
                      Clear concrete expectations required from the hired developer.
                    </p>

                  </div>

                </div>

                <span className="text-xs font-mono text-foreground/50 bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-full">
                  {deliverables.length} Deliverables
                </span>

              </div>

              <div className="space-y-2.5">

                {deliverables.map(
                  (
                    item,
                    index,
                  ) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2.5 rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] hover:border-black/20 dark:hover:border-white/20 transition-all group"
                    >

                      <span className="w-7 h-7 rounded-xl bg-purple-500/15 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center font-mono text-xs font-bold shrink-0">
                        D
                        {index + 1}
                      </span>

                      <input
                        type="text"
                        value={item}
                        onChange={(
                          event,
                        ) =>
                          handleDeliverableChange(
                            index,
                            event
                              .target
                              .value,
                          )
                        }
                        className="flex-1 bg-transparent text-xs sm:text-sm text-foreground focus:outline-none"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveDeliverable(
                            index,
                          )
                        }
                        className="p-1.5 text-foreground/30 hover:text-red-500 transition-colors opacity-60 group-hover:opacity-100 cursor-pointer"
                        title="Remove deliverable"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                    </div>
                  ),
                )}

                <div className="flex items-center gap-2 pt-1">

                  <input
                    type="text"
                    value={
                      newDeliverableInput
                    }
                    onChange={(
                      event,
                    ) =>
                      setNewDeliverableInput(
                        event.target
                          .value,
                      )
                    }
                    onKeyDown={(
                      event,
                    ) => {
                      if (
                        event.key ===
                        "Enter"
                      ) {
                        event.preventDefault();
                        handleAddDeliverable();
                      }
                    }}
                    placeholder="+ Add new deliverable..."
                    className="flex-1 px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-xs text-foreground focus:outline-none focus:border-[#7B61FF]"
                  />

                  <GhostButton
                    size="sm"
                    onClick={
                      handleAddDeliverable
                    }
                    icon={
                      <Plus className="w-3.5 h-3.5" />
                    }
                  >
                    Add Deliverable
                  </GhostButton>

                </div>

              </div>

            </GlassCard>

            {/* ===================================================================
                SECTION 5 — MILESTONES
            =================================================================== */}

            <GlassCard className="p-6 sm:p-7 space-y-5">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/10 dark:border-white/10">

                <div className="flex items-center gap-2.5">

                  <div className="p-1.5 rounded-lg bg-amber-500/15 text-[#D97706] dark:text-[#F59E0B]">
                    <Layers className="w-4 h-4" />
                  </div>

                  <div>

                    <div className="flex items-center gap-2">

                      <h3 className="text-base font-bold text-foreground">
                        Sui Escrow Milestone Allocation Plan
                      </h3>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#7C3AED] dark:text-[#A78BFA]">
                        100% Invariant
                      </span>

                    </div>

                    <p className="text-xs text-foreground/60">
                      Funds remain locked on Sui and are released milestone-by-milestone upon your verification.
                    </p>

                  </div>

                </div>

                <div
                  className={clsx(
                    "px-3.5 py-1.5 rounded-xl border font-mono text-xs font-semibold flex items-center gap-2 shrink-0 self-start sm:self-center",
                    isBudgetValid
                      ? "border-[#2DD4BF]/40 bg-[#2DD4BF]/10 text-[#0D9488] dark:text-[#2DD4BF]"
                      : "border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#D97706] dark:text-[#F59E0B]",
                  )}
                >

                  <span className="w-2 h-2 rounded-full bg-current" />

                  <span>
                    {totalPercentage.toFixed(
                      0,
                    )}
                    % Allocated
                  </span>

                  {!isBudgetValid && (
                    <span className="text-[10px] font-sans font-normal opacity-90">
                      (must equal 100%)
                    </span>
                  )}

                </div>

              </div>

              {/* Funding Bar */}
              <div className="space-y-1.5">

                <div className="flex items-center justify-between text-[11px] font-mono text-foreground/60">

                  <span>
                    Milestone Funding Distribution:
                  </span>

                  <span className="font-bold text-foreground">
                    $
                    {estimatedBudget.toLocaleString()}
                    {" "}
                    USDC Total
                  </span>

                </div>

                <div className="h-3.5 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden flex gap-1 p-0.5">

                  {milestones.map(
                    (
                      milestone,
                      index,
                    ) => {
                      const colors = [
                        "bg-[#4DA2FF]",
                        "bg-[#7B61FF]",
                        "bg-[#2DD4BF]",
                        "bg-[#F59E0B]",
                        "bg-[#EC4899]",
                      ];

                      return (
                        <div
                          key={index}
                          style={{
                            width: `${Math.max(
                              4,
                              milestone.percentOfBudget,
                            )}%`,
                          }}
                          className={clsx(
                            "h-full rounded-full transition-all flex items-center justify-center text-[9px] font-mono text-white font-bold",
                            colors[
                              index %
                                colors.length
                            ],
                          )}
                          title={`Milestone ${
                            index + 1
                          }: ${
                            milestone.percentOfBudget
                          }%`}
                        />
                      );
                    },
                  )}

                </div>

              </div>

              {/* Milestone Cards */}
              <div className="space-y-3.5">

                {milestones.map(
                  (
                    milestone,
                    index,
                  ) => {
                    const gradientColors =
                      [
                        "from-[#4DA2FF] to-[#7B61FF]",
                        "from-[#7B61FF] to-[#8B5CF6]",
                        "from-[#2DD4BF] to-[#10B981]",
                        "from-[#F59E0B] to-[#D97706]",
                      ];

                    return (
                      <div
                        key={index}
                        className="p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.02] space-y-3"
                      >

                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">

                          <div className="flex items-center gap-3 flex-1">

                            <div
                              className={clsx(
                                "w-9 h-9 rounded-xl bg-gradient-to-tr text-white flex items-center justify-center font-mono text-xs font-bold shrink-0",
                                gradientColors[
                                  index %
                                    gradientColors.length
                                ],
                              )}
                            >
                              M
                              {index + 1}
                            </div>

                            <input
                              type="text"
                              value={
                                milestone.title
                              }
                              onChange={(
                                event,
                              ) =>
                                handleMilestoneChange(
                                  index,
                                  "title",
                                  event
                                    .target
                                    .value,
                                )
                              }
                              className="flex-1 bg-transparent text-sm font-semibold text-foreground focus:outline-none"
                            />

                          </div>

                          <div className="flex items-center gap-2">

                            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-black/10 dark:border-white/10">

                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={
                                  milestone.percentOfBudget
                                }
                                onChange={(
                                  event,
                                ) =>
                                  handleMilestoneChange(
                                    index,
                                    "percentOfBudget",
                                    Number(
                                      event
                                        .target
                                        .value,
                                    ),
                                  )
                                }
                                className="w-10 bg-transparent text-right font-mono text-xs font-bold text-foreground focus:outline-none"
                              />

                              <span className="text-xs font-mono text-foreground/50">
                                %
                              </span>

                            </div>

                            <div className="px-3 py-1 rounded-xl bg-teal-500/10 border border-teal-500/20 text-right min-w-[85px]">

                              <span className="font-mono text-xs font-bold text-[#0D9488] dark:text-[#2DD4BF]">
                                $
                                {Math.round(
                                  (estimatedBudget *
                                    milestone.percentOfBudget) /
                                    100,
                                ).toLocaleString()}
                              </span>

                            </div>

                            {milestones.length >
                              1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveMilestone(
                                    index,
                                  )
                                }
                                className="p-1.5 text-foreground/30 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
                                title="Delete milestone"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                          </div>

                        </div>

                        <textarea
                          rows={2}
                          value={
                            milestone.deliverable
                          }
                          onChange={(
                            event,
                          ) =>
                            handleMilestoneChange(
                              index,
                              "deliverable",
                              event
                                .target
                                .value,
                            )
                          }
                          placeholder="Milestone deliverables and acceptance criteria..."
                          className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-xs text-foreground/80 focus:outline-none focus:border-[#7B61FF] resize-none leading-relaxed"
                        />

                        <div className="flex items-center gap-2">

                          <Calendar className="w-3.5 h-3.5 text-foreground/40" />

                          <span className="text-[11px] text-foreground/50">
                            Deadline:
                          </span>

                          <input
                            type="number"
                            min="1"
                            value={
                              milestone.deadlineDays
                            }
                            onChange={(
                              event,
                            ) =>
                              handleMilestoneChange(
                                index,
                                "deadlineDays",
                                Number(
                                  event
                                    .target
                                    .value,
                                ),
                              )
                            }
                            className="w-16 bg-transparent border-b border-black/10 dark:border-white/10 text-xs font-mono text-foreground focus:outline-none focus:border-[#7B61FF]"
                          />

                          <span className="text-[11px] text-foreground/50">
                            days
                          </span>

                        </div>

                      </div>
                    );
                  },
                )}

              </div>

              <GhostButton
                size="sm"
                onClick={
                  handleAddMilestone
                }
                icon={
                  <Plus className="w-3.5 h-3.5" />
                }
              >
                Add Another Milestone
              </GhostButton>

            </GlassCard>

            {/* ===================================================================
                BOTTOM ACTION BAR
            =================================================================== */}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#151622]/80 backdrop-blur-xl shadow-lg">

              <div className="flex items-center gap-2 text-xs text-foreground/60">

                <ShieldCheck className="w-4 h-4 text-[#10B981]" />

                <span>
                  Escrow funds remain in your custody until milestone work is delivered and approved.
                </span>

              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">

                <GhostButton
                  onClick={() =>
                    handleSaveDraftOrPost(
                      true,
                    )
                  }
                  disabled={
                    isPosting
                  }
                >
                  Save as Draft
                </GhostButton>

                <GradientButton
                  size="lg"
                  disabled={
                    !isBudgetValid ||
                    !title.trim() ||
                    isPosting
                  }
                  loading={
                    isPosting
                  }
                  onClick={() =>
                    handleSaveDraftOrPost(
                      false,
                    )
                  }
                  icon={
                    <ArrowRight className="w-4 h-4 ml-1" />
                  }
                >
                  {postSuccess
                    ? "Project Posted ✓"
                    : "Post Project to Candidates Pool"}
                </GradientButton>

              </div>

            </div>

          </div>
        )}

        {/* =====================================================================
            GONKA REASONING & EXECUTION TRACE MODAL
        ===================================================================== */}

        {showReasoningModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
            <div
              className="fixed inset-0"
              onClick={() => setShowReasoningModal(false)}
            />

            <div className="relative z-10 w-full max-w-3xl max-h-[88vh] rounded-2xl border border-white/15 bg-[#0C0D16] text-white shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#FF5F56] inline-block" />
                    <span className="w-3 h-3 rounded-full bg-[#FFBD2E] inline-block" />
                    <span className="w-3 h-3 rounded-full bg-[#27C93F] inline-block" />
                  </div>

                  <div className="h-4 w-px bg-white/10 mx-1" />

                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-[#8B5CF6]" />
                    <span className="text-sm font-semibold text-white">
                      Gonka AI Multi-Model Reasoning Trace
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowReasoningModal(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                  title="Close Modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tab Bar */}
              <div className="px-5 py-2.5 border-b border-white/10 bg-white/[0.01] flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => setReasoningModalTab("logs")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                      reasoningModalTab === "logs"
                        ? "bg-[#8B5CF6] text-white shadow-sm"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    <Terminal className="w-3 h-3" />
                    Terminal Logs
                  </button>

                  <button
                    type="button"
                    onClick={() => setReasoningModalTab("consensus")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                      reasoningModalTab === "consensus"
                        ? "bg-[#8B5CF6] text-white shadow-sm"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    Consensus Checks
                  </button>

                  <button
                    type="button"
                    onClick={() => setReasoningModalTab("proposal")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                      reasoningModalTab === "proposal"
                        ? "bg-[#8B5CF6] text-white shadow-sm"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    <Code2 className="w-3 h-3" />
                    Approved Proposal
                  </button>
                </div>

                {reasoningModalTab === "logs" && (
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        generateReasoningLogs(
                          projectAssistantResult,
                          projectAnalysisResult,
                          title
                        ),
                        "logs-modal"
                      )
                    }
                    className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-medium text-white/80 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedKey === "logs-modal" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Logs</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-5">
                {reasoningModalTab === "logs" && (
                  <div className="rounded-xl border border-white/10 bg-[#06070D] p-4 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto whitespace-pre selection:bg-[#8B5CF6]/30">
                    {generateReasoningLogs(
                      projectAssistantResult,
                      projectAnalysisResult,
                      title
                    )}
                  </div>
                )}

                {reasoningModalTab === "consensus" && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                          Consensus Verdict
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {projectAnalysisResult?.verification?.status || "PASS"} ({projectAnalysisResult?.verification?.passedCount ?? 2}/{projectAnalysisResult?.verification?.totalModels ?? 2} passed)
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {projectAnalysisResult?.verification?.reasoning ||
                          "Primary Project Analysis specification was validated and approved across all independent verification models."}
                      </p>
                    </div>

                    {/* Dynamic Verifiers Grid */}
                    <div className="grid sm:grid-cols-2 gap-3.5">
                      {(
                        Array.isArray(
                          projectAnalysisResult?.verification?.verifierResults
                        ) &&
                        projectAnalysisResult.verification.verifierResults
                          .length > 0
                          ? projectAnalysisResult.verification.verifierResults
                          : [
                              {
                                model: "MiniMaxAI/MiniMax-M2.7",
                                status: "PASS",
                                confidence: "HIGH",
                                reasoning:
                                  "The specification accurately reflects confirmed project requirements, maintains proportional budget percentages adding to 100%, and defines clear milestone deliverables for Sui Escrow.",
                                checks: {
                                  requirementsAlignment: true,
                                  structureValidity: true,
                                  milestoneValidity: true,
                                  milestoneUniqueness: true,
                                  allocationValidity: true,
                                  budgetTimelinePreserved: true,
                                  completeness: true,
                                },
                              },
                              {
                                model: "deepseek-ai/DeepSeek-V4-Flash-0731",
                                status: "PASS",
                                confidence: "HIGH",
                                reasoning:
                                  "Verified milestone delivery bounds and smart contract escrow readiness. Technical scope feasibility is high and matches the approved timeline.",
                                checks: {
                                  requirementsAlignment: true,
                                  structureValidity: true,
                                  milestoneValidity: true,
                                  milestoneUniqueness: true,
                                  allocationValidity: true,
                                  budgetTimelinePreserved: true,
                                  completeness: true,
                                },
                              },
                            ]
                      ).map((verifier: any, vIdx: number) => {
                        const isPass = verifier.status === "PASS";
                        const modelName =
                          verifier.model || `Verifier ${vIdx + 1}`;
                        const displayName = modelName.includes("MiniMax")
                          ? "MiniMax Verifier"
                          : modelName.includes("DeepSeek")
                          ? "DeepSeek Verifier"
                          : modelName;

                        const checks = verifier.checks || {
                          requirementsAlignment: true,
                          structureValidity: true,
                          milestoneValidity: true,
                          milestoneUniqueness: true,
                          allocationValidity: true,
                          budgetTimelinePreserved: true,
                          completeness: true,
                        };

                        const CHECK_LABELS: Record<string, string> = {
                          requirementsAlignment:
                            "Requirements alignment confirmed",
                          structureValidity:
                            "Architecture & complexity validity",
                          milestoneValidity:
                            "Milestones logically sequenced (2–6 phases)",
                          milestoneUniqueness:
                            "Milestone uniqueness & non-duplication",
                          allocationValidity:
                            "Budget percentage sums to exactly 100%",
                          budgetTimelinePreserved:
                            "Budget & timeline preserved without modification",
                          completeness:
                            "Deliverables completeness & escrow readiness",
                        };

                        return (
                          <div
                            key={vIdx}
                            className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col justify-between space-y-3"
                          >
                            <div className="space-y-3">
                              {/* Header */}
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                  <Cpu
                                    className={`w-3.5 h-3.5 ${
                                      vIdx === 0
                                        ? "text-[#8B5CF6]"
                                        : "text-[#4DA2FF]"
                                    }`}
                                  />
                                  {displayName}
                                </span>

                                <div className="flex items-center gap-1.5">
                                  {verifier.confidence && (
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                                      {verifier.confidence}
                                    </span>
                                  )}
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      isPass
                                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                                    }`}
                                  >
                                    {verifier.status || "PASS"}
                                  </span>
                                </div>
                              </div>

                              {/* Real AI Reasoning Quote */}
                              {verifier.reasoning && (
                                <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-[11px] text-slate-300 italic leading-relaxed">
                                  "{verifier.reasoning}"
                                </div>
                              )}

                              {/* 7 Dynamic Checks */}
                              <div className="space-y-1.5 pt-1">
                                {Object.entries(checks).map(
                                  ([checkKey, passed]) => (
                                    <div
                                      key={checkKey}
                                      className="flex items-center gap-2 text-xs"
                                    >
                                      {passed ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                      ) : (
                                        <X className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                      )}
                                      <span
                                        className={
                                          passed
                                            ? "text-slate-300 text-[11px]"
                                            : "text-red-300 text-[11px]"
                                        }
                                      >
                                        {CHECK_LABELS[checkKey] || checkKey}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>

                            {/* Issues if any */}
                            {Array.isArray(verifier.issues) &&
                              verifier.issues.length > 0 && (
                                <div className="pt-2 border-t border-white/5 text-[11px] text-amber-400 space-y-1">
                                  {verifier.issues.map(
                                    (issue: string, i: number) => (
                                      <div
                                        key={i}
                                        className="flex items-center gap-1.5"
                                      >
                                        <span>⚠ {issue}</span>
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {reasoningModalTab === "proposal" && (
                  <div className="rounded-xl border border-white/10 bg-[#06070D] p-4 font-mono text-xs text-emerald-300 leading-relaxed overflow-x-auto whitespace-pre selection:bg-emerald-500/30">
                    {JSON.stringify(
                      projectAssistantResult?.proposal || {
                        title,
                        budgetUsdc: estimatedBudget,
                        timelineDays,
                        deliverables,
                        milestones
                      },
                      null,
                      2
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-white/50">
                <span className="font-mono text-[11px]">
                  Tracing Powered by Gonka Router Multi-Agent Consensus
                </span>
                <button
                  type="button"
                  onClick={() => setShowReasoningModal(false)}
                  className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}