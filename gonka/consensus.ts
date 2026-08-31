import type {
  ModelVerificationResult,
  ConsensusResult,
  VerificationVerdict,
  Confidence,
} from "./types.js";

export function calculateConsensus(
  modelResults: ModelVerificationResult[],
): ConsensusResult {
  if (modelResults.length === 0) {
    throw new Error(
      "Cannot calculate consensus: no successful model results",
    );
  }

  const verdictCounts = countVerdicts(modelResults);

  const winningVerdict =
    getWinningVerdict(verdictCounts);

  const agreementCount =
    winningVerdict === "UNCERTAIN"
      ? 0
    : verdictCounts[winningVerdict];

  const totalModels = modelResults.length;

  const hasConflict =
    agreementCount !== totalModels;

  const score = Math.round(
    modelResults.reduce(
      (sum, result) => sum + result.score,
      0,
    ) / totalModels,
  );

  const confidence = calculateConfidence(
    agreementCount,
    totalModels,
  );

  const reasoning = buildConsensusReasoning(
    modelResults,
    winningVerdict,
    agreementCount,
    totalModels,
  );

  return {
    verdict: winningVerdict,
    score,
    confidence,
    agreementCount,
    totalModels,
    hasConflict,
    reasoning,
    modelResults,
  };
}

function countVerdicts(
  modelResults: ModelVerificationResult[],
): Record<VerificationVerdict, number> {
  const counts: Record<
    VerificationVerdict,
    number
  > = {
    TRUE: 0,
    PARTIAL: 0,
    FALSE: 0,
    UNCERTAIN: 0,
  };

  for (const result of modelResults) {
    counts[result.verdict]++;
  }

  return counts;
}

function getWinningVerdict(
  counts: Record<VerificationVerdict, number>,
): VerificationVerdict {
  const verdicts: VerificationVerdict[] = [
    "TRUE",
    "PARTIAL",
    "FALSE",
    "UNCERTAIN",
  ];

  let winner: VerificationVerdict = "UNCERTAIN";
  let highestCount = 0;

  for (const verdict of verdicts) {
    if (counts[verdict] > highestCount) {
      winner = verdict;
      highestCount = counts[verdict];
    }
  }

  return winner;
}

function calculateConfidence(
  agreementCount: number,
  totalModels: number,
): Confidence {
  if (agreementCount === totalModels) {
    return "HIGH";
  }

  if (agreementCount > totalModels / 2) {
    return "MEDIUM";
  }

  return "LOW";
}

function buildConsensusReasoning(
  modelResults: ModelVerificationResult[],
  winningVerdict: VerificationVerdict,
  agreementCount: number,
  totalModels: number,
): string {
  const modelSummary = modelResults
    .map(
      (result) =>
        `${result.model}: ${result.verdict} (${result.score})`,
    )
    .join("; ");

  if (agreementCount === totalModels) {
    return (
      `All ${totalModels} models agreed on ` +
      `${winningVerdict}. ` +
      `Model results: ${modelSummary}.`
    );
  }

  return (
    `${agreementCount} of ${totalModels} models ` +
    `returned ${winningVerdict}. ` +
    `The models were not unanimous. ` +
    `Model results: ${modelSummary}.`
  );

  function getWinningVerdict(
  counts: Record<VerificationVerdict, number>,
  ): VerificationVerdict {
    const verdicts: VerificationVerdict[] = [
      "TRUE",
      "PARTIAL",
      "FALSE",
      "UNCERTAIN",
    ];

  let winner: VerificationVerdict = "UNCERTAIN";
  let highestCount = 0;
  let winners = 0;

  for (const verdict of verdicts) {
    if (counts[verdict] > highestCount) {
      winner = verdict;
      highestCount = counts[verdict];
      winners = 1;
    } else if (
      counts[verdict] === highestCount &&
      highestCount > 0
    ) {
      winners++;
    }
  }

  // No clear majority
  if (winners > 1) {
    return "UNCERTAIN";
  }

  // A single model cannot establish consensus
  const totalVotes = Object.values(counts).reduce(
    (sum, count) => sum + count,
    0,
  );

  if (highestCount <= totalVotes / 2) {
    return "UNCERTAIN";
  }

  return winner;
}
}