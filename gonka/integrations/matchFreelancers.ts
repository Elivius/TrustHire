import {
  prefilterFreelancers,
  scoreCandidates,
  type MatchFreelancer,
  type MatchProject,
  type MatchScoreResult,
} from "./matchEngine";

export interface FreelancerMatchResult extends MatchScoreResult {
  freelancerId: string;
  trustScore: number | null;
  overallScore: number;
}

export interface MatchFreelancersInput {
  project: MatchProject;
  freelancers: MatchFreelancer[];
  minimumSkillOverlap?: number;
  model?: string;
}

/**
 * B1: Find the best freelancers for a project.
 *
 * Matching flow:
 * 1. Cheap skill-overlap pre-filter
 * 2. Gonka calculates the project-specific Match Score
 * 3. Cached Trust Score is retrieved from the freelancer profile
 * 4. Overall Score is calculated:
 *
 *    Overall = Match Score × 0.7 + Trust Score × 0.3
 *
 * Match Score and Trust Score remain separate signals.
 */
export async function matchFreelancers(
  input: MatchFreelancersInput,
): Promise<FreelancerMatchResult[]> {
  // ------------------------------------------------------------
  // STEP 1: Cheap candidate pre-filter
  //
  // This is only used to reduce the number of Gonka calls.
  // It must NOT be treated as the final matching decision.
  // ------------------------------------------------------------
  const candidates = prefilterFreelancers(
    input.project,
    input.freelancers,
    input.minimumSkillOverlap ?? 0.2,
  );

  // ------------------------------------------------------------
  // STEP 2: Gonka calculates the project-specific Match Score
  // ------------------------------------------------------------
  const scored = await scoreCandidates(
    "FREELANCER_FOR_PROJECT",
    input.project,
    candidates,
    input.model,
  );

  // ------------------------------------------------------------
  // STEP 3 + 4:
  // Attach cached Trust Score and calculate Overall Score
  //
  // Overall = Match × 0.7 + Trust × 0.3
  // ------------------------------------------------------------
  return scored
    .map((result) => {
      const freelancer = candidates.find(
        (candidate) => candidate.id === result.candidateId,
      );

      const trustScore = freelancer?.trustScore ?? null;

      // If Trust Score is unavailable, do not invent one.
      // We keep the overall score based only on the Match Score.
      const overallScore =
        trustScore === null
          ? result.matchScore
          : result.matchScore * 0.7 + trustScore * 0.3;

      return {
        ...result,
        freelancerId: result.candidateId,
        trustScore,
        overallScore: Number(overallScore.toFixed(2)),
      };
    })
    // ------------------------------------------------------------
    // FINAL RANKING
    //
    // 1. Overall Score
    // 2. Match Score if tied
    // 3. Trust Score if still tied
    // ------------------------------------------------------------
    .sort((a, b) => {
      if (b.overallScore !== a.overallScore) {
        return b.overallScore - a.overallScore;
      }

      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }

      return (b.trustScore ?? 0) - (a.trustScore ?? 0);
    });
}