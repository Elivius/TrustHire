import dotenv from "dotenv";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { setCookie, getCookie } from "hono/cookie";
import crypto from "node:crypto";

import {
  getGitHubUser,
  getGitHubRepositories,
  buildGitHubEvidence,
} from "./github.js";

import {
  createSession,
  getSession,
} from "./session.js";

import {
  buildSkillEvidence,
} from "./evidence.js";

import {
  verifySkill,
} from "../gonka/integrations/skillVerification.js";

import {
  verifyTrustScore,
  type TrustScoreInput,
} from "../gonka/integrations/trustScore.js";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

const app = new Hono();

// ========================================
// Development OAuth Test State
// ========================================
//
// Used only by gonka/test.ts so the terminal
// test can detect when GitHub OAuth finishes.
//
// Do NOT use this as production authentication.
// ========================================

let latestTestSessionId: string | null = null;

const PORT = 3010;

const FRONTEND_URL =
  process.env.FRONTEND_URL ??
  "http://localhost:3000";

app.use(
  "*",
  cors({
    origin: FRONTEND_URL,
    allowMethods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],
    allowHeaders: ["Content-Type"],
  }),
);

// ========================================
// Health Check
// ========================================

app.get("/", (c) => {
  return c.json({
    success: true,
    message: "TrustHire API is running",
  });
});

// ========================================
// GitHub Test Evidence
// ========================================
//
// This is only for testing the GitHub API
// using GITHUB_TEST_TOKEN.
// ========================================

app.get("/test/evidence", async (c) => {
  try {
    const accessToken = process.env.GITHUB_TEST_TOKEN;

    if (!accessToken) {
      return c.text(
        "GITHUB_TEST_TOKEN is not configured",
        500,
      );
    }

    const githubUser =
      await getGitHubUser(accessToken);

    const repositories =
      await getGitHubRepositories(accessToken);

    const evidence = buildGitHubEvidence(
      githubUser,
      repositories,
    );

    return c.json({
      success: true,
      evidence,
    });
  } catch (error) {
    console.error(
      "GitHub test evidence error:",
      error,
    );

    return c.json(
      {
        success: false,
        message: "Failed to get GitHub evidence",
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      500,
    );
  }
});

// ========================================
// GitHub OAuth - Step 1
// ========================================
//
// User visits:
//
// http://localhost:3010/auth/github
//
// Then we redirect them to GitHub.
// ========================================

app.get("/auth/github", (c) => {
  const clientId =
    process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return c.text(
      "GITHUB_CLIENT_ID is not configured",
      500,
    );
  }

  const callbackUrl =
    process.env.GITHUB_CALLBACK_URL ??
    `http://localhost:${PORT}/auth/github/callback`;

  // Generate random OAuth state.
  //
  // This protects the OAuth flow against
  // CSRF attacks.
  const state =
    crypto.randomBytes(32).toString("hex");

  const requestedReturnTo =
  c.req.query("returnTo");

const defaultReturnTo =
  "/freelancer/onboarding";

let returnTo =
  defaultReturnTo;

if (
  requestedReturnTo &&
  requestedReturnTo.startsWith("/") &&
  !requestedReturnTo.startsWith("//")
) {
  returnTo = requestedReturnTo;
}

// Store the destination temporarily.
// SameSite=Lax allows this cookie to survive
// the GitHub OAuth redirect.
setCookie(
  c,
  "github_oauth_return_to",
  returnTo,
  {
    httpOnly: true,
    sameSite: "Lax",
    secure: false, // localhost
    maxAge: 600,
    path: "/",
  },
);

  // Store state temporarily in a cookie.
  setCookie(
    c,
    "github_oauth_state",
    state,
    {
      httpOnly: true,
      sameSite: "Lax",
      secure: false, // localhost
      maxAge: 600,
      path: "/",
    },
  );

  const githubUrl =
    new URL(
      "https://github.com/login/oauth/authorize",
    );

  githubUrl.searchParams.set(
    "client_id",
    clientId,
  );

  githubUrl.searchParams.set(
    "redirect_uri",
    callbackUrl,
  );

  githubUrl.searchParams.set(
    "scope",
    "read:user repo",
  );

  githubUrl.searchParams.set(
    "state",
    state,
  );

  return c.redirect(
    githubUrl.toString(),
  );
});

