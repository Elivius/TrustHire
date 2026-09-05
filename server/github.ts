export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  created_at: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  created_at: string;
  updated_at: string;
  stargazers_count: number;
  forks_count: number;
}

export async function getGitHubUser(
  accessToken: string,
): Promise<GitHubUser> {
  const response = await fetch(
    "https://api.github.com/user",
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${accessToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to get GitHub user: ${response.status}`,
    );
  }

  return response.json();
}

export async function getGitHubRepositories(
  accessToken: string,
): Promise<GitHubRepository[]> {
  const repositories: GitHubRepository[] = [];

  let page = 1;

  while (true) {
    const response = await fetch(
      `https://api.github.com/user/repos?` +
        new URLSearchParams({
          visibility: "all",
          affiliation:
            "owner,collaborator,organization_member",
          sort: "created",
          direction: "asc",
          per_page: "100",
          page: String(page),
        }),
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${accessToken}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get GitHub repositories: ${response.status}`,
      );
    }

    const pageRepositories =
      (await response.json()) as GitHubRepository[];

    repositories.push(...pageRepositories);

    if (pageRepositories.length < 100) {
      break;
    }

    page++;
  }

  return repositories;
}

export function buildGitHubEvidence(
  user: GitHubUser,
  repositories: GitHubRepository[],
) {
  const languages = new Set<string>();

  for (const repo of repositories) {
    if (repo.language) {
      languages.add(repo.language);
    }
  }

  return {
    source: "GitHub",
    ownershipVerified: true,

    account: {
      githubId: user.id,
      username: user.login,
      name: user.name,
      profileUrl: user.html_url,
      accountCreatedAt: user.created_at,
    },

    repositorySummary: {
      totalPublicRepositories: repositories.length,
      languages: Array.from(languages),
    },

    repositories: repositories.map((repo) => ({
      name: repo.name,
      url: repo.html_url,
      description: repo.description,
      language: repo.language,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
    })),
  };
}