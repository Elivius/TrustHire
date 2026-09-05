import dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: ".env.local", override: true });

import express from "express";
import open from "open";
import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";

// ============================================================
// CONFIGURATION
// ============================================================

const PORT = 3010;

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

const REPOSITORY =
  process.env.GITHUB_TEST_PRIVATE_REPO ??
  "404notfound-j/Travooli_System";

const CALLBACK_URL =
  process.env.GITHUB_CALLBACK_URL ??
  "http://localhost:3010/auth/github/callback";

const CALLBACK_PATH = "/auth/github/callback";

// Files the "freelancer" selected for milestone verification.
// These simulate the files selected in the future UI.
const SELECTED_FILES = [
  "signIn.php",
  "connection.php",
  "js/sign.js",
];

const GONKA_API_KEY = process.env.GONKA_API_KEY;

const GONKA_URL =
  "https://api.gonkarouter.io/v1/chat/completions";

const GONKA_MODEL =
  process.env.GONKA_MODEL ??
  "MiniMaxAI/MiniMax-M2.7";

// ============================================================
// VALIDATE ENVIRONMENT
// ============================================================

if (!CLIENT_ID) {
  console.error(
    "❌ Missing GITHUB_CLIENT_ID in .env.local"
  );
  process.exit(1);
}

if (!CLIENT_SECRET) {
  console.error(
    "❌ Missing GITHUB_CLIENT_SECRET in .env.local"
  );
  process.exit(1);
}

if (!GONKA_API_KEY) {
  console.error(
    "❌ Missing GONKA_API_KEY in .env.local"
  );
  process.exit(1);
}


// ============================================================
// HELPERS
// ============================================================

function header(title: string) {
  console.log("\n" + "=".repeat(60));
  console.log(title);
  console.log("=".repeat(60));
}

function shutdown(code: number) {
  server.close(() => {
    process.exit(code);
  });
}