// ========================================
// GitHub OAuth - Step 2
// ========================================
//
// GitHub redirects back here after the
// freelancer authorizes TrustHire.
// ========================================

app.get(
  "/auth/github/callback",
  async (c) => {
const returnedState =
  c.req.query("state");

const savedStateCookie =
  getCookie(
    c,
    "github_oauth_state",
  );

const savedReturnTo =
  getCookie(
    c,
    "github_oauth_return_to",
  );

let savedState: string | null = null;
let returnTo: string =
  "/freelancer/onboarding";

/*
 * Read the OAuth state cookie.
 *
 * The existing implementation stores the state
 * as a plain string, so keep that behaviour.
 */
if (savedStateCookie) {
  savedState =
    savedStateCookie;
}

/*
 * Read the optional return destination.
 *
 * Only allow relative frontend paths.
 */
if (
  savedReturnTo &&
  savedReturnTo.startsWith("/") &&
  !savedReturnTo.startsWith("//")
) {
  returnTo =
    savedReturnTo;
}
/*
 * Support both:
 *
 * 1. New JSON OAuth state cookie
 * 2. Old plain state cookie
 *
 * This keeps the existing OAuth flow
 * backwards-compatible.
 */
if (savedStateCookie) {
  try {
    const decoded =
      decodeURIComponent(
        savedStateCookie,
      );

    const parsed =
      JSON.parse(decoded);

    if (
      parsed &&
      typeof parsed.state === "string"
    ) {
      savedState = parsed.state;

      if (
        typeof parsed.returnTo ===
          "string" &&
        parsed.returnTo.startsWith("/") &&
        !parsed.returnTo.startsWith("//")
      ) {
        returnTo =
          parsed.returnTo;
      }
    } else {
      /*
       * Backwards compatibility with the
       * previous plain state cookie.
       */
      savedState =
        savedStateCookie;
    }
  } catch {
    /*
     * Existing cookie format was just the
     * random state string.
     */
    savedState =
      savedStateCookie;
  }
}

    // ------------------------------------
    // Check authorization code
    // ------------------------------------
  
    const code =
      c.req.query("code");

    if (!code) {
      return c.text(
        "GitHub authorization code is missing",
        400,
      );
    }

    // ------------------------------------
    // Check OAuth state
    // ------------------------------------

    if (
      !returnedState ||
      returnedState !== savedState
    ) {
      return c.text(
        "Invalid OAuth state",
        400,
      );
    }

    const clientId =
      process.env.GITHUB_CLIENT_ID;

    const clientSecret =
      process.env.GITHUB_CLIENT_SECRET;

    if (
      !clientId ||
      !clientSecret
    ) {
      return c.text(
        "GitHub OAuth credentials are not configured",
        500,
      );
    }

    const callbackUrl =
      process.env.GITHUB_CALLBACK_URL ??
      `http://localhost:${PORT}/auth/github/callback`;

    try {
      // ==================================
      // Exchange authorization code
      // for GitHub access token
      // ==================================

      const tokenResponse =
        await fetch(
          "https://github.com/login/oauth/access_token",
          {
            method: "POST",

            headers: {
              Accept:
                "application/json",

              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              client_id:
                clientId,

              client_secret:
                clientSecret,

              code,

              redirect_uri:
                callbackUrl,
            }),
          },
        );

      if (!tokenResponse.ok) {
        throw new Error(
          `GitHub token request failed: ${tokenResponse.status}`,
        );
      }

      const tokenData =
        await tokenResponse.json();

      if (tokenData.error) {
        throw new Error(
          tokenData.error_description ??
            "GitHub token exchange failed",
        );
      }

      const accessToken =
        tokenData.access_token;

      if (!accessToken) {
        throw new Error(
          "GitHub did not return an access token",
        );
      }

      // ==================================
      // Create TrustHire session
      // ==================================
      //
      // createSession() returns the
      // session ID directly.
      // ==================================

      const sessionId =
        createSession(
          accessToken,
        );

      latestTestSessionId = sessionId;

      // ==================================
      // Get authenticated GitHub user
      // ==================================

      const githubUser =
        await getGitHubUser(
          accessToken,
        );

      // ==================================
      // Get repositories
      // ==================================

      const repositories =
        await getGitHubRepositories(
          accessToken,
        );

      // ==================================
      // Build GitHub evidence
      // ==================================

      const evidence =
        buildGitHubEvidence(
          githubUser,
          repositories,
        );

      // ==================================
      // Return result
      // ==================================

const frontendUrl =
  process.env.FRONTEND_URL ??
  "http://localhost:3000";

const savedReturnTo =
  getCookie(
    c,
    "github_oauth_return_to",
  );

const safeReturnTo =
  savedReturnTo &&
  savedReturnTo.startsWith("/") &&
  !savedReturnTo.startsWith("//")
    ? savedReturnTo
    : "/freelancer/onboarding";

const redirectUrl =
  new URL(
    safeReturnTo,
    frontendUrl,
  );

// Always tell the frontend GitHub is connected.
redirectUrl.searchParams.set(
  "github",
  "connected",
);

redirectUrl.searchParams.set(
  "sessionId",
  sessionId,
);

redirectUrl.searchParams.set(
  "username",
  githubUser.login,
);

// Only onboarding needs step=3.
if (
  safeReturnTo ===
  "/freelancer/onboarding"
) {
  redirectUrl.searchParams.set(
    "step",
    "3",
  );
}

return c.redirect(
  redirectUrl.toString(),
);
    } catch (error) {
      console.error(
        "GitHub OAuth error:",
        error,
      );

      return c.json(
        {
          success: false,

          message:
            "GitHub OAuth failed",

          error:
            error instanceof Error
              ? error.message
              : "Unknown error",
        },
        500,
      );
    }
  },
);

