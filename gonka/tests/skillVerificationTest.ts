import dotenv from "dotenv";
import { spawn } from "node:child_process";
import { exec } from "node:child_process";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

// ============================================================
// Configuration
// ============================================================

const SERVER_URL =
  process.env.SERVER_URL ??
  "http://localhost:3010";

const SERVER_START_COMMAND =
  process.env.SERVER_START_COMMAND ??
  "pnpm exec tsx server/index.ts";

const SKILL = {
  name: "PHP",
  tier: "Expert" as const,
};

// ============================================================
// Types
// ============================================================

interface OAuthStatusResponse {
  success: boolean;
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
  skills?: unknown[];
  message?: string;
  error?: string;
}

// ============================================================
// Helpers
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

async function waitForServer(): Promise<void> {
  console.log(
    "Waiting for TrustHire server...",
  );

  for (
    let attempt = 0;
    attempt < 30;
    attempt++
  ) {
    try {
      const response =
        await fetch(
          `${SERVER_URL}/`,
        );

      if (response.ok) {
        console.log(
          "✓ TrustHire server is running",
        );

        return;
      }
    } catch {
      // Server is not ready yet.
    }

    await sleep(500);
  }

  throw new Error(
    "TrustHire server did not start within 15 seconds",
  );
}

async function openGitHubOAuth(): Promise<void> {
  const authUrl =
    `${SERVER_URL}/auth/github`;

  console.log(
    "\nOpening GitHub authentication...",
  );

  console.log(
    `URL: ${authUrl}`,
  );

  const platform =
    process.platform;

  if (platform === "darwin") {
    exec(`open "${authUrl}"`);
    return;
  }

  if (platform === "win32") {
    exec(`start "" "${authUrl}"`);
    return;
  }

  exec(`xdg-open "${authUrl}"`);
}

async function waitForOAuthSession(): Promise<string> {
  console.log(
    "\nWaiting for GitHub authorization...",
  );

  for (
    let attempt = 0;
    attempt < 120;
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

  console.log(
    "✓ GitHub evidence retrieved",
  );

  return data;
}

// ============================================================
// Main
// ============================================================

async function main(): Promise<void> {
  console.log(
    "\n============================================================",
  );

  console.log(
    "       TRUSTHIRE REAL GITHUB → GONKA TEST",
  );

  console.log(
    "============================================================\n",
  );

  console.log(
    `Skill: ${SKILL.name}`,
  );

  console.log(
    `Tier: ${SKILL.tier}`,
  );

  // ----------------------------------------------------------
  // Start server
  // ----------------------------------------------------------

  console.log(
    "\nStarting TrustHire server...",
  );

  const serverProcess =
    spawn(
      "sh",
      [
        "-c",
        SERVER_START_COMMAND,
      ],
      {
        stdio: [
          "ignore",
          "pipe",
          "pipe",
        ],
        env: process.env,
      },
    );

  serverProcess.stdout.on(
    "data",
    (data) => {
      process.stdout.write(
        `[server] ${data}`,
      );
    },
  );

  serverProcess.stderr.on(
    "data",
    (data) => {
      process.stderr.write(
        `[server] ${data}`,
      );
    },
  );

  const cleanup =
    () => {
      if (
        !serverProcess.killed
      ) {
        serverProcess.kill(
          "SIGTERM",
        );
      }
    };

  process.on(
    "exit",
    cleanup,
  );

  process.on(
    "SIGINT",
    () => {
      cleanup();
      process.exit(130);
    },
  );

  // ----------------------------------------------------------
  // Wait for server
  // ----------------------------------------------------------

  await waitForServer();

  // ----------------------------------------------------------
  // Open GitHub OAuth
  // ----------------------------------------------------------

  await openGitHubOAuth();

  // ----------------------------------------------------------
  // Wait for OAuth
  // ----------------------------------------------------------

  const sessionId =
    await waitForOAuthSession();

  // ----------------------------------------------------------
  // Get real GitHub evidence
  // ----------------------------------------------------------

  const verificationData =
    await getSkillEvidence(
      sessionId,
    );

  console.log(
    "\n============================================================",
  );

  console.log(
    "                     GITHUB RESULT",
  );

  console.log(
    "============================================================\n",
  );

  console.log(
    JSON.stringify(
      verificationData,
      null,
      2,
    ),
  );

  // ----------------------------------------------------------
  // Extract skill evidence
  // ----------------------------------------------------------

  if (
    !verificationData.skills ||
    verificationData.skills.length === 0
  ) {
    throw new Error(
      "No skill evidence was returned by the server",
    );
  }

  const skillEvidence =
    verificationData.skills[0];

  console.log(
    "\n✓ Skill evidence extracted",
  );

  // ----------------------------------------------------------
  // Import Gonka verification
  // ----------------------------------------------------------

  console.log(
    "\nSending evidence to Gonka...",
  );

  const {
    verifySkill,
  } =
    await import(
      "../integrations/skillVerification.js"
    );

  // ----------------------------------------------------------
  // Run Gonka verification
  // ----------------------------------------------------------

  const result =
    await verifySkill(
      SKILL,
      skillEvidence,
    );

  // ----------------------------------------------------------
  // Model results
  // ----------------------------------------------------------

  console.log(
    "\n============================================================",
  );

  console.log(
    "                     MODEL RESULTS",
  );

  console.log(
    "============================================================\n",
  );

  result.modelResults.forEach(
    (model, index) => {
      console.log(
        `Model ${index + 1}:`,
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

  // ----------------------------------------------------------
  // Consensus
  // ----------------------------------------------------------

  console.log(
    "\n============================================================",
  );

  console.log(
    "                    FINAL CONSENSUS",
  );

  console.log(
    "============================================================\n",
  );

  console.log(
    `Verdict: ${result.consensus.verdict}`,
  );

  console.log(
    `Score: ${result.consensus.score}`,
  );

  console.log(
    `Confidence: ${result.consensus.confidence}`,
  );

  console.log(
    `Agreement: ${
      result.consensus.agreementCount
    }/${result.consensus.totalModels}`,
  );

  console.log(
    `Conflict: ${
      result.consensus.hasConflict
        ? "YES"
        : "NO"
    }`,
  );

  console.log(
    `Successful models: ${result.successfulModels}`,
  );

  console.log(
    `Failed models: ${result.failedModels}`,
  );

  console.log(
    `Reasoning: ${result.consensus.reasoning}`,
  );

  // ----------------------------------------------------------
  // Final result
  // ----------------------------------------------------------

  console.log(
    "\n============================================================",
  );

  console.log(
    "                    FINAL RESULT",
  );

  console.log(
    "============================================================\n",
  );

  console.log(
    JSON.stringify(
      {
        skill: SKILL,

        github:
          verificationData.github,

        evidence:
          skillEvidence,

        gonka:
          result,
      },
      null,
      2,
    ),
  );

  console.log(
    "\n============================================================",
  );

  console.log(
    "                 VERIFICATION COMPLETE",
  );

  console.log(
    "============================================================\n",
  );

  cleanup();
}

// ============================================================
// Run
// ============================================================

main().catch(
  (error: unknown) => {
    console.error(
      "\n============================================================",
    );

    console.error(
      "                    TEST FAILED",
    );

    console.error(
      "============================================================\n",
    );

    if (
      error instanceof Error
    ) {
      console.error(
        error.message,
      );
    } else {
      console.error(error);
    }

    process.exit(1);
  },
);