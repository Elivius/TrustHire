import type {
  ConsensusResult,
  ModelVerificationResult,
  VerificationVerdict,
} from "./types.js";

export function buildConsensus(
  results: ModelVerificationResult[],
): ConsensusResult {
  if (results.length === 0) {
    throw new Error("No model results available");
  }

  const verdictCounts = new Map<
    VerificationVerdict,
    number
  >();

  for (const result of results) {
    verdictCounts.set(
      result.verdict,
      (verdictCounts.get(result.verdict) ?? 0) + 1,
    );
  }

  let finalVerdict: VerificationVerdict =
    "UNCERTAIN";

  let highestCount = 0;

  for (const [verdict, count] of verdictCounts) {
    if (count > highestCount) {
      finalVerdict = verdict;
      highestCount = count;
    }
  }

  const averageScore =
    results.reduce(
      (sum, result) => sum + result.score,
      0,
    ) / results.length;

  let confidence: "HIGH" | "MEDIUM" | "LOW";

  if (highestCount === 3) {
    confidence = "HIGH";
  } else if (highestCount === 2) {
    confidence = "MEDIUM";
  } else {
    confidence = "LOW";
  }

  const reasoning = results
    .map(
      (result) =>
        `${result.model}: ${result.verdict} (${result.score}/100) - ${result.reasoning}`,
    )
    .join("\n");

  return {
    verdict: finalVerdict,
    score: Math.round(averageScore),
    confidence,

    agreementCount: highestCount,
    totalModels: results.length,

    reasoning,

    modelResults: results,
  };
}