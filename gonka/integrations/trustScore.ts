import { gonka } from "../client.js";
import { parseGonkaJson } from "../responseParser.js";
import { runAcrossModels } from "../multiModel.js";
import { calculateConsensus } from "../consensus.js";

import type { SkillClaim } from "../../server/evidence.js";

import type {
  ModelVerificationResult,
  ConsensusResult,
} from "../types.js";

/* ============================================================
   TYPES
   ============================================================ */

export interface TrustScoreInput {
  skillVerification: {
    score: number;
  };

  evidenceAuthenticity: {
    ownershipVerified: boolean;
    relevantRepositories: number;
  };

  profileEvidence: {
    profileComplete: boolean;
    portfolioCount: number;
  };

  completedWork: {
    completedProjects: number;
    completedMilestones: number;
    onTimeCompletionRate: number;
    averageClientRating: number;
    totalClientReviews: number;
  };

  reliability: {
    cancelledProjects: number;
    disputedProjects: number;
  };
}

export interface TrustScoreBreakdown {
  skillVerification: number;
  evidenceAuthenticity: number;
  profileEvidence: number;
  completedWork: number;
  reliability: number;
}

export interface TrustScoreResult {
  trustScore: number;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  breakdown: TrustScoreBreakdown;
  reasoning: string;
}

export interface TrustScoreVerificationResult {
  trustScore: number;
  breakdown: TrustScoreBreakdown;

  gonka: {
    consensus: ConsensusResult;
    modelResults: ModelVerificationResult[];
    successfulModels: number;
    failedModels: number;
  };
}

interface TrustScoreGonkaResponse {
  verdict: "TRUE" | "FALSE" | "PARTIAL";
  score: number;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  reasoning: string;
}

/* ============================================================
   EVIDENCE SCORING
   ============================================================ */

function calculateEvidenceAuthenticityScore(
  evidence: TrustScoreInput["evidenceAuthenticity"],
): number {
  let score = 0;

  // Verified GitHub ownership = 40 points.
  // Ownership alone does not prove technical ability.
  if (evidence.ownershipVerified) {
    score += 40;
  }

  // Repository evidence = remaining 60 points.
  if (evidence.relevantRepositories >= 5) {
    score += 60;
  } else if (evidence.relevantRepositories >= 3) {
    score += 45;
  } else if (evidence.relevantRepositories >= 2) {
    score += 30;
  } else if (evidence.relevantRepositories >= 1) {
    score += 15;
  }

  return Math.min(score, 100);
}

function calculateProfileEvidenceScore(
  profile: TrustScoreInput["profileEvidence"],
): number {
  let score = 0;

  if (profile.profileComplete) {
    score += 60;
  }

  if (profile.portfolioCount >= 3) {
    score += 40;
  } else if (profile.portfolioCount === 2) {
    score += 30;
  } else if (profile.portfolioCount === 1) {
    score += 20;
  }

  return Math.min(score, 100);
}

function calculateCompletedWorkScore(
  work: TrustScoreInput["completedWork"],
): number {
  let score = 0;

  if (work.completedProjects >= 10) {
    score += 25;
  } else if (work.completedProjects >= 5) {
    score += 20;
  } else if (work.completedProjects >= 3) {
    score += 15;
  } else if (work.completedProjects >= 1) {
    score += 10;
  }

  if (work.completedMilestones >= 25) {
    score += 20;
  } else if (work.completedMilestones >= 15) {
    score += 15;
  } else if (work.completedMilestones >= 5) {
    score += 10;
  } else if (work.completedMilestones >= 1) {
    score += 5;
  }

  score += Math.round(
    Math.max(
      0,
      Math.min(
        work.onTimeCompletionRate,
        1,
      ),
    ) * 25,
  );

  score += Math.round(
    (
      Math.max(
        0,
        Math.min(
          work.averageClientRating,
          5,
        ),
      ) / 5
    ) * 20,
  );

  if (work.totalClientReviews >= 10) {
    score += 10;
  } else if (work.totalClientReviews >= 5) {
    score += 7;
  } else if (work.totalClientReviews >= 1) {
    score += 4;
  }

  return Math.min(score, 100);
}

function calculateReliabilityScore(
  reliability: TrustScoreInput["reliability"],
  work: TrustScoreInput["completedWork"],
): number {
  const hasHistory =
    work.completedProjects > 0 ||
    work.completedMilestones > 0 ||
    work.totalClientReviews > 0;

  // No history = insufficient evidence, not perfect reliability.
  let score = 50;

  if (hasHistory) {
    const onTimeRate = Math.max(
      0,
      Math.min(work.onTimeCompletionRate, 1),
    );

    const rating = Math.max(
      0,
      Math.min(work.averageClientRating, 5),
    );

    score += Math.round(
      onTimeRate * 25,
    );

    score += Math.round(
      (rating / 5) * 15,
    );

    if (work.totalClientReviews >= 10) {
      score += 10;
    } else if (work.totalClientReviews >= 5) {
      score += 7;
    } else if (work.totalClientReviews >= 1) {
      score += 3;
    }
  }

  // Negative history reduces reliability.
  score -=
    reliability.cancelledProjects * 5;

  score -=
    reliability.disputedProjects * 15;

  return Math.max(
    0,
    Math.min(score, 100),
  );
}

