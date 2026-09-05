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
 * Maximum number of freelancers that will be sent to Gonka
 * for a single project matching operation.
 *
 * IMPORTANT:
 * This is a TOTAL limit, not a per-batch limit.
 *
 * Example:
 * 25 eligible freelancers
 * -> only 15 are sent to Gonka
 * -> Gonka processes them in batches if necessary.
 */
const MAX_FREELANCERS_SENT_TO_GONKA = 15;

/**
 * B1: Find the best freelancers for a project.
 *
 * Matching flow:
 *
 * 1. Use ONLY database-verified freelancer skills for
 *    the local skill pre-filter.
 *
 * 2. If the project has explicit required skills:
 *    - freelancers need sufficient verified-skill overlap
 *    - freelancers with no verified matching skills are excluded
 *
 * 3. If the project has NO explicit required skills:
 *    - do not perform skill-based rejection
 *    - allow Gonka to evaluate the broader project/freelancer context
 *
 * 4. Hard cap the total number of freelancers sent to Gonka
 *    at MAX_FREELANCERS_SENT_TO_GONKA.
 *
 * 5. Gonka calculates Match Score.
 *
 * 6. Trust Score comes separately from the database.
 *
 * 7. Overall Score:
 *
 *      Overall = Match Score × 0.7 + Trust Score × 0.3
 *
 * Match Score and Trust Score remain separate signals.
 */
export async function matchFreelancers(
  input: MatchFreelancersInput,
): Promise<FreelancerMatchResult[]> {
  // ------------------------------------------------------------
  // STEP 1: Determine whether this project has explicit skills.
  //
  // If requiredSkills is empty, we DO NOT skill-filter.
  // Gonka can use the project description and other context.
  // ------------------------------------------------------------

const hasExplicitRequiredSkills =
  Array.isArray(input.project.requiredSkills) &&
  input.project.requiredSkills.length > 0;

const filteredCandidates = hasExplicitRequiredSkills
  ? prefilterFreelancers(
      input.project,
      input.freelancers,
      input.minimumSkillOverlap ?? 0.2,
    )
  : input.freelancers;

console.log(
  `[Gonka Match] ${input.freelancers.length} freelancers received, ` +
    `${filteredCandidates.length} passed pre-filter.`,
);

// ------------------------------------------------------------
// IMPORTANT:
//
// If nobody passes the verified-skill filter, DO NOT reject
// everybody.
//
// Allow Gonka to perform contextual matching using things such
// as bio, experience, project description, etc.
//
// However, freelancer.skills MUST still contain ONLY verified
// database skills.
//
// Therefore an empty skills array remains:
//     skills: []
//
// It does NOT become an unverified skill list.
// ------------------------------------------------------------

let candidates: MatchFreelancer[];

if (
  hasExplicitRequiredSkills &&
  filteredCandidates.length === 0
) {
  console.log(
    "[Gonka Match] No freelancers passed the verified-skill filter.",
  );

  console.log(
    `[Gonka Match] Falling back to all ${input.freelancers.length} ` +
      "freelancers for contextual matching.",
  );

  candidates = input.freelancers;
} else {
  candidates = filteredCandidates;
}

// ------------------------------------------------------------
// HARD TOTAL LIMIT.
//
// Regardless of whether candidates came from the skill filter
// or the fallback, NEVER send more than 15 freelancers total
// to Gonka.
// ------------------------------------------------------------

const MAX_FREELANCERS_SENT_TO_GONKA = 15;

candidates = candidates.slice(
  0,
  MAX_FREELANCERS_SENT_TO_GONKA,
);

console.log(
  `[Gonka Match] ${candidates.length} freelancers sent to Gonka ` +
    `(maximum ${MAX_FREELANCERS_SENT_TO_GONKA} total).`,
);

// ------------------------------------------------------------
// No freelancers available at all.
// ------------------------------------------------------------

if (candidates.length === 0) {
  console.log(
    "[Gonka Match] No freelancers are available for matching.",
  );

  return [];
}

  // ------------------------------------------------------------
  // STEP 5: Gonka calculates the project-specific Match Score.
  //
  // Trust Score is NOT used here.
  // ------------------------------------------------------------

  const scored = await scoreCandidates(
    "FREELANCER_FOR_PROJECT",
    input.project,
    candidates,
    input.model,
  );

  // ------------------------------------------------------------
  // STEP 6 + 7:
  //
  // Attach the database Trust Score already supplied on the
  // trusted freelancer object.
  //
  // Trust Score does NOT modify Gonka's Match Score.
  //
  // Overall:
  //
  //     Match × 0.7 + Trust × 0.3
  // ------------------------------------------------------------

  return scored
    .map((result) => {
      const freelancer = candidates.find(
        (candidate) => candidate.id === result.candidateId,
      );

      const trustScore =
        freelancer?.trustScore ?? null;

      const overallScore =
        trustScore === null
          ? result.matchScore
          : result.matchScore * 0.7 +
            trustScore * 0.3;

      return {
        ...result,

        freelancerId: result.candidateId,

        trustScore,

        overallScore: Number(
          overallScore.toFixed(2),
        ),
      };
    })

    // ----------------------------------------------------------
    // FINAL RANKING
    //
    // 1. Overall Score
    // 2. Match Score
    // 3. Trust Score
    // ----------------------------------------------------------
    .sort((a, b) => {
      if (
        b.overallScore !==
        a.overallScore
      ) {
        return (
          b.overallScore -
          a.overallScore
        );
      }

      if (
        b.matchScore !==
        a.matchScore
      ) {
        return (
          b.matchScore -
          a.matchScore
        );
      }

      return (
        (b.trustScore ?? 0) -
        (a.trustScore ?? 0)
      );
    });
}