// ========================================
// Profile Trust Verification
// ========================================
//
// Frontend sends:
//
// {
//   "sessionId": "...",
//   "skills": [
//     {
//       "name": "PHP",
//       "tier": "Intermediate"
//     },
//     {
//       "name": "React",
//       "tier": "Expert"
//     }
//   ]
// }
//
// The backend:
//
// 1. Gets the GitHub session
// 2. Gets the freelancer's GitHub account
// 3. Gets repositories
// 4. Builds evidence for every skill
//
// Gonka multi-model verification will be
// added after this evidence stage.
// ========================================

app.get(
  "/github/repositories/:owner/:repo/pulls",
  async (c) => {
    try {
      const sessionId =
        c.req.query("sessionId");

      const owner =
        c.req.param("owner");

      const repo =
        c.req.param("repo");

      if (!sessionId) {
        return c.json(
          {
            success: false,
            message:
              "sessionId is required",
          },
          400,
        );
      }

      if (!owner || !repo) {
        return c.json(
          {
            success: false,
            message:
              "Repository owner and name are required",
          },
          400,
        );
      }

      const session =
        getSession(sessionId);

      if (!session) {
        return c.json(
          {
            success: false,
            message:
              "Invalid or expired GitHub session",
          },
          401,
        );
      }

      const response =
        await fetch(
          `https://api.github.com/repos/${encodeURIComponent(
            owner,
          )}/${encodeURIComponent(
            repo,
          )}/pulls?state=all&sort=updated&direction=desc&per_page=50`,
          {
            headers: {
              Accept:
                "application/vnd.github+json",

              Authorization:
                `Bearer ${session.accessToken}`,

              "X-GitHub-Api-Version":
                "2022-11-28",
            },
          },
        );

      if (!response.ok) {
        const errorText =
          await response.text();

        throw new Error(
          `GitHub Pull Request request failed: ${response.status} ${errorText}`,
        );
      }

      const pullRequests =
        await response.json();

      return c.json({
        success: true,

        pullRequests,
      });
    } catch (error) {
      console.error(
        "GitHub Pull Requests error:",
        error,
      );

      return c.json(
        {
          success: false,

          message:
            "Failed to retrieve GitHub Pull Requests",

          error:
            error instanceof Error
              ? error.message
              : "Unknown error",
        },
        500,
      );
    }
  },
);