function getGitHubHeaders(accessToken: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${accessToken}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

// ============================================================
// EXPRESS SERVER
// ============================================================

const app = express();

const state = randomBytes(32).toString("hex");

// ============================================================
// GITHUB OAUTH CALLBACK
// ============================================================

app.get(CALLBACK_PATH, async (req, res) => {
  try {
    header("STEP 1 — GITHUB OAUTH CALLBACK");

    const code =
      typeof req.query.code === "string"
        ? req.query.code
        : null;

    const returnedState =
      typeof req.query.state === "string"
        ? req.query.state
        : null;

    const error =
      typeof req.query.error === "string"
        ? req.query.error
        : null;

    if (error) {
      console.error(
        `❌ GitHub returned OAuth error: ${error}`
      );

      if (
        typeof req.query.error_description === "string"
      ) {
        console.error(
          `Reason: ${req.query.error_description}`
        );
      }

      res.status(400).send(
        "GitHub OAuth authorization failed."
      );

      return shutdown(1);
    }

    if (!code) {
      res.status(400).send(
        "Missing authorization code."
      );

      console.error(
        "❌ No authorization code returned."
      );

      return shutdown(1);
    }

    console.log(
      "✓ Authorization code received"
    );

    if (!returnedState) {
      res.status(400).send(
        "Missing OAuth state."
      );

      console.error(
        "❌ No OAuth state returned."
      );

      return shutdown(1);
    }

    if (returnedState !== state) {
      res.status(400).send(
        "Invalid OAuth state."
      );

      console.error(
        "❌ OAuth state validation failed."
      );

      return shutdown(1);
    }

    console.log(
      "✓ OAuth state validated"
    );

    // ==========================================================
    // STEP 2 — EXCHANGE CODE FOR TOKEN
    // ==========================================================

    header(
      "STEP 2 — EXCHANGE CODE FOR ACCESS TOKEN"
    );

    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",

        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code,
          redirect_uri: CALLBACK_URL,
        }),
      }
    );

    const tokenData =
      await tokenResponse.json();

    if (
      !tokenResponse.ok ||
      !tokenData.access_token
    ) {
      console.error(
        `❌ Token exchange failed (${tokenResponse.status})`
      );

      console.error(tokenData);

      res.status(500).send(
        "GitHub token exchange failed."
      );

      return shutdown(1);
    }

    const accessToken =
      tokenData.access_token as string;

    console.log(
      "✓ GitHub access token obtained"
    );

    // ==========================================================
    // STEP 3 — VERIFY ACCOUNT
    // ==========================================================

    header(
      "STEP 3 — AUTHENTICATED GITHUB ACCOUNT"
    );

    const userResponse = await fetch(
      "https://api.github.com/user",
      {
        headers:
          getGitHubHeaders(accessToken),
      }
    );

    const userData =
      await userResponse.json();

    if (!userResponse.ok) {
      console.error(
        `❌ GitHub user request failed (${userResponse.status})`
      );

      console.error(userData);

      res.status(500).send(
        "GitHub account lookup failed."
      );

      return shutdown(1);
    }

    console.log(
      `✓ GitHub account: ${userData.login}`
    );

    // ==========================================================
    // STEP 4 — VERIFY PRIVATE REPOSITORY
    // ==========================================================

    header(
      "STEP 4 — PRIVATE REPOSITORY"
    );

    console.log(
      `Repository: ${REPOSITORY}`
    );

    const repoResponse = await fetch(
      `https://api.github.com/repos/${REPOSITORY}`,
      {
        headers:
          getGitHubHeaders(accessToken),
      }
    );

    const repoData =
      await repoResponse.json();

    if (!repoResponse.ok) {
      console.error(
        `❌ Repository access failed (${repoResponse.status})`
      );

      console.error(repoData);

      res.status(403).send(
        "Private repository access failed."
      );

      return shutdown(1);
    }

    console.log(
      "✓ Private repository accessed"
    );

    console.log(
      `✓ Visibility: ${repoData.visibility}`
    );

    console.log(
      `✓ Default branch: ${repoData.default_branch}`
    );

    const commitRef =
      repoData.default_branch;

    // ==========================================================
    // STEP 5 — SELECTED FILES
    // ==========================================================

    header(
      "STEP 5 — FREELANCER FILE SELECTION"
    );

    console.log(
      "Files selected for milestone verification:"
    );

    for (const file of SELECTED_FILES) {
      console.log(`  ☑ ${file}`);
    }

    console.log(
      `\nTotal selected: ${SELECTED_FILES.length}`
    );

    // ==========================================================
    // STEP 6 — RETRIEVE ONLY SELECTED FILES
    // ==========================================================

    header(
      "STEP 6 — RETRIEVE SELECTED FILES"
    );

    const evidenceParts: string[] = [];

    for (const filePath of SELECTED_FILES) {
      console.log(
        `Retrieving: ${filePath}`
      );

      const encodedPath = filePath
        .split("/")
        .map(encodeURIComponent)
        .join("/");

      const fileUrl =
        `https://api.github.com/repos/${REPOSITORY}/contents/${encodedPath}?ref=${encodeURIComponent(commitRef)}`;

      const fileResponse = await fetch(
        fileUrl,
        {
          headers:
            getGitHubHeaders(accessToken),
        }
      );

      const fileData =
        await fileResponse.json();

      if (!fileResponse.ok) {
        console.error(
          `❌ Failed to retrieve ${filePath}`
        );

        console.error(fileData);

        res.status(500).send(
          `Failed to retrieve ${filePath}`
        );

        return shutdown(1);
      }

      if (
        fileData.type !== "file" ||
        !fileData.content
      ) {
        console.error(
          `❌ ${filePath} is not a readable file`
        );

        res.status(500).send(
          `Invalid file response for ${filePath}`
        );

        return shutdown(1);
      }

      const content = Buffer.from(
        fileData.content,
        "base64"
      ).toString("utf-8");

      console.log(
        `✓ Retrieved ${filePath} (${content.length} characters)`
      );

      evidenceParts.push(
        [
          "================================================",
          `FILE: ${filePath}`,
          "================================================",
          content,
          "",
        ].join("\n")
      );
    }

    // ==========================================================
    // BUILD EVIDENCE
    // ==========================================================

    const evidence =
      evidenceParts.join("\n");

    console.log(
      `\n✓ Selected-file evidence created`
    );

    console.log(
      `✓ Evidence size: ${evidence.length.toLocaleString()} characters`
    );

    // ==========================================================
    // SAVE LOCAL EVIDENCE
    // ==========================================================

    header(
      "STEP 7 — SAVE GITINGEST-STYLE EVIDENCE"
    );

    const outputPath =
      "gonka/tests/.selected-files-evidence.txt";

    await fs.writeFile(
      outputPath,
      evidence,
      "utf-8"
    );

    console.log(
      `✓ Evidence saved to: ${outputPath}`
    );

    // ==========================================================
    // STEP 8 — SEND SELECTED EVIDENCE TO GONKA
    // ==========================================================

    header(
      "STEP 8 — SELECTED FILES → GONKA"
    );

    console.log(
      `Model: ${GONKA_MODEL}`
    );

    console.log(
      "Sending ONLY selected-file evidence to Gonka..."
    );

    const milestoneRequirement =
      `
Milestone requirement:
Implement user login functionality.

The user should be able to:
1. Enter their login credentials.
2. Authenticate against the database.
3. Successfully access the application after authentication.

Evaluate ONLY the provided code evidence.
Do not assume functionality that is not visible in the evidence.

Return:
- verification_score: integer 0-100
- reasoning: concise explanation
- suggestions: array of improvement suggestions
`;

    const gonkaPayload = {
      model: GONKA_MODEL,

      messages: [
        {
          role: "system",
          content:
            "You are a software milestone verification assistant. Evaluate only the supplied code evidence. Do not claim functionality that is not supported by the evidence.",
        },

        {
          role: "user",
          content: [
            milestoneRequirement,

            "\n\nRepository:",
            REPOSITORY,

            "\nCommit:",
            commitRef,

            "\nSelected files:",
            SELECTED_FILES.join(", "),

            "\n\nCODE EVIDENCE:\n",
            evidence,
          ].join(""),
        },
      ],

      temperature: 0.1,
    };

