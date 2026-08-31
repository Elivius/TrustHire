import { gonka } from "./client.js";
import { GONKA_MODELS } from "./models.js";
import type {
  GonkaModel,
  ModelVerificationResult,
  VerificationVerdict,
  Confidence,
} from "./types.js";

interface RunVerificationInput {
  claim: string;
  evidence: string;
}

interface ModelResponse {
  verdict: VerificationVerdict;
  score: number;
  confidence: Confidence;
  reasoning: string;
}

function buildPrompt(
  claim: string,
  evidence: string,
): string {
  return `
You are an objective verification model for TrustHire.

Your task is to evaluate whether a freelancer's claim is supported
by the provided evidence.

CLAIM:
${claim}

EVIDENCE:
${evidence}

Evaluate the evidence objectively.

Return a JSON object with exactly these fields:

{
  "verdict": "TRUE",
  "score": 0,
  "confidence": "HIGH",
  "reasoning": "Brief explanation based only on the evidence"
}

Rules:

1. Do not assume facts that are not present in the evidence.
2. Do not favour the freelancer or client.
3. TRUE means the evidence strongly supports the claim.
4. FALSE means the evidence contradicts the claim.
5. UNCERTAIN means there is insufficient evidence.
6. Score must be between 0 and 100.
7. Confidence must be HIGH, MEDIUM, or LOW.
8. Return only the JSON object.
`;
}

/**
 * Extract JSON from a model response.
 *
 * Models may sometimes return:
 *
 * <think>
 * reasoning...
 * </think>
 *
 * {
 *   "verdict": "TRUE"
 * }
 *
 * or Markdown:
 *
 * \`\`\`json
 * {...}
 * \`\`\`
 */
function parseModelResponse(content: string): ModelResponse {
  let cleaned = content.trim();

  // Remove <think>...</think> blocks.
  cleaned = cleaned.replace(
    /<think>[\s\S]*?<\/think>/gi,
    "",
  );

  // Remove Markdown code fences.
  cleaned = cleaned
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  // Find the first JSON object.
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error(
      `Model did not return valid JSON.\nRaw response:\n${content}`,
    );
  }

  const jsonText = cleaned.slice(start, end + 1);

  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error(
      `Failed to parse model JSON.\nRaw response:\n${content}`,
    );
  }

  if (
    typeof parsed !== "object" ||
    parsed === null
  ) {
    throw new Error("Model response is not a JSON object");
  }

  const result = parsed as Record<string, unknown>;

  const verdict = result.verdict;
  const score = result.score;
  const confidence = result.confidence;
  const reasoning = result.reasoning;

  if (
    verdict !== "TRUE" &&
    verdict !== "FALSE" &&
    verdict !== "UNCERTAIN"
  ) {
    throw new Error(
      `Invalid verdict returned by model: ${String(verdict)}`,
    );
  }

  const numericScore = Number(score);

  if (
    !Number.isFinite(numericScore) ||
    numericScore < 0 ||
    numericScore > 100
  ) {
    throw new Error(
      `Invalid score returned by model: ${String(score)}`,
    );
  }

  if (
    confidence !== "HIGH" &&
    confidence !== "MEDIUM" &&
    confidence !== "LOW"
  ) {
    throw new Error(
      `Invalid confidence returned by model: ${String(confidence)}`,
    );
  }

  if (typeof reasoning !== "string") {
    throw new Error(
      "Model did not provide reasoning",
    );
  }

  return {
    verdict,
    score: numericScore,
    confidence,
    reasoning,
  };
}

async function runModel(
  model: GonkaModel,
  input: RunVerificationInput,
): Promise<ModelVerificationResult> {
  console.log(`Running ${model}...`);

  const response =
    await gonka.chat.completions.create({
      model,
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content:
            "You are an objective evidence verification model.",
        },
        {
          role: "user",
          content: buildPrompt(
            input.claim,
            input.evidence,
          ),
        },
      ],
    });

  const content =
    response.choices[0]?.message?.content;

  if (!content) {
    throw new Error(
      `${model} returned an empty response`,
    );
  }

  console.log(`Received response from ${model}`);

  const parsed = parseModelResponse(content);

  return {
    model,
    requestId: response.id,

    verdict: parsed.verdict,
    score: parsed.score,
    confidence: parsed.confidence,

    reasoning: parsed.reasoning,
  };
}

export async function verifyWithAllModels(
  input: RunVerificationInput,
): Promise<ModelVerificationResult[]> {
  const results = await Promise.allSettled(
    GONKA_MODELS.map((model) =>
      runModel(model, input),
    ),
  );

  const successfulResults: ModelVerificationResult[] = [];

  results.forEach((result, index) => {
    const model = GONKA_MODELS[index];

    if (result.status === "fulfilled") {
      successfulResults.push(result.value);
    } else {
      console.error(
        `Gonka model failed: ${model}`,
      );
      console.error(result.reason);
    }
  });

  if (successfulResults.length < 2) {
    throw new Error(
      `Not enough successful Gonka models for consensus. ` +
      `Only ${successfulResults.length} model(s) responded.`,
    );
  }

  return successfulResults;
}