app.post(
  "/profile/verify",
  async (c) => {
    try {
      // ==================================
      // Read request body
      // ==================================

      const body =
        await c.req.json<{
          sessionId?: string;

          skills?: {
            name: string;

            tier:
              | "Beginner"
              | "Intermediate"
              | "Expert";
          }[];
        }>();

      // ==================================
      // Validate sessionId
      // ==================================

      if (!body.sessionId) {
        return c.json(
          {
            success: false,

            message:
              "sessionId is required",
          },
          400,
        );
      }

      // ==================================
      // Validate skills
      // ==================================

      if (
        !body.skills ||
        !Array.isArray(
          body.skills,
        ) ||
        body.skills.length === 0
      ) {
        return c.json(
          {
            success: false,

            message:
              "At least one skill is required",
          },
          400,
        );
      }

      // ==================================
      // Get GitHub session
      // ==================================

      const session =
        getSession(
          body.sessionId,
        );

      if (!session) {
        return c.json(
          {
            success: false,

            message:
              "Invalid or expired session",
          },
          401,
        );
      }

      // ==================================
      // Get GitHub access token
      // ==================================

      const accessToken =
        session.accessToken;

      // ==================================
      // Get GitHub user
      // ==================================

      const githubUser =
        await getGitHubUser(
          accessToken,
        );

      // ==================================
      // Get repositories
      // ==================================

      const repositories =
        await getGitHubRepositories(
          accessToken,
        );

      // ==================================
      // Build evidence for each
      // claimed skill
      // ==================================

      const results =
        body.skills.map(
          (skill) =>
            buildSkillEvidence(
              skill,
              githubUser,
              repositories,
            ),
        );

      // ==================================
      // Return verification evidence
      // ==================================

      return c.json({
        success: true,

        github: {
          id: githubUser.id,

          username:
            githubUser.login,

          name:
            githubUser.name,

          avatarUrl:
            githubUser.avatar_url,

          profileUrl:
            githubUser.html_url,

          accountCreatedAt:
            githubUser.created_at,
        },

        repositorySummary: {
          totalPublicRepositories:
            repositories.length,

          languages: [
            ...new Set(
              repositories
                .map(
                  (repo) =>
                    repo.language,
                )
                .filter(
                  (
                    language,
                  ): language is string =>
                    Boolean(
                      language,
                    ),
                ),
            ),
          ],
        },

        skills: results,
      });
    } catch (error) {
      console.error(
        "Profile verification error:",
        error,
      );

      return c.json(
        {
          success: false,

          message:
            "Profile verification failed",

          error:
            error instanceof Error
              ? error.message
              : "Unknown error",
        },
        500,
      );
    }
  },
);

app.get(
  "/github/repositories",
  async (c) => {
    try {
      const sessionId =
        c.req.query("sessionId");

      if (!sessionId) {
        return c.json(
          {
            success: false,
            message:
              "sessionId is required",
          },
          400,
        );
      }

      const session =
        getSession(sessionId);

      if (!session) {
        return c.json(
          {
            success: false,
            message:
              "Invalid or expired GitHub session",
          },
          401,
        );
      }

      const repositories =
        await getGitHubRepositories(
          session.accessToken,
        );

      return c.json({
        success: true,

        repositories,
      });
    } catch (error) {
      console.error(
        "GitHub repositories error:",
        error,
      );

      return c.json(
        {
          success: false,

          message:
            "Failed to retrieve GitHub repositories",

          error:
            error instanceof Error
              ? error.message
              : "Unknown error",
        },
        500,
      );
    }
  },
);
// ========================================
// Development OAuth Test Status
// ========================================
//
// Used by gonka/test.ts to detect when the
// GitHub OAuth callback has completed.
//
// This should only be used locally.
// ========================================

