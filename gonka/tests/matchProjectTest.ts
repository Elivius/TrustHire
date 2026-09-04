import assert from "node:assert/strict";
import {
  getMatchModel,
  type MatchFreelancer,
  type MatchProject,
} from "../integrations/matchEngine.js";
import { matchProjects } from "../integrations/matchProjects.js";

// ============================================================
// MODEL CONFIGURATION TEST
// ============================================================

const previousModel = process.env.GONKA_MATCH_MODEL;

process.env.GONKA_MATCH_MODEL = "MiniMaxAI/MiniMax-M2.7";

assert.equal(
  getMatchModel(),
  "MiniMaxAI/MiniMax-M2.7",
);

if (previousModel === undefined) {
  delete process.env.GONKA_MATCH_MODEL;
} else {
  process.env.GONKA_MATCH_MODEL = previousModel;
}

console.log("✓ matchProjects configuration tests passed");

// ============================================================
// B2 TEST DATA
// ============================================================

const freelancer: MatchFreelancer = {
  id: "freelancer-1",
  name: "A",
  skills: [
    "React",
    "Node.js",
    "MySQL",
    "Payment Gateway Integration",
  ],
  bio: "Full-stack developer experienced in e-commerce applications.",
  experienceLevel: "Intermediate",
  trustScore: 88,
};

const projects: MatchProject[] = [
  {
    id: "project-1",
    projectTitle: "Computer Gadget E-commerce Website",
    projectDescription:
      "Build an e-commerce website with product browsing, ordering, and online payment.",
    requiredSkills: [
      "React",
      "Node.js",
      "MySQL",
      "Payment Gateway Integration",
    ],
    explicitSkills: [
    "React",
    "Payment Gateway Integration",
    ],
    experienceLevel: "Intermediate",
    budget: {
      amount: 5000,
      currency: "MYR",
    },
    estimatedTimelineDays: 30,
  },

  {
    id: "project-2",
    projectTitle: "Python Data Dashboard",
    projectDescription:
      "Build a dashboard for analysing business data with Python.",
    requiredSkills: [
      "Python",
      "Django",
      "Pandas",
    ],
    experienceLevel: "Intermediate",
    budget: {
      amount: 4000,
      currency: "MYR",
    },
    estimatedTimelineDays: 30,
  },
];

// ============================================================
// REAL GONKA B2 INTEGRATION TEST
// ============================================================

async function runGonkaTest(): Promise<void> {
  if (!process.env.GONKA_API_KEY?.trim()) {
    console.log(
      "⚠ Skipping real Gonka B2 integration test: GONKA_API_KEY is not configured.",
    );
    return;
  }

  console.log("\n============================================================");
  console.log("REAL GONKA B2 — MATCH PROJECTS");
  console.log("============================================================");

  const results = await matchProjects({
    freelancer,
    projects,
  });

  // ----------------------------------------------------------
  // 1. EVERY PROJECT SHOULD HAVE A RESULT
  // ----------------------------------------------------------

  assert.equal(
    results.length,
    projects.length,
    "Every supplied project should receive a match result",
  );

  // ----------------------------------------------------------
  // 2. NO DUPLICATE PROJECT RESULTS
  // ----------------------------------------------------------

  const resultProjectIds = results.map(
    (result) => result.projectId,
  );

  assert.equal(
    new Set(resultProjectIds).size,
    projects.length,
    "Each project should appear exactly once",
  );

  // ----------------------------------------------------------
  // 3. RESULT VALIDATION
  // ----------------------------------------------------------

  const expectedProjectIds = new Set(
    projects.map((project) => project.id),
  );

  for (const result of results) {
    assert.ok(
      expectedProjectIds.has(result.projectId),
      `Unexpected project ID: ${result.projectId}`,
    );

    // Match Score must be 0-100.
    assert.ok(Number.isInteger(result.matchScore));
    assert.ok(result.matchScore >= 0);
    assert.ok(result.matchScore <= 100);

    // Gonka must provide reasoning.
    // Gonka must provide reasoning.
assert.equal(
  typeof result.reasoning,
  "string",
  "Reasoning should be returned as a string",
);

assert.ok(
  result.reasoning.trim().length > 0,
  `Reasoning should not be empty for ${result.projectId}`,
);

// Project 1 has explicit client requirements.
// Gonka's reasoning should show that it considered them.
if (result.projectId === "project-1") {
  assert.ok(
    /react|payment gateway/i.test(result.reasoning),
    "Project-1 reasoning should reference a relevant explicit requirement",
  );
}

    // Gonka request ID must exist.
    assert.ok(result.gonkaRequestId.trim().length > 0);
  }

  // ----------------------------------------------------------
  // 4. RESULTS MUST BE RANKED
  // ----------------------------------------------------------

  for (let i = 1; i < results.length; i++) {
    assert.ok(
      results[i - 1].matchScore >= results[i].matchScore,
      "Projects must be sorted by Match Score descending",
    );
  }

  console.log("\n✓ Real Gonka B2 integration test passed");

  console.log(`Scored projects: ${results.length}`);

    for (const result of results) {
    console.log(
        `  ${result.projectId}: Match ${result.matchScore}/100 | ` +
        `Request ${result.gonkaRequestId}`,
    );

    console.log(
        `    Reasoning: ${result.reasoning}`,
    );
    }
}

runGonkaTest().catch((error) => {
  console.error("\n✗ Real Gonka B2 integration test failed");
  console.error(error);
  process.exitCode = 1;
});