import dotenv from "dotenv";
import { spawn, exec } from "node:child_process";

import {
  calculateTrustScore,
  verifyTrustScore,
  type TrustScoreInput,
} from "../integrations/trustScore.js";

import type { SkillClaim } from "../../server/evidence.js";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

// ============================================================
// CONFIGURATION
// ============================================================

const SERVER_URL =
  process.env.SERVER_URL ??
  "http://localhost:3010";

const SERVER_ENTRY =
  process.env.SERVER_ENTRY ??
  "server/index.ts";

const SKILL: SkillClaim = {
  name: "PHP",
  tier: "Expert",
};

const MAX_OAUTH_ATTEMPTS = 120;

// ============================================================
// TYPES
// ============================================================

interface OAuthStatusResponse {
  authenticated: boolean;
  sessionId?: string;
}

interface VerifyResponse {
  success: boolean;

  github?: {
    id: number;
    username: string;
    name: string | null;
    avatarUrl: string;
    profileUrl: string;
    accountCreatedAt: string;
  };

  repositorySummary?: {
    totalPublicRepositories: number;
    languages: string[];
  };

  skills?: SkillEvidence[];

  message?: string;
  error?: string;
}

interface SkillEvidence {
  claim: {
    skill: string;
    experienceTier:
      | "Beginner"
      | "Intermediate"
      | "Expert";
  };

  source: string;

  ownershipVerified: boolean;

  account: {
    githubId: number;
    username: string;
    profileUrl: string;
    accountCreatedAt: string;
  };

  relevantEvidence: {
    matchingRepositories: MatchingRepository[];

    matchingRepositoryCount: number;
  };
}

interface MatchingRepository {
  name: string;
  url: string;
  language: string | null;
  createdAt: string;
  updatedAt: string;
  stars: number;
  forks: number;
}

// ============================================================
// HELPERS
// ============================================================

function sleep(
  milliseconds: number,
): Promise<void> {
  return new Promise(
    (resolve) =>
      setTimeout(
        resolve,
        milliseconds,
      ),
  );
}

// ============================================================
// SERVER
// ============================================================

async function isServerRunning(): Promise<boolean> {
  try {
    const response =
      await fetch(
        `${SERVER_URL}/`,
      );

    return response.ok;
  } catch {
    return false;
  }
}

async function startServer(): Promise<{
  process:
    | ReturnType<typeof spawn>
    | null;

  startedByTest: boolean;
}> {
  // ----------------------------------------------------------
  // Check whether server is already running
  // ----------------------------------------------------------

  if (
    await isServerRunning()
  ) {
    console.log(
      "✓ TrustHire server is already running",
    );

    return {
      process: null,
      startedByTest: false,
    };
  }

  // ----------------------------------------------------------
  // Start server
  // ----------------------------------------------------------

  console.log(
    "\nStarting TrustHire server...",
  );

  const serverProcess =
    spawn(
      "pnpm",
      [
        "exec",
        "tsx",
        SERVER_ENTRY,
      ],
      {
        stdio: [
          "ignore",
          "pipe",
          "pipe",
        ],

        env: {
          ...process.env,
        },
      },
    );

  serverProcess.stdout?.on(
    "data",
    (data) => {
      const output =
        data
          .toString()
          .trim();

      if (output) {
        console.log(
          `[server] ${output}`,
        );
      }
    },
  );

  serverProcess.stderr?.on(
    "data",
    (data) => {
      const output =
        data
          .toString()
          .trim();

      if (output) {
        console.error(
          `[server] ${output}`,
        );
      }
    },
  );

  // ----------------------------------------------------------
  // Wait for server
  // ----------------------------------------------------------

  for (
    let attempt = 0;
    attempt < 60;
    attempt++
  ) {
    if (
      await isServerRunning()
    ) {
      console.log(
        "✓ TrustHire server is running",
      );

      return {
        process: serverProcess,
        startedByTest: true,
      };
    }

    await sleep(500);
  }

  serverProcess.kill();

  throw new Error(
    "TrustHire server failed to start",
  );
}

// ============================================================
// GITHUB OAUTH
// ============================================================

function openGitHubAuthentication(): void {
  const url =
    `${SERVER_URL}/auth/github`;

  console.log(
    "\nOpening GitHub authentication...",
  );

  console.log(
    `URL: ${url}`,
  );

  if (
    process.platform ===
    "darwin"
  ) {
    exec(`open "${url}"`);
    return;
  }

  if (
    process.platform ===
    "win32"
  ) {
    exec(
      `start "" "${url}"`,
    );
    return;
  }

  exec(
    `xdg-open "${url}"`,
  );
}

