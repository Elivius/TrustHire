import { gonka } from "../client.js";

const MODEL = "MiniMaxAI/MiniMax-M2.7";

const REPO = "octocat/Hello-World";
const PR_NUMBER = 11072;

const MILESTONE_REQUIREMENT =
  "Convert the repository README into a properly formatted README.md file.";

const SUBMISSION_DESCRIPTION =
  "Converted the legacy README file into README.md and formatted it using Markdown headers and a description.";

async function main() {
  console.log("============================================================");
  console.log("WORKFLOW E — GITHUB PR + GONKA VERIFICATION TEST");
  console.log("============================================================");

  console.log(`Repository : ${REPO}`);
  console.log(`PR         : #${PR_NUMBER}`);
  console.log(`Model      : ${MODEL}`);

  // ----------------------------------------------------------
  // STEP 1 — Retrieve GitHub PR metadata
  // ----------------------------------------------------------

  console.log("\n[1/3] Retrieving GitHub PR...");

  const prResponse = await fetch(
    `https://api.github.com/repos/${REPO}/pulls/${PR_NUMBER}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "TrustHire-Workflow-E-Test",
      },
    },
  );

  if (!prResponse.ok) {
    throw new Error(
      `GitHub PR request failed (${prResponse.status}): ${await prResponse.text()}`,
    );
  }

  const pr = await prResponse.json();

  console.log("✓ GitHub PR retrieved");
  console.log(`Title: ${pr.title}`);
  console.log(`Body : ${pr.body || "(no PR description)"}`);

  // ----------------------------------------------------------
  // STEP 2 — Retrieve actual PR diff
  // ----------------------------------------------------------

  console.log("\n[2/3] Retrieving GitHub PR diff...");

  const diffResponse = await fetch(
    `https://github.com/${REPO}/pull/${PR_NUMBER}.diff`,
    {
      headers: {
        Accept: "application/vnd.github.v3.diff",
        "User-Agent": "TrustHire-Workflow-E-Test",
      },
    },
  );

  if (!diffResponse.ok) {
    throw new Error(
      `GitHub diff request failed (${diffResponse.status}): ${await diffResponse.text()}`,
    );
  }

  const diff = await diffResponse.text();

  console.log("✓ PR diff retrieved");
  console.log(`Diff length: ${diff.length} characters`);

  // ----------------------------------------------------------
  // STEP 3 — Send actual evidence to Gonka
  // ----------------------------------------------------------

  console.log("\n[3/3] Sending evidence to Gonka...\n");

  const prompt = `
You are verifying a freelancer milestone submission.

Your task is NOT to browse the GitHub URL.

TrustHire has already retrieved the GitHub Pull Request and is providing
the actual evidence to you below.

============================================================
MILESTONE REQUIREMENT
============================================================

${MILESTONE_REQUIREMENT}

============================================================
FREELANCER SUBMISSION DESCRIPTION
============================================================

${SUBMISSION_DESCRIPTION}

============================================================
GITHUB PULL REQUEST
============================================================

Repository:
${REPO}

Pull Request:
#${PR_NUMBER}

Title:
${pr.title}

PR Description:
${pr.body || "(none)"}

============================================================
ACTUAL CODE DIFF
============================================================

${diff}

============================================================
VERIFICATION TASK
============================================================

Evaluate whether the submitted work satisfies the milestone requirement.

Return:

1. Verification Score: 0-100

2. Reasoning:
Explain specifically what evidence in the PR supports or does not
support completion of the milestone.

3. Suggestions:
List any missing work, concerns, or improvements.

IMPORTANT:
- Only use the evidence provided above.
- Do not claim that you browsed GitHub.
- Do not invent files or implementation details.
- Distinguish between what the freelancer claims and what the diff
  actually demonstrates.
`;

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

  const result = response.choices[0]?.message?.content;

  console.log("============================================================");
  console.log("GONKA VERIFICATION RESULT");
  console.log("============================================================");

  console.log(result ?? "No response content");

  console.log("\n============================================================");
  console.log("TRANSPARENCY");
  console.log("============================================================");

  console.log(`Gonka Request ID: ${response.id}`);

  console.log("\n============================================================");
  console.log("✓ WORKFLOW E TEST COMPLETE");
  console.log("============================================================");
}

main().catch((error) => {
  console.error("\n❌ Workflow E test failed:");
  console.error(error);
  process.exit(1);
});