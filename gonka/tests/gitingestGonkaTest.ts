import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { gonka } from "../client.js";

const MODEL = "MiniMaxAI/MiniMax-M2.7";

const PYTHON_SCRIPT = path.resolve(
  process.cwd(),
  "gonka/tests/gitingestPrivateTest.py",
);

const EVIDENCE_FILE = path.resolve(
  process.cwd(),
  "gonka/tests/.gitingest-evidence.json",
);


// ============================================================
// MILESTONE
// ============================================================

const MILESTONE_REQUIREMENT = `
Implement the user login functionality.

The milestone should allow an existing user to:

1. Enter their login credentials.
2. Authenticate against the database.
3. Successfully access the application after authentication.
`;


// ============================================================
// RUN GITINGEST
// ============================================================

function runGitingest() {
  console.log("============================================================");
  console.log("STEP 1 — PRIVATE REPOSITORY → GITINGEST");
  console.log("============================================================");

  try {
    execFileSync(
      "python",
      [PYTHON_SCRIPT],
      {
        stdio: "inherit",
        cwd: process.cwd(),
      },
    );
  } catch (error) {
    throw new Error(
      "Gitingest failed. See the Python output above.",
    );
  }
}


// ============================================================
// LOAD EVIDENCE
// ============================================================

function loadEvidence() {
  if (!fs.existsSync(EVIDENCE_FILE)) {
    throw new Error(
      `Evidence file was not created: ${EVIDENCE_FILE}`,
    );
  }

  const raw = fs.readFileSync(
    EVIDENCE_FILE,
    "utf-8",
  );

  return JSON.parse(raw);
}


// ============================================================
// GONKA VERIFICATION
// ============================================================

async function verifyWithGonka(
  evidenceData: {
    repository: string;
    selected_files: string[];
    missing_files: string[];
    evidence: string;
    evidence_size: number;
  },
) {
  console.log("\n============================================================");
  console.log("STEP 2 — GITINGEST EVIDENCE → GONKA");
  console.log("============================================================");

  console.log(
    `Selected files: ${evidenceData.selected_files.join(", ")}`,
  );

  console.log(
    `Evidence size: ${evidenceData.evidence_size.toLocaleString()} characters`,
  );

  console.log(`Model: ${MODEL}`);

  const prompt = `
You are verifying a freelancer's software milestone submission.

The source repository is PRIVATE.

TrustHire retrieved the repository using authenticated
Gitingest access.

You are NOT browsing GitHub.

You must evaluate ONLY the code evidence provided below.

============================================================
MILESTONE REQUIREMENT
============================================================

${MILESTONE_REQUIREMENT}

============================================================
REPOSITORY
============================================================

${evidenceData.repository}

============================================================
SELECTED FILES
============================================================

${evidenceData.selected_files.join("\n")}

============================================================
CODE EVIDENCE
============================================================

${evidenceData.evidence}

============================================================
VERIFICATION TASK
============================================================

Determine how well the provided code evidence satisfies
the milestone requirement.

Return exactly:

Verification Score: <0-100>

Reasoning:
<detailed reasoning based on the provided code>

Suggestions:
- <suggestion>
- <suggestion>

IMPORTANT:

- Only use the provided evidence.
- Do not claim that you browsed GitHub.
- Do not invent files or functionality.
- Do not assume functionality that is not visible.
- Distinguish actual code evidence from assumptions.
- A high score requires strong evidence that the milestone
  functionality is actually implemented.
`;

  console.log("\nSending verification request to Gonka...\n");

  const response = await gonka.chat.completions.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: "system",
        content:
          "You are a careful software milestone verification assistant.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const result =
    response.choices[0]?.message?.content;

  console.log("============================================================");
  console.log("GONKA VERIFICATION RESULT");
  console.log("============================================================");

  console.log(result ?? "No response");

  console.log("\n============================================================");
  console.log("TRANSPARENCY");
  console.log("============================================================");

  console.log(`Gonka Request ID: ${response.id}`);

  return response;
}


// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log("\n");
  console.log("============================================================");
  console.log("REAL GONKA — WORKFLOW E END-TO-END TEST");
  console.log("============================================================");

  // Step 1
  runGitingest();

  // Step 2
  const evidenceData = loadEvidence();

  // Step 3
  await verifyWithGonka(evidenceData);

  console.log("\n============================================================");
  console.log("✓ WORKFLOW E END-TO-END TEST PASSED");
  console.log("============================================================");
}


main().catch((error) => {
  console.error("\n❌ WORKFLOW E TEST FAILED");
  console.error(error);
  process.exit(1);
});