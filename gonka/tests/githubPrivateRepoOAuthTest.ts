import dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: ".env.local", override: true });

import express from "express";
import open from "open";
import { randomBytes } from "node:crypto";

// ============================================================
// CONFIGURATION
// ============================================================

const PORT = 3010;

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

const REPOSITORY =
  process.env.GITHUB_TEST_PRIVATE_REPO ??
  "404notfound-j/Travooli_System";

// IMPORTANT:
// Must exactly match the Redirect URI registered
// in your GitHub OAuth App.

const CALLBACK_URL =
  process.env.GITHUB_CALLBACK_URL ??
  "http://localhost:3010/auth/github/callback";

const CALLBACK_PATH = "/auth/github/callback";

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

// ============================================================
// EXPRESS SERVER
// ============================================================

const app = express();

// Random OAuth state protects the callback from CSRF-style attacks.
const state = randomBytes(32).toString("hex");

// ============================================================
// OAUTH CALLBACK
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

    // ----------------------------------------------------------
    // Handle GitHub OAuth error
    // ----------------------------------------------------------

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

      res.status(400).send(`
        <h2>GitHub OAuth failed</h2>
        <p>${error}</p>
      `);

      return shutdown(1);
    }

    // ----------------------------------------------------------
    // Validate authorization code
    // ----------------------------------------------------------

    if (!code) {
      res.status(400).send(
        "Missing OAuth authorization code."
      );

      console.error(
        "❌ No authorization code was returned by GitHub."
      );

      return shutdown(1);
    }

    console.log(
      "✓ Authorization code received"
    );

    // ----------------------------------------------------------
    // Validate OAuth state
    // ----------------------------------------------------------

    if (!returnedState) {
      res.status(400).send(
        "Missing OAuth state."
      );

      console.error(
        "❌ No OAuth state was returned by GitHub."
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

    // ============================================================
    // STEP 2 — EXCHANGE CODE FOR ACCESS TOKEN
    // ============================================================

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
        `❌ GitHub token exchange failed (${tokenResponse.status})`
      );

      console.error(tokenData);

      res.status(500).send(
        "GitHub token exchange failed."
      );

      return shutdown(1);
    }

    const accessToken =
      tokenData.access_token as string;

    // NEVER print the access token.
    console.log(
      "✓ GitHub access token successfully obtained"
    );

    // ============================================================
    // STEP 3 — VERIFY AUTHENTICATED ACCOUNT
    // ============================================================

    header(
      "STEP 3 — AUTHENTICATED GITHUB ACCOUNT"
    );

    const userResponse = await fetch(
      "https://api.github.com/user",
      {
        method: "GET",

        headers: {
          Accept:
            "application/vnd.github+json",

          Authorization:
            `Bearer ${accessToken}`,

          "X-GitHub-Api-Version":
            "2022-11-28",
        },
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
        "Could not retrieve GitHub account."
      );

      return shutdown(1);
    }

    console.log(
      `✓ GitHub account: ${userData.login}`
    );

    console.log(
      `✓ Account ID: ${userData.id}`
    );

    // ============================================================
    // STEP 4 — ACCESS PRIVATE REPOSITORY
    // ============================================================

    header(
      "STEP 4 — PRIVATE REPOSITORY ACCESS"
    );

    console.log(
      `Repository: ${REPOSITORY}`
    );

    console.log(
      "Attempting authenticated repository access..."
    );

    const repoResponse = await fetch(
      `https://api.github.com/repos/${REPOSITORY}`,
      {
        method: "GET",

        headers: {
          Accept:
            "application/vnd.github+json",

          Authorization:
            `Bearer ${accessToken}`,

          "X-GitHub-Api-Version":
            "2022-11-28",
        },
      }
    );

    const repoData =
      await repoResponse.json();

    if (!repoResponse.ok) {
      console.error(
        `❌ Repository access failed (${repoResponse.status})`
      );

      console.error(
        `GitHub message: ${
          repoData.message ?? "Unknown error"
        }`
      );

      if (repoResponse.status === 404) {
        console.error(
          "\nPossible reasons:"
        );

        console.error(
          "1. OAuth token does not have private repository permission."
        );

        console.error(
          "2. The GitHub account does not have access to this repository."
        );

        console.error(
          "3. The repository name is incorrect."
        );
      }

      res.status(403).send(
        "Private repository access failed."
      );

      return shutdown(1);
    }

    console.log(
      "✓ Private repository accessed successfully"
    );

    console.log(
      `✓ Repository: ${repoData.full_name}`
    );

    console.log(
      `✓ Visibility: ${repoData.visibility}`
    );

    console.log(
      `✓ Default branch: ${repoData.default_branch}`
    );

    // ============================================================
    // STEP 5 — READ REPOSITORY CONTENTS
    // ============================================================

    header(
      "STEP 5 — PRIVATE REPOSITORY CONTENT"
    );

    console.log(
      "Reading repository contents..."
    );

    const contentsResponse = await fetch(
      `https://api.github.com/repos/${REPOSITORY}/contents`,
      {
        method: "GET",

        headers: {
          Accept:
            "application/vnd.github+json",

          Authorization:
            `Bearer ${accessToken}`,

          "X-GitHub-Api-Version":
            "2022-11-28",
        },
      }
    );

    const contentsData =
      await contentsResponse.json();

    if (
      !contentsResponse.ok ||
      !Array.isArray(contentsData)
    ) {
      console.error(
        `❌ Repository contents request failed (${contentsResponse.status})`
      );

      console.error(contentsData);

      res.status(403).send(
        "Repository contents could not be read."
      );

      return shutdown(1);
    }

    console.log(
      "✓ Repository contents successfully read"
    );

    console.log(
      `✓ Top-level entries: ${contentsData.length}`
    );

    console.log(
      "\nRepository entries:"
    );

    for (
      const item of contentsData.slice(0, 20)
    ) {
      console.log(
        `  ${
          item.type === "dir"
            ? "📁"
            : "📄"
        } ${item.path}`
      );
    }

    if (contentsData.length > 20) {
      console.log(
        `  ... and ${
          contentsData.length - 20
        } more`
      );
    }

    // ============================================================
    // SUCCESS
    // ============================================================

    header("RESULT");

    console.log(
      "✓ GitHub OAuth authentication works"
    );

    console.log(
      "✓ GitHub account successfully identified"
    );

    console.log(
      "✓ Private repository access works"
    );

    console.log(
      "✓ Private repository contents can be read"
    );

    console.log(
      "✓ Freelancer does NOT need to provide a PAT"
    );

    console.log(
      "✓ Ready for OAuth → Gitingest → Gonka"
    );

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>TrustHire GitHub OAuth Test</title>
        </head>

        <body
          style="
            font-family: sans-serif;
            padding: 40px;
          "
        >
          <h1>
            ✓ GitHub OAuth Test Passed
          </h1>

          <p>
            GitHub account:
            <strong>
              ${userData.login}
            </strong>
          </p>

          <p>
            Private repository:
            <strong>
              ${repoData.full_name}
            </strong>
          </p>

          <p>
            Repository contents were
            successfully accessed.
          </p>

          <p>
            You can now return to the terminal.
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
      "Unexpected OAuth test error."
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
      "REAL GITHUB OAUTH — PRIVATE REPOSITORY TEST"
    );

    console.log(
      `Callback URL: ${CALLBACK_URL}`
    );

    console.log(
      `Callback path: ${CALLBACK_PATH}`
    );

    console.log(
      `Repository: ${REPOSITORY}`
    );

    console.log(
      `Client ID: ${CLIENT_ID}`
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
      "\nAuthorization URL:"
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