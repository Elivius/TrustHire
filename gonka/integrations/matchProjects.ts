import {
  scoreCandidates,
  type MatchFreelancer,
  type MatchProject,
  type MatchScoreResult,
} from "./matchEngine.js";

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
    .map((result) => ({
      ...result,
      projectId: result.candidateId,
    }))
    .sort((a, b) => b.matchScore - a.matchScore);
}