/* ============================================================
   CONFIDENCE
   ============================================================ */
   
function calculateLocalConfidence(
  input: TrustScoreInput,
): "LOW" | "MEDIUM" | "HIGH" {
  const hasGithubEvidence =
    input.evidenceAuthenticity.ownershipVerified &&
    input.evidenceAuthenticity.relevantRepositories > 0;

  const hasWorkEvidence =
    input.completedWork.completedProjects > 0 ||
    input.completedWork.completedMilestones > 0;

  const hasReviewEvidence =
    input.completedWork.totalClientReviews > 0;

  const hasPortfolioEvidence =
    input.profileEvidence.portfolioCount > 0;

  const evidenceSources = [
    hasGithubEvidence,
    hasWorkEvidence,
    hasReviewEvidence,
    hasPortfolioEvidence,
  ].filter(Boolean).length;

  if (
    hasGithubEvidence &&
    hasWorkEvidence &&
    hasReviewEvidence &&
    input.profileEvidence.profileComplete
  ) {
    return "HIGH";
  }

  if (evidenceSources >= 2) {
    return "MEDIUM";
  }

  return "LOW";
}

/* ============================================================
   TRUST SCORE CALCULATION
   ============================================================ */

/**
 * TrustHire Trust Score:
 *
 * Skill Verification       35%
 * Evidence Authenticity    25%
 * Profile & Portfolio      15%
 * Completed Work           15%
 * Reliability              10%
 */
export function calculateTrustScore(
  input: TrustScoreInput,
): TrustScoreResult {
  const skillVerification = Math.max(
    0,
    Math.min(
      input.skillVerification.score,
      100,
    ),
  );

  const evidenceAuthenticity =
    calculateEvidenceAuthenticityScore(
      input.evidenceAuthenticity,
    );

  const profileEvidence =
    calculateProfileEvidenceScore(
      input.profileEvidence,
    );

  const completedWork =
    calculateCompletedWorkScore(
      input.completedWork,
    );

  const reliability =
    calculateReliabilityScore(
      input.reliability,
      input.completedWork,
    );

  const trustScore = Math.round(
    skillVerification * 0.35 +
      evidenceAuthenticity * 0.25 +
      profileEvidence * 0.15 +
      completedWork * 0.15 +
      reliability * 0.10,
  );

  return {
    trustScore,

    confidence:
      calculateLocalConfidence(input),

    breakdown: {
      skillVerification,
      evidenceAuthenticity,
      profileEvidence,
      completedWork,
      reliability,
    },

    reasoning:
      "Trust Score is calculated using skill verification, " +
      "evidence authenticity, profile and portfolio evidence, " +
      "completed work, and reliability.",
  };
}

/* ============================================================
   GONKA PROMPT
   ============================================================ */

function buildTrustScorePrompt(
  skill: SkillClaim,
  skillEvidence: unknown,
  input: TrustScoreInput,
  calculated: TrustScoreResult,
): string {
  return `
You are evaluating a TrustHire freelancer Trust Score.

The Trust Score is calculated by TrustHire using this fixed
transparent weighting:

- Skill Verification: 35%
- Evidence Authenticity: 25%
- Profile & Portfolio: 15%
- Completed Work: 15%
- Reliability: 10%

TrustHire has already calculated the numerical score.

Your task is to evaluate whether the proposed score is
supported by the actual evidence.

Do NOT invent evidence.

Do NOT change the TrustHire weighting.

Do NOT recalculate the score differently.

Evaluate the quality and sufficiency of the evidence.

============================================================
SKILL CLAIM
============================================================

${JSON.stringify(skill, null, 2)}

============================================================
ACTUAL SKILL VERIFICATION EVIDENCE
============================================================

${JSON.stringify(skillEvidence, null, 2)}

============================================================
TRUST SCORE INPUT
============================================================

${JSON.stringify(input, null, 2)}

============================================================
PROPOSED TRUST SCORE
============================================================

${calculated.trustScore}/100

============================================================
BREAKDOWN
============================================================

${JSON.stringify(
  calculated.breakdown,
  null,
  2,
)}

============================================================
VERDICT RULES
============================================================

TRUE:
The evidence strongly supports the proposed Trust Score.

PARTIAL:
The evidence reasonably supports the proposed score,
but there are meaningful limitations or missing evidence.

FALSE:
The available evidence does not adequately support
the proposed Trust Score.

============================================================
OUTPUT REQUIREMENTS
============================================================

Return ONLY valid JSON.

Do not use markdown.
Do not use code fences.
Do not include <think> tags.
Do not include explanations outside JSON.

The response MUST have exactly this structure:

{
  "verdict": "TRUE" | "PARTIAL" | "FALSE",
  "score": 0,
  "confidence": "LOW" | "MEDIUM" | "HIGH",
  "reasoning": "brief explanation"
}
`.trim();
}

