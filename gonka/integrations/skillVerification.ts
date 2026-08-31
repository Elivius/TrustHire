import { gonka } from "../client.js";
import type { SkillClaim } from "../../server/evidence.js";
import { parseGonkaJson } from "../responseParser.js";
import { runAcrossModels } from "../multiModel.js";
import { calculateConsensus } from "../consensus.js";
import type {
  ModelVerificationResult,
  ConsensusResult,
} from "../types.js";

export interface SkillVerificationResult {
  model: ModelVerificationResult["model"];
  verdict: "TRUE" | "FALSE" | "PARTIAL";
  score: number;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  reasoning: string;
  requestId?: string;
}

interface VerificationResponse {
  verdict: "TRUE" | "FALSE" | "PARTIAL";
  score: number;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  reasoning: string;
}

export interface MultiModelSkillVerificationResult {
  consensus: ConsensusResult;
  modelResults: ModelVerificationResult[];
  successfulModels: number;
  failedModels: number;
}

/**
 * Verify a skill claim using a single Gonka model.
 */
export async function verifySkillWithGonka(
  skill: SkillClaim,
  evidence: unknown,
  model?: string,
): Promise<SkillVerificationResult> {
  const selectedModel =
    model ?? process.env.GONKA_MODEL;

  if (!selectedModel) {
    throw new Error(
      "GONKA_MODEL is not configured",
    );
  }

  const prompt = `
You are a skill verification evaluator for TrustHire.

Evaluate whether the following freelancer skill claim is supported by the provided evidence.

CLAIM:
${JSON.stringify(skill, null, 2)}

EVIDENCE:
${JSON.stringify(evidence, null, 2)}

Evaluation rules:
- TRUE = the evidence strongly supports the claimed skill and experience tier.
- PARTIAL = the evidence supports the skill but does not sufficiently support the claimed experience tier.
- FALSE = the evidence does not support the claimed skill.
- Score must be an integer from 0 to 100.
- Confidence must be LOW, MEDIUM, or HIGH.
- Reasoning must briefly explain the decision using only the provided evidence.

IMPORTANT OUTPUT REQUIREMENTS:
- Return ONLY a valid JSON object.
- Do NOT include markdown.
- Do NOT include code fences.
- Do NOT include <think> tags.
- Do NOT include explanations before or after the JSON.
- Do NOT include any additional text.

The response MUST have exactly this structure:

{
  "verdict": "TRUE" | "PARTIAL" | "FALSE",
  "score": 0,
  "confidence": "LOW" | "MEDIUM" | "HIGH",
  "reasoning": "brief explanation"
}
`;

  console.log(
    `Sending request to Gonka model: ${selectedModel}`,
  );

  const startTime = Date.now();

  const response =
    await gonka.chat.completions.create({
      model: selectedModel,
      messages: [
        {
          role: "system",
          content:
            "You verify freelancer skill claims using provided evidence. Return only valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0,
    });

  const elapsed =
    ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(
    `Received response from ${selectedModel} in ${elapsed}s`,
  );

  const content =
    response.choices[0]?.message?.content;

  if (!content) {
    throw new Error(
      "Gonka returned an empty response",
    );
  }

  let parsed: VerificationResponse;

  try {
    parsed =
      parseGonkaJson(content) as VerificationResponse;
  } catch {
    throw new Error(
      `Gonka returned invalid JSON: ${content}`,
    );
  }

  if (
    !["TRUE", "FALSE", "PARTIAL"].includes(
      parsed.verdict,
    )
  ) {
    throw new Error(
      "Invalid Gonka verdict",
    );
  }

  if (
    !Number.isInteger(parsed.score) ||
    parsed.score < 0 ||
    parsed.score > 100
  ) {
    throw new Error(
      "Invalid Gonka score",
    );
  }

  if (
    !["LOW", "MEDIUM", "HIGH"].includes(
      parsed.confidence,
    )
  ) {
    throw new Error(
      "Invalid Gonka confidence",
    );
  }

  return {
    model:
      selectedModel as ModelVerificationResult["model"],
    verdict: parsed.verdict,
    score: parsed.score,
    confidence: parsed.confidence,
    reasoning: parsed.reasoning,
    requestId: response.id,
  };
}

/**
 * Verify a skill claim using multiple Gonka models
 * and calculate a final consensus.
 *
 * This is the main public entry point for skill verification.
 */
export async function verifySkill(
  skill: SkillClaim,
  evidence: unknown,
): Promise<MultiModelSkillVerificationResult> {
  const models =
    process.env.GONKA_MODELS
      ?.split(",")
      .map((model) => model.trim())
      .filter(Boolean);

  if (!models || models.length === 0) {
    throw new Error(
      "GONKA_MODELS is not configured",
    );
  }

  console.log(
    `Running ${models.length} models in parallel...`,
  );

  const execution = await runAcrossModels(
    models,
    (model) =>
      verifySkillWithGonka(
        skill,
        evidence,
        model,
      ),
  );

  const successfulResults =
    execution.results.filter(
      (
        result,
      ): result is typeof result & {
        success: true;
        result: SkillVerificationResult;
      } =>
        result.success &&
        result.result !== undefined,
    );

  if (successfulResults.length === 0) {
    throw new Error(
      "All Gonka models failed verification",
    );
  }

  const modelResults: ModelVerificationResult[] =
    successfulResults.map((result) => ({
      model: result.result.model,
      verdict: result.result.verdict,
      score: result.result.score,
      confidence: result.result.confidence,
      reasoning: result.result.reasoning,
      requestId: result.result.requestId ?? "unknown",
    }));

  const consensus =
    calculateConsensus(modelResults);

  return {
    consensus,
    modelResults,
    successfulModels:
      successfulResults.length,
    failedModels:
      execution.results.filter(
        (result) => !result.success,
      ).length,
  };
}