import {
  scoreCandidates,
  type MatchFreelancer,
  type MatchProject,
  type MatchScoreResult,
} from "./matchEngine";

export interface ProjectMatchResult extends MatchScoreResult {
  projectId: string;
}

export interface MatchProjectsInput {
  freelancer: MatchFreelancer;
  projects: MatchProject[];
  model?: string;
}

/**
 * B2: Find the best open projects for a freelancer.
 *
 * The caller is responsible for supplying only open projects from Supabase.
 *
 * IMPORTANT:
 * freelancer.skills must contain ONLY database-verified skills.
 */
export async function matchProjects(
  input: MatchProjectsInput,
): Promise<ProjectMatchResult[]> {
  const scored = await scoreCandidates(
    "PROJECT_FOR_FREELANCER",
    input.freelancer,
    input.projects,
    input.model,
  );

  return scored
    .map((result) => {
      const project = input.projects.find(
        (candidate) => candidate.id === result.candidateId,
      );

      /*
       * HARD VERIFICATION GUARD:
       *
       * If a project has required skills but the freelancer has
       * zero verified skills, do not allow Gonka's profile-based
       * reasoning to create a positive technical skill match.
       */
      const hasRequiredSkills =
        (project?.requiredSkills?.length ?? 0) > 0;

      const hasVerifiedSkills =
        Array.isArray(input.freelancer.skills) &&
        input.freelancer.skills.length > 0;

      if (
        hasRequiredSkills &&
        !hasVerifiedSkills
      ) {
        return {
          ...result,
          matchScore: 0,
          projectId: result.candidateId,
          reasoning:
            "No verified freelancer skills are available for the project's required skills.",
          skillEvaluation:
            result.skillEvaluation.map((evaluation) => ({
              ...evaluation,
              matched: false,
              evidence:
                "No verified freelancer skill supports this requirement.",
            })),
        };
      }

      return {
        ...result,
        projectId: result.candidateId,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}