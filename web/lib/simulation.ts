import { Milestone, Project, FreelancerProfile, AiMatchResult } from "@/types";

export function generateGonkaRequestId(): string {
  const chars = "abcdef0123456789";
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `gonka_req_${id}`;
}

export function generateSuiTxHash(): string {
  const chars = "0123456789abcdef";
  let hash = "0x";
  for (let i = 0; i < 12; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return hash;
}

export function generateWalletAddress(): string {
  const chars = "0123456789abcdef";
  let prefix = "";
  for (let i = 0; i < 6; i++) prefix += chars.charAt(Math.floor(Math.random() * chars.length));
  let suffix = "";
  for (let i = 0; i < 4; i++) suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  return `0x${prefix}...${suffix}`;
}

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface ParsedProjectOutput {
  title: string;
  requiredSkills: string[];
  estimatedBudget: number;
  timelineDays: number;
  suggestedMilestones: {
    title: string;
    deliverable: string;
    amount: number;
    percentOfBudget: number;
    deadlineDays: number;
  }[];
  gonkaRequestId: string;
}

export async function simulateGonkaParse(
  description: string,
  simulateFailure = false
): Promise<ParsedProjectOutput> {
  await delay(2000 + Math.random() * 800);

  if (simulateFailure) {
    throw new Error("Gonka Router timeout: unable to parse unstructured text.");
  }

  // Extract budget if mentioned
  const budgetMatch = description.match(/\$?(\d+[\d,]*)(k)?/i);
  let budget = 3500;
  if (budgetMatch) {
    const rawNum = parseInt(budgetMatch[1].replace(/,/g, ""), 10);
    budget = budgetMatch[2] ? rawNum * 1000 : rawNum;
    if (budget < 300) budget = 3500;
  }

  // Extract timeline if mentioned
  let days = 14;
  if (/(\d+)\s*(week|wk)/i.test(description)) {
    const w = parseInt(description.match(/(\d+)\s*(week|wk)/i)![1], 10);
    days = w * 7;
  } else if (/(\d+)\s*day/i.test(description)) {
    days = parseInt(description.match(/(\d+)\s*day/i)![1], 10);
  }

  // Detect skills
  const possibleSkills = [
    "Sui Move",
    "Smart Contracts",
    "Rust",
    "React",
    "Next.js",
    "TypeScript",
    "Tailwind CSS",
    "UI/UX",
    "Figma",
    "Technical Writing",
    "Security Audit"
  ];
  const detectedSkills = possibleSkills.filter((s) =>
    new RegExp(s.replace(".", "\\."), "i").test(description)
  );
  const finalSkills = detectedSkills.length >= 2 ? detectedSkills : ["React", "TypeScript", "Tailwind CSS", "UI/UX"];

  // Generate plausible title
  const words = description.trim().split(/\s+/).slice(0, 7).join(" ");
  const title = words.length > 10 ? words.replace(/[^\w\s-]/g, "") : "Web3 Full-Stack Application on Sui";

  const ms1Amt = Math.round(budget * 0.35);
  const ms2Amt = Math.round(budget * 0.35);
  const ms3Amt = budget - ms1Amt - ms2Amt;

  return {
    title: title.charAt(0).toUpperCase() + title.slice(1),
    requiredSkills: finalSkills,
    estimatedBudget: budget,
    timelineDays: days,
    suggestedMilestones: [
      {
        title: "Specification, Architecture & Design System",
        deliverable: "Detailed technical architecture document, visual style guide, and wireframe prototypes.",
        amount: ms1Amt,
        percentOfBudget: 35,
        deadlineDays: Math.max(3, Math.round(days * 0.3))
      },
      {
        title: "Core Implementation & Feature Integration",
        deliverable: "Fully functional modules, contract integration/UI logic, and unit test coverage.",
        amount: ms2Amt,
        percentOfBudget: 35,
        deadlineDays: Math.max(7, Math.round(days * 0.7))
      },
      {
        title: "End-to-End Testing, QA & Final Deployment",
        deliverable: "Testnet deployment, bug fixes, user documentation, and production hand-off.",
        amount: ms3Amt,
        percentOfBudget: 30,
        deadlineDays: days
      }
    ],
    gonkaRequestId: generateGonkaRequestId()
  };
}

export async function simulateGithubRepoDiscovery(username: string): Promise<{
  title: string;
  url: string;
  isVerified: boolean;
  repositoryName: string;
  commitsCount: number;
  primaryLanguage: string;
}[]> {
  await delay(1500);
  const sanitized = username.replace(/^@/, "").trim() || "alex-rivera-dev";

  return [
    {
      title: `${sanitized}/sui-dex-liquidity-router`,
      url: `https://github.com/${sanitized}/sui-dex-liquidity-router`,
      isVerified: true,
      repositoryName: "sui-dex-liquidity-router",
      commitsCount: 48,
      primaryLanguage: "Sui Move"
    },
    {
      title: `${sanitized}/gonka-ai-oracle-interface`,
      url: `https://github.com/${sanitized}/gonka-ai-oracle-interface`,
      isVerified: true,
      repositoryName: "gonka-ai-oracle-interface",
      commitsCount: 32,
      primaryLanguage: "TypeScript"
    },
    {
      title: `${sanitized}/sui-escrow-contract-sdk`,
      url: `https://github.com/${sanitized}/sui-escrow-contract-sdk`,
      isVerified: true,
      repositoryName: "sui-escrow-contract-sdk",
      commitsCount: 26,
      primaryLanguage: "Rust"
    }
  ];
}

export async function simulateTrustScoreCalculation(
  skillsCount: number,
  hasPortfolio: boolean,
  experienceLevel: string,
  isGithubVerified = false,
  githubUsername?: string
): Promise<{
  trustScore: number;
  confidence: "Low" | "Medium" | "High";
  reasoning: { label: string; note: string }[];
  requestId: string;
}> {
  await delay(2000);

  let score = 84;
  if (skillsCount >= 5) score += 5;
  else if (skillsCount >= 3) score += 3;

  if (hasPortfolio) score += 3;
  if (isGithubVerified) score += 5;

  if (experienceLevel === "Expert") score += 3;
  else if (experienceLevel === "Intermediate") score += 1;

  score = Math.min(99, score);

  const reasoning = [
    { label: "Profile completeness", note: `Verified ${skillsCount} core Web3 skills and credentials.` },
    {
      label: "GitHub code verification",
      note: isGithubVerified
        ? `Verified commit ownership & cryptographic signatures on GitHub (@${githubUsername || "alex-rivera-dev"}).`
        : "Portfolio links attached without GitHub OAuth verification."
    },
    { label: "Experience assessment", note: `Classified as ${experienceLevel} tier in modern development pipelines.` },
    { label: "Gonka AI verification", note: "Autonomous pattern matching indicates strong task reliability." }
  ];

  return {
    trustScore: score,
    confidence: isGithubVerified || (hasPortfolio && skillsCount >= 3) ? "High" : "Medium",
    reasoning,
    requestId: generateGonkaRequestId()
  };
}

export function computeFreelancerMatchForProject(
  freelancerSkills: string[],
  projectSkills: string[],
  freelancerTrustScore: number
): AiMatchResult {
  const overlap = projectSkills.filter((ps) =>
    freelancerSkills.some((fs) => fs.toLowerCase() === ps.toLowerCase())
  );
  const ratio = projectSkills.length > 0 ? overlap.length / projectSkills.length : 0.8;
  const baseScore = Math.round(ratio * 40 + (freelancerTrustScore / 100) * 55 + 5);
  const matchScore = Math.min(99, Math.max(68, baseScore));

  const topSkillNames = overlap.slice(0, 3).join(", ");
  const reasoning = overlap.length > 0
    ? `Strong match because verified expertise in ${topSkillNames} matches ${Math.round(ratio * 100)}% of requirements with a ${freelancerTrustScore} Trust Score.`
    : `Good general fit with high trust rating (${freelancerTrustScore}) across adjacent Web3 engineering disciplines.`;

  return {
    requestId: generateGonkaRequestId(),
    matchScore,
    reasoning
  };
}
