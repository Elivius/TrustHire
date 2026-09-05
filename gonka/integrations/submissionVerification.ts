import { gonka } from "../client";

const MODEL =
  process.env.GONKA_SUBMISSION_MODEL ??
  "MiniMaxAI/MiniMax-M2.7";

export interface SubmissionVerificationInput {
  repository: string;
  prNumber: number;

  // What the client asked for
  milestoneRequirement: string;

  // What the freelancer says they implemented
  submissionDescription: string;
}

export interface SubmissionVerificationResult {
  verificationScore: number;
  reasoning: string;
  suggestions: string[];

  gonkaRequestId: string;

  repository: string;
  prNumber: number;
  prTitle: string;
  prDescription: string;
}

/**
 * Workflow E
 *
 * Evaluates a freelancer's milestone submission against
 * the client's milestone requirements.
 *
 * Gonka is used as an evaluator.
 *
 * It does NOT:
 * - approve the milestone
 * - reject the milestone
 * - change milestone status
 * - write to Supabase
 *
 * It only returns:
 * - score
 * - reasoning
 * - suggestions
 */
export async function verifyMilestoneSubmission(
  input: SubmissionVerificationInput,
): Promise<SubmissionVerificationResult> {
  const {
    repository,
    prNumber,
    milestoneRequirement,
    submissionDescription,
  } = input;

  // ============================================================
  // 1. VALIDATE INPUT
  // ============================================================

  if (!repository?.trim()) {
    throw new Error(
      "GitHub repository is required.",
    );
  }

  if (
    !Number.isInteger(prNumber) ||
    prNumber <= 0
  ) {
    throw new Error(
      "A valid GitHub Pull Request number is required.",
    );
  }

  if (!milestoneRequirement?.trim()) {
    throw new Error(
      "Milestone requirement is required.",
    );
  }

  // ============================================================
  // 2. GET GITHUB PULL REQUEST
  // ============================================================

  console.log(
    "[Gonka Submission Verification] Getting GitHub PR...",
  );

  const prResponse = await fetch(
    `https://api.github.com/repos/${repository}/pulls/${prNumber}`,
    {
      headers: {
        Accept:
          "application/vnd.github+json",

        "User-Agent":
          "TrustHire-Workflow-E",
      },
    },
  );

  if (!prResponse.ok) {
    throw new Error(
      `GitHub PR request failed (${prResponse.status}): ${await prResponse.text()}`,
    );
  }

  const pr = await prResponse.json();

  if (!pr || !pr.title) {
    throw new Error(
      "GitHub returned invalid Pull Request data.",
    );
  }

  // ============================================================
  // 3. GET ACTUAL PR DIFF
  // ============================================================

  console.log(
    "[Gonka Submission Verification] Getting PR diff...",
  );

  const diffResponse = await fetch(
    `https://github.com/${repository}/pull/${prNumber}.diff`,
    {
      headers: {
        Accept:
          "application/vnd.github.v3.diff",

        "User-Agent":
          "TrustHire-Workflow-E",
      },
    },
  );

  if (!diffResponse.ok) {
    throw new Error(
      `GitHub diff request failed (${diffResponse.status}): ${await diffResponse.text()}`,
    );
  }

  const diff =
    await diffResponse.text();

  if (!diff.trim()) {
    throw new Error(
      "The GitHub Pull Request contains no readable code changes.",
    );
  }

  // ============================================================
  // 4. BUILD EVALUATION PROMPT
  // ============================================================

  const prompt = `
You are an AI evaluator for TrustHire.

Your job is to evaluate a freelancer's milestone submission.

You must compare TWO sides:

============================================================
CLIENT REQUIREMENT
============================================================

${milestoneRequirement}

============================================================
FREELANCER SUBMISSION
============================================================

${submissionDescription || "(No submission description provided.)"}

============================================================
GITHUB PULL REQUEST
============================================================

Repository:
${repository}

Pull Request:
#${prNumber}

Title:
${pr.title}

Description:
${pr.body || "(No PR description provided.)"}

============================================================
ACTUAL CODE CHANGES
============================================================

${diff}

============================================================
YOUR TASK
============================================================

Determine how well the freelancer's submitted work satisfies
the client's milestone requirement.

Consider:

1. What the client actually requested.
2. What the freelancer claims to have implemented.
3. What the GitHub Pull Request actually demonstrates.
4. Whether the implementation appears complete.
5. Whether important requirements are missing.
6. Whether the implementation contains obvious issues.
7. Whether the evidence supports the freelancer's claims.

IMPORTANT:

The freelancer's description is a CLAIM.

The GitHub diff is EVIDENCE.

Do not automatically trust the freelancer's description if
the actual code changes do not support it.

Do not invent functionality that is not shown in the evidence.

Do not browse GitHub.

Use ONLY the evidence provided above.

============================================================
SCORING
============================================================

Give a score from 0 to 100.

90-100:
Excellent. The implementation strongly satisfies the
client's requirements with good supporting evidence.

75-89:
Good. Most requirements are satisfied but there may be
minor gaps or improvements needed.

50-74:
Partial. Some requirements are implemented but important
parts are missing or insufficiently demonstrated.

25-49:
Weak. Only a small portion of the requested work is
implemented or demonstrated.

0-24:
Very poor. The evidence provides little or no support that
the milestone requirement has been completed.

============================================================
OUTPUT FORMAT
============================================================

Return exactly this structure:

Verification Score: <0-100>

Reasoning:
<Explain clearly how the submitted work compares with the
client's requirements. Mention both satisfied and missing
requirements where applicable.>

Suggestions:
- <specific improvement>
- <specific improvement>
- <specific improvement>

The suggestions should be useful to the freelancer if the
client requests a revision.

Do NOT return PASS or FAIL.

The final decision belongs to the client.
`;

  // ============================================================
  // 5. SEND TO GONKA
  // ============================================================

  console.log(
    "[Gonka Submission Verification] Sending evaluation to Gonka...",
  );

  console.log(
    "[Gonka Submission Verification] Model:",
    MODEL,
  );

    const result =
    await gonka.chat.completions
        .create({
        model: MODEL,

        max_tokens: 2048,

        messages: [
            {
            role: "system",
            content:
                "You are a careful software milestone evaluator. Evaluate client requirements against freelancer evidence without inventing facts.",
            },
            {
            role: "user",
            content: prompt,
            },
        ],
        })
        .withResponse();

    const response = result.data;

    const gonkaRequestId = result.request_id;

    if (!gonkaRequestId) {
    throw new Error(
        "Gonka did not return a request ID",
    );
    }

  const rawResult =
    response.choices[0]?.message?.content;

  if (!rawResult) {
    throw new Error(
      "Gonka returned an empty evaluation.",
    );
  }

  console.log(
    "[Gonka Submission Verification] Raw model response:",
    rawResult,
  );

  // ============================================================
  // 6. PARSE SCORE
  // ============================================================

  const scoreMatch =
    rawResult.match(
      /Verification Score:\s*(\d+(?:\.\d+)?)/i,
    );

  if (!scoreMatch) {
    throw new Error(
      `Could not parse verification score from Gonka response: ${rawResult}`,
    );
  }

  const verificationScore =
    Number(scoreMatch[1]);

  if (
    !Number.isFinite(
      verificationScore,
    ) ||
    verificationScore < 0 ||
    verificationScore > 100
  ) {
    throw new Error(
      `Invalid verification score returned by Gonka: ${verificationScore}`,
    );
  }

  // ============================================================
  // 7. PARSE REASONING
  // ============================================================

  const reasoningMatch =
    rawResult.match(
      /Reasoning:\s*([\s\S]*?)(?:\n\s*Suggestions:|$)/i,
    );

  const reasoning =
    reasoningMatch?.[1]?.trim() ||
    "Gonka did not provide structured reasoning.";

  // ============================================================
  // 8. PARSE SUGGESTIONS
  // ============================================================

  const suggestionsMatch =
    rawResult.match(
      /Suggestions:\s*([\s\S]*)$/i,
    );

  const suggestions =
    suggestionsMatch?.[1]
      ? suggestionsMatch[1]
          .split("\n")
          .map((line) =>
            line
              .replace(
                /^\s*[-*]\s*/,
                "",
              )
              .trim(),
          )
          .filter(Boolean)
      : [];

  // ============================================================
  // 9. RETURN EVALUATION
  // ============================================================

    return {
    verificationScore,
    reasoning,
    suggestions,

    gonkaRequestId,

    repository,
    prNumber,
    prTitle: pr.title,
    prDescription: pr.body || "",
    };
}