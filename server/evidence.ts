import type {
  GitHubRepository,
  GitHubUser,
} from "./github";

export type ExperienceTier =
  | "Beginner"
  | "Intermediate"
  | "Expert";

export interface SkillClaim {
  name: string;
  tier: ExperienceTier;
}

export interface ProfileClaims {
  skills: SkillClaim[];
}

export function buildSkillEvidence(
  skill: SkillClaim,
  user: GitHubUser,
  repositories: GitHubRepository[],
) {
  const normalizedSkill = skill.name.toLowerCase();

  const matchingRepositories = repositories.filter((repo) => {
    if (!repo.language) {
      return false;
    }

    return (
      repo.language.toLowerCase() === normalizedSkill
    );
  });

  return {
    claim: {
      skill: skill.name,
      experienceTier: skill.tier,
    },

    source: "GitHub",

    ownershipVerified: true,

    account: {
      githubId: user.id,
      username: user.login,
      profileUrl: user.html_url,
      accountCreatedAt: user.created_at,
    },

    relevantEvidence: {
      matchingRepositories:
        matchingRepositories.map((repo) => ({
          name: repo.name,
          url: repo.html_url,
          language: repo.language,
          createdAt: repo.created_at,
          updatedAt: repo.updated_at,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
        })),

      matchingRepositoryCount:
        matchingRepositories.length,
    },
  };
}