// ============================================================
// WAIT FOR OAUTH SESSION
// ============================================================

async function waitForOAuthSession(): Promise<string> {
  console.log(
    "\nWaiting for GitHub authorization...",
  );

  console.log(
    "Please authorize TrustHire in the browser.",
  );

  for (
    let attempt = 0;
    attempt <
    MAX_OAUTH_ATTEMPTS;
    attempt++
  ) {
    try {
      const response =
        await fetch(
          `${SERVER_URL}/test/oauth-status`,
        );

      if (response.ok) {
        const data =
          (await response.json()) as OAuthStatusResponse;

        if (
          data.authenticated &&
          data.sessionId
        ) {
          console.log(
            "✓ GitHub account connected",
          );

          return data.sessionId;
        }
      }
    } catch {
      // Keep waiting.
    }

    await sleep(1000);
  }

  throw new Error(
    "Timed out waiting for GitHub OAuth authorization",
  );
}

// ============================================================
// GET REAL GITHUB SKILL EVIDENCE
// ============================================================

async function getSkillEvidence(
  sessionId: string,
): Promise<VerifyResponse> {
  console.log(
    "\nGetting GitHub evidence...",
  );

  const response =
    await fetch(
      `${SERVER_URL}/profile/verify`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          sessionId,

          skills: [
            SKILL,
          ],
        }),
      },
    );

  const text =
    await response.text();

  let data: VerifyResponse;

  try {
    data =
      JSON.parse(
        text,
      ) as VerifyResponse;
  } catch {
    throw new Error(
      `Server returned invalid JSON:\n${text}`,
    );
  }

  if (!response.ok) {
    throw new Error(
      data.message ??
        data.error ??
        "Failed to retrieve GitHub evidence",
    );
  }

  if (!data.success) {
    throw new Error(
      data.message ??
        data.error ??
        "Skill verification failed",
    );
  }

  if (
    !data.skills ||
    data.skills.length === 0
  ) {
    throw new Error(
      "No skill evidence was returned by the server",
    );
  }

  if (
    !data.github ||
    !data.repositorySummary
  ) {
    throw new Error(
      "GitHub verification returned incomplete account evidence",
    );
  }

  console.log(
    "✓ GitHub evidence retrieved",
  );

  return data;
}

// ============================================================
// MAIN
// ============================================================