/* ============================================================
   SINGLE GONKA MODEL
   ============================================================ */

export async function assessTrustScoreWithGonka(
  skill: SkillClaim,
  skillEvidence: unknown,
  input: TrustScoreInput,
  calculated: TrustScoreResult,
  model?: string,
): Promise<ModelVerificationResult> {
  const selectedModel =
    model ?? process.env.GONKA_MODEL;

  if (!selectedModel) {
    throw new Error(
      "GONKA_MODEL is not configured",
    );
  }

  const prompt =
    buildTrustScorePrompt(
      skill,
      skillEvidence,
      input,
      calculated,
    );

  console.log(
    `Sending Trust Score request to Gonka model: ${selectedModel}`,
  );

  const startTime = Date.now();

  const result =
    await gonka.chat.completions
      .create({
        model: selectedModel,

        messages: [
          {
            role: "system",
            content:
              "You evaluate TrustHire freelancer Trust Scores using provided evidence. Return only valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],

        temperature: 0,
      })
      .withResponse();

  const response = result.data;
  const requestId = result.request_id;

  const elapsed =
    (
      (Date.now() - startTime) /
      1000
    ).toFixed(1);

  console.log(
    `Received Trust Score response from ${selectedModel} in ${elapsed}s`,
  );

  const content =
    response.choices[0]?.message?.content;

  if (!content) {
    throw new Error(
      "Gonka returned an empty Trust Score response",
    );
  }

  let parsed: TrustScoreGonkaResponse;

  try {
    parsed =
      parseGonkaJson(
        content,
      ) as TrustScoreGonkaResponse;
  } catch {
    throw new Error(
      `Gonka returned invalid Trust Score JSON: ${content}`,
    );
  }

  if (
    ![
      "TRUE",
      "FALSE",
      "PARTIAL",
    ].includes(parsed.verdict)
  ) {
    throw new Error(
      "Invalid Trust Score Gonka verdict",
    );
  }

  if (
    !Number.isInteger(parsed.score) ||
    parsed.score < 0 ||
    parsed.score > 100
  ) {
    throw new Error(
      "Invalid Trust Score Gonka score",
    );
  }

  if (
    ![
      "LOW",
      "MEDIUM",
      "HIGH",
    ].includes(parsed.confidence)
  ) {
    throw new Error(
      "Invalid Trust Score Gonka confidence",
    );
  }

  return {
    model:
      selectedModel as ModelVerificationResult["model"],

    verdict: parsed.verdict,

    score: parsed.score,

    confidence: parsed.confidence,

    reasoning: parsed.reasoning,

    requestId:
      requestId ?? "unknown",
  };
}

/* ============================================================
   MULTI-MODEL TRUST SCORE
   ============================================================ */

export async function verifyTrustScore(
  skill: SkillClaim,
  skillEvidence: unknown,
  input: TrustScoreInput,
): Promise<TrustScoreVerificationResult> {
  const calculated =
    calculateTrustScore(input);

  const models =
    process.env.GONKA_MODELS
      ?.split(",")
      .map(
        (model) => model.trim(),
      )
      .filter(Boolean);

  if (
    !models ||
    models.length === 0
  ) {
    throw new Error(
      "GONKA_MODELS is not configured",
    );
  }

  console.log(
    `Running ${models.length} Trust Score models in parallel...`,
  );

  const execution =
    await runAcrossModels(
      models,
      (model) =>
        assessTrustScoreWithGonka(
          skill,
          skillEvidence,
          input,
          calculated,
          model,
        ),
    );

  const successfulResults =
    execution.results.filter(
      (
        result,
      ): result is typeof result & {
        success: true;
        result: ModelVerificationResult;
      } =>
        result.success &&
        result.result !== undefined,
    );

  if (
    successfulResults.length === 0
  ) {
    throw new Error(
      "All Gonka models failed Trust Score assessment",
    );
  }

  const modelResults:
    ModelVerificationResult[] =
    successfulResults.map(
      (result) => result.result,
    );

  const consensus =
    calculateConsensus(
      modelResults,
    );

  return {
    trustScore:
      calculated.trustScore,

    breakdown:
      calculated.breakdown,

    gonka: {
      consensus,

      modelResults,

      successfulModels:
        successfulResults.length,

      failedModels:
        execution.results.filter(
          (result) => !result.success,
        ).length,
    },
  };
}