const gonkaResponse = await fetch(
  GONKA_URL,
  {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GONKA_API_KEY}`,
    },

    body: JSON.stringify({
      model: GONKA_MODEL,

      messages: [
        {
          role: "system",
          content:
            "You are a software milestone verification assistant. Evaluate only the supplied code evidence. Do not claim functionality that is not supported by the evidence.",
        },
        {
          role: "user",
          content: [
            milestoneRequirement,
            "\n\nRepository: ",
            REPOSITORY,
            "\nCommit: ",
            commitRef,
            "\nSelected files: ",
            SELECTED_FILES.join(", "),
            "\n\nCODE EVIDENCE:\n",
            evidence,
          ].join(""),
        },
      ],

      temperature: 0.1,
    }),
  }
);

    const gonkaText =
      await gonkaResponse.text();

    if (!gonkaResponse.ok) {
      console.error(
        `❌ Gonka request failed (${gonkaResponse.status})`
      );

      console.error(
        gonkaText
      );

      res.status(500).send(
        "Gonka verification failed."
      );

      return shutdown(1);
    }

    // ==========================================================
    // GONKA RESULT
    // ==========================================================

    header(
      "GONKA VERIFICATION RESULT"
    );

    console.log(
      gonkaText
    );

    // ==========================================================
    // FINAL RESULT
    // ==========================================================

    header(
      "✓ SELECTED FILE VERIFICATION TEST PASSED"
    );

    console.log(
      "✓ GitHub OAuth authentication works"
    );

    console.log(
      "✓ Private repository accessed"
    );

    console.log(
      "✓ Freelancer selected specific files"
    );

    console.log(
      "✓ Only selected files were retrieved"
    );

    console.log(
      "✓ Evidence generated from selected files"
    );

    console.log(
      "✓ Evidence sent to Gonka"
    );

    console.log(
      "✓ Gonka verification completed"
    );

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>TrustHire Selected File Test</title>
        </head>

        <body
          style="
            font-family: sans-serif;
            padding: 40px;
          "
        >
          <h1>
            ✓ Selected File Verification Test Passed
          </h1>

          <p>
            GitHub OAuth successfully accessed
            the private repository.
          </p>

          <p>
            ${SELECTED_FILES.length}
            selected files were retrieved
            and sent to Gonka.
          </p>

          <p>
            You can return to the terminal.
          </p>
        </body>
      </html>
    `);

    setTimeout(() => {
      shutdown(0);
    }, 500);
  } catch (error) {
    console.error(
      "\n❌ Unexpected error:"
    );

    console.error(error);

    res.status(500).send(
      "Unexpected test error."
    );

    shutdown(1);
  }
});

// ============================================================
// START SERVER
// ============================================================

const server = app.listen(
  PORT,
  async () => {
    header(
      "REAL GITHUB → SELECTED FILES → GONKA TEST"
    );

    console.log(
      `Callback URL: ${CALLBACK_URL}`
    );

    console.log(
      `Repository: ${REPOSITORY}`
    );

    console.log(
      `Selected files: ${SELECTED_FILES.length}`
    );

    console.log(
      `Gonka model: ${GONKA_MODEL}`
    );

    console.log(
      "\n✓ Test server started"
    );

    // ==========================================================
    // CREATE GITHUB AUTHORIZATION URL
    // ==========================================================

    const authorizationUrl =
      new URL(
        "https://github.com/login/oauth/authorize"
      );

    authorizationUrl.searchParams.set(
      "client_id",
      CLIENT_ID
    );

    authorizationUrl.searchParams.set(
      "redirect_uri",
      CALLBACK_URL
    );

    authorizationUrl.searchParams.set(
      "scope",
      "repo"
    );

    authorizationUrl.searchParams.set(
      "state",
      state
    );

    header(
      "GITHUB AUTHORIZATION"
    );

    console.log(
      "Opening GitHub authorization page..."
    );

    console.log(
      authorizationUrl.toString()
    );

    console.log(
      "\nWaiting for GitHub authorization..."
    );

    await open(
      authorizationUrl.toString()
    );
  }
);