async function main(): Promise<void> {
  console.log(
    "\n============================================================",
  );

  console.log(
    "             TRUSTHIRE TRUST SCORE TEST",
  );

  console.log(
    "============================================================",
  );

  console.log(
    `\nSkill: ${SKILL.name}`,
  );

  console.log(
    `Tier: ${SKILL.tier}`,
  );

  // ==========================================================
  // START SERVER
  // ==========================================================

  const {
    process: serverProcess,
    startedByTest,
  } =
    await startServer();

  try {
    // ========================================================
    // GITHUB LOGIN
    // ========================================================

    openGitHubAuthentication();

    const sessionId =
      await waitForOAuthSession();

    // ========================================================
    // REAL GITHUB EVIDENCE
    // ========================================================

    const verificationData =
      await getSkillEvidence(
        sessionId,
      );

    // --------------------------------------------------------
    // Extract the actual skill evidence
    //
    // IMPORTANT:
    // /profile/verify returns:
    //
    // {
    //   success,
    //   github,
    //   repositorySummary,
    //   skills: [...]
    // }
    //
    // The skill evidence is skills[0].
    // --------------------------------------------------------

    const skillEvidence =
      verificationData.skills![0];

    if (!skillEvidence) {
      throw new Error(
        "GitHub skill evidence is missing",
      );
    }

    // ========================================================
    // GITHUB RESULT
    // ========================================================

    console.log(
      "\n============================================================",
    );

    console.log(
      "GITHUB RESULT",
    );

    console.log(
      "============================================================",
    );

    console.log(
      JSON.stringify(
        verificationData,
        null,
        2,
      ),
    );

    console.log(
      "\n✓ Skill evidence extracted",
    );

    // ========================================================
    // DEMO DATABASE DATA
    // ========================================================
    //
    // These values are temporary until Supabase is connected.
    //
    // REAL:
    // - GitHub account
    // - GitHub ownership
    // - GitHub repositories
    // - Repository languages
    // - Relevant repository evidence
    //
    // DEMO:
    // - Skill verification score
    // - Profile completeness
    // - Portfolio count
    // - Completed projects
    // - Completed milestones
    // - Client ratings
    // - Reliability
    //
    // Later these demo values will come from the database.
    // ========================================================

    const repositoryCount =
      skillEvidence
        .relevantEvidence
        .matchingRepositoryCount;

    const freelancer:
      TrustScoreInput = {
        // ----------------------------------------------------
        // Skill Verification
        // ----------------------------------------------------
        //
        // Temporary demo score.
        //
        // Later:
        // This will come from the actual skill verification
        // consensus result.
        //
        skillVerification: {
          score: 78,
        },

        // ----------------------------------------------------
        // Evidence Authenticity
        // ----------------------------------------------------
        //
        // These values come from REAL GitHub evidence.
        //
        evidenceAuthenticity: {
          ownershipVerified:
            skillEvidence
              .ownershipVerified,

          relevantRepositories:
            repositoryCount,
        },

        // ----------------------------------------------------
        // Profile & Portfolio
        // ----------------------------------------------------
        //
        // Temporary database demo values.
        //
        profileEvidence: {
          profileComplete: true,

          portfolioCount: 2,
        },

        // ----------------------------------------------------
        // Completed Work
        // ----------------------------------------------------
        //
        // Temporary database demo values.
        //
        completedWork: {
          completedProjects: 12,

          completedMilestones: 31,

          onTimeCompletionRate:
            0.94,

          averageClientRating:
            4.7,

          totalClientReviews: 10,
        },

        // ----------------------------------------------------
        // Reliability
        // ----------------------------------------------------
        //
        // Temporary database demo values.
        //
        reliability: {
          cancelledProjects: 1,

          disputedProjects: 0,
        },
      };

    // ========================================================
    // LOCAL TRUST SCORE
    // ========================================================

    console.log(
      "\n============================================================",
    );

    console.log(
      "CALCULATING LOCAL TRUST SCORE",
    );

    console.log(
      "============================================================",
    );

    const localResult =
      calculateTrustScore(
        freelancer,
      );

    console.log(
      "✓ Local Trust Score calculated",
    );

    console.log(
      "\n============================================================",
    );

    console.log(
      "LOCAL TRUST SCORE",
    );

    console.log(
      "============================================================",
    );

    console.log(
      `Trust Score: ${localResult.trustScore}/100`,
    );

    console.log(
      `Confidence: ${localResult.confidence}`,
    );

    console.log(
      "\nBreakdown:",
    );

    console.log(
      `Skill Verification:      ${localResult.breakdown.skillVerification}/100`,
    );

    console.log(
      `Evidence Authenticity:   ${localResult.breakdown.evidenceAuthenticity}/100`,
    );

    console.log(
      `Profile & Portfolio:     ${localResult.breakdown.profileEvidence}/100`,
    );

    console.log(
      `Completed Work:          ${localResult.breakdown.completedWork}/100`,
    );

    console.log(
      `Reliability:             ${localResult.breakdown.reliability}/100`,
    );

    // ========================================================
    // SEND TO GONKA
    // ========================================================

    console.log(
      "\n============================================================",
    );

    console.log(
      "SENDING TRUST SCORE TO GONKA",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "Gonka will evaluate whether the proposed Trust Score",
    );

    console.log(
      `${localResult.trustScore}/100 is supported by the evidence.`,
    );

    console.log(
      "Running Trust Score verification...",
    );

    const result =
      await verifyTrustScore(
        SKILL,

        skillEvidence,

        freelancer,
      );

    // ========================================================
    // GONKA MODEL RESULTS
    // ========================================================

    console.log(
      "\n============================================================",
    );

    console.log(
      "GONKA MODEL RESULTS",
    );

    console.log(
      "============================================================",
    );

    result.gonka.modelResults.forEach(
      (
        model,
        index,
      ) => {
        console.log(
          `\nModel ${index + 1}:`,
        );

        console.log(
          `Model: ${model.model}`,
        );

        console.log(
          `Verdict: ${model.verdict}`,
        );

        console.log(
          `Score: ${model.score}`,
        );

        console.log(
          `Confidence: ${model.confidence}`,
        );

        console.log(
          `Request ID: ${
            model.requestId ??
            "N/A"
          }`,
        );

        console.log(
          `Reasoning: ${model.reasoning}`,
        );

        console.log(
          "------------------------------------------------------------",
        );
      },
    );

    // ========================================================
    // GONKA CONSENSUS
    // ========================================================

    console.log(
      "\n============================================================",
    );

    console.log(
      "GONKA CONSENSUS",
    );

    console.log(
      "============================================================",
    );

    console.log(
      `Verdict: ${result.gonka.consensus.verdict}`,
    );

    console.log(
      `Score: ${result.gonka.consensus.score}`,
    );

    console.log(
      `Confidence: ${result.gonka.consensus.confidence}`,
    );

    console.log(
      `Agreement: ${result.gonka.consensus.agreementCount}/${result.gonka.consensus.totalModels}`,
    );

    console.log(
      `Conflict: ${
        result.gonka.consensus.hasConflict
          ? "YES"
          : "NO"
      }`,
    );

    console.log(
      `Successful Models: ${result.gonka.successfulModels}`,
    );

    console.log(
      `Failed Models: ${result.gonka.failedModels}`,
    );

    console.log(
      `Reasoning: ${result.gonka.consensus.reasoning}`,
    );

    // ========================================================
    // FINAL TRUST SCORE RESULT
    // ========================================================

    console.log(
      "\n============================================================",
    );

    console.log(
      "FINAL TRUST SCORE RESULT",
    );

    console.log(
      "============================================================",
    );

    const finalResult = {
      trustScore:
        result.trustScore,

      breakdown:
        result.breakdown,

      github: {
        sessionId,

        id:
          verificationData
            .github!.id,

        username:
          verificationData
            .github!.username,

        name:
          verificationData
            .github!.name,

        profileUrl:
          verificationData
            .github!.profileUrl,

        accountCreatedAt:
          verificationData
            .github!
            .accountCreatedAt,

        ownershipVerified:
          skillEvidence
            .ownershipVerified,

        repositoryCount,

        totalPublicRepositories:
          verificationData
            .repositorySummary!
            .totalPublicRepositories,

        languages:
          verificationData
            .repositorySummary!
            .languages,

        relevantEvidence:
          skillEvidence
            .relevantEvidence,

        repositories:
          skillEvidence
            .relevantEvidence
            .matchingRepositories,
      },

      gonka: {
        verdict:
          result.gonka
            .consensus
            .verdict,

        score:
          result.gonka
            .consensus
            .score,

        confidence:
          result.gonka
            .consensus
            .confidence,

        agreement:
          `${result.gonka.consensus.agreementCount}/${result.gonka.consensus.totalModels}`,

        conflict:
          result.gonka
            .consensus
            .hasConflict,

        reasoning:
          result.gonka
            .consensus
            .reasoning,

        modelResults:
          result.gonka
            .modelResults,
      },
    };

    console.log(
      JSON.stringify(
        finalResult,
        null,
        2,
      ),
    );

    // ========================================================
    // COMPLETE
    // ========================================================

    console.log(
      "\n============================================================",
    );

    console.log(
      "VERIFICATION COMPLETE",
    );

    console.log(
      "============================================================",
    );

    console.log(
      `\nFINAL TRUST SCORE: ${result.trustScore}/100`,
    );

    console.log(
      `GONKA VERDICT: ${result.gonka.consensus.verdict}`,
    );

    console.log(
      `GONKA CONFIDENCE: ${result.gonka.consensus.confidence}`,
    );

    console.log(
      `MODEL AGREEMENT: ${result.gonka.consensus.agreementCount}/${result.gonka.consensus.totalModels}`,
    );

    console.log(
      "\n✓ Trust Score test completed successfully.",
    );
  } catch (error) {
    console.error(
      "\n============================================================",
    );

    console.error(
      "TRUST SCORE TEST FAILED",
    );

    console.error(
      "============================================================",
    );

    console.error(
      error instanceof Error
        ? error.message
        : error,
    );

    process.exitCode = 1;
  } finally {
    // --------------------------------------------------------
    // Stop server only if this test started it
    // --------------------------------------------------------

    if (
      startedByTest &&
      serverProcess
    ) {
      console.log(
        "\nStopping TrustHire test server...",
      );

      serverProcess.kill(
        "SIGTERM",
      );
    }
  }
}

// ============================================================
// RUN
// ============================================================

main().catch(
  (error: unknown) => {
    console.error(
      "\nUnexpected test error:",
      error,
    );

    process.exitCode = 1;
  },
);