app.post("/profile/trust-score", async (c) => {
  try {
    const body = await c.req.json();

    const {
      sessionId,
      skills,
    } = body;

    // ------------------------------------
    // Validate request
    // ------------------------------------

    if (!sessionId) {
      return c.json(
        {
          success: false,
          message: "GitHub sessionId is required",
        },
        400,
      );
    }

    if (
      !Array.isArray(skills) ||
      skills.length === 0
    ) {
      return c.json(
        {
          success: false,
          message: "At least one skill is required",
        },
        400,
      );
    }

    // ------------------------------------
    // Get GitHub session
    // ------------------------------------

    const session = getSession(sessionId);

    if (!session) {
      return c.json(
        {
          success: false,
          message: "GitHub session not found or expired",
        },
        401,
      );
    }

    // ------------------------------------
    // Get GitHub account
    // ------------------------------------

    const githubUser =
      await getGitHubUser(
        session.accessToken,
      );

    // ------------------------------------
    // Get GitHub repositories
    // ------------------------------------

    const repositories =
      await getGitHubRepositories(
        session.accessToken,
      );

    // ------------------------------------
    // Gonka Skill Verification
    // ------------------------------------

    const skillResults = [];
    for (const skill of skills as Array<{
      name: string;
      tier: "Beginner" | "Intermediate" | "Expert";
    }>) {
      const evidence = buildSkillEvidence(
        skill,
        githubUser,
        repositories,
      );

      const verification = await verifySkill(
        skill,
        evidence,
      );

      skillResults.push({
        skill: skill.name,
        tier: skill.tier,
        evidence,
        verification,
      });
    }

    // ------------------------------------
    // Calculate overall skill score
    // ------------------------------------

    const verifiedSkillResults =
      skillResults.filter(
        (result) =>
          result.verification.consensus.verdict === "TRUE",
      );

    const overallSkillScore =
      verifiedSkillResults.length > 0
        ? Math.round(
            verifiedSkillResults.reduce(
              (total, result) =>
                total +
                result.verification.consensus.score,
              0,
            ) /
              verifiedSkillResults.length,
          )
        : 0;

    console.log(
      "Gonka skill verification complete:",
      {
        totalSkills: skillResults.length,
        verifiedSkills: verifiedSkillResults.length,
        overallSkillScore,
      },
    );

    // ------------------------------------
    // Trust Score calculation
    // ------------------------------------

    const trustScoreInput: TrustScoreInput = {
      skillVerification: {
        score: overallSkillScore,
      },

      evidenceAuthenticity: {
        ownershipVerified: true,
        relevantRepositories:
          repositories.length,
      },

      profileEvidence: {
        profileComplete:
          body.profileComplete ?? true,

        portfolioCount:
          body.portfolioCount ?? 0,
      },

      completedWork: {
        completedProjects:
          body.completedProjects ?? 0,

        completedMilestones:
          body.completedMilestones ?? 0,

        onTimeCompletionRate:
          body.onTimeCompletionRate ?? 0,

        averageClientRating:
          body.averageClientRating ?? 0,

        totalClientReviews:
          body.totalClientReviews ?? 0,
      },

      reliability: {
        cancelledProjects:
          body.cancelledProjects ?? 0,

        disputedProjects:
          body.disputedProjects ?? 0,
      },
    };

    console.log(
      "Calculating Trust Score..."
    );

    const trustScoreResult =
      await verifyTrustScore(
        skills[0],
        skillResults[0].evidence,
        trustScoreInput,
      );

    console.log(
      "Trust Score verification complete:",
      trustScoreResult.gonka.consensus,
    );

    return c.json({
      success: true,

      github: {
        username: githubUser.login,
        ownershipVerified: true,
        repositoryCount:
          repositories.length,
      },

      skillVerification: {
        overallScore:
          overallSkillScore,

        skills:
          skillResults.map(
            (result) => ({
              name: result.skill,
              tier: result.tier,

              score:
                result.verification
                  .consensus.score,

              verdict:
                result.verification
                  .consensus.verdict,
                  
              verified:
                result.verification.consensus.verdict === "TRUE",

              confidence:
                result.verification
                  .consensus.confidence,

              reasoning:
                result.verification
                  .consensus.reasoning,
            }),
          ),
      },

      // Temporary:
      // Trust Score will be connected next.
      trustScore: {
        score: trustScoreResult.trustScore,

        verdict:
          trustScoreResult.gonka.consensus.verdict,

        confidence:
          trustScoreResult.gonka.consensus.confidence,

        reasoning:
          trustScoreResult.gonka.consensus.reasoning,

        breakdown:
          trustScoreResult.breakdown,
      },
    });

  } catch (error) {

    console.error(
      "Trust Score verification error:",
      error,
    );

    return c.json(
      {
        success: false,
        message:
          "Failed to calculate Trust Score",
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      500,
    );
  }
});

app.get(
  "/test/oauth-status",
  (c) => {
    if (!latestTestSessionId) {
      return c.json({
        success: true,
        authenticated: false,
      });
    }

    return c.json({
      success: true,
      authenticated: true,
      sessionId: latestTestSessionId,
    });
  },
);

// ========================================
// Start Server
// ========================================

console.log(
  `TrustHire API running on http://localhost:${PORT}`,
);

serve({
  fetch: app.fetch,
  port: PORT,
});