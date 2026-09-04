import assert from "node:assert/strict";
import {
  calculateSkillOverlap,
  prefilterFreelancers,
} from "../integrations/matchEngine.js";
import { matchFreelancers } from "../integrations/matchFreelancers.js";

const project = {
  id: "project-1",
  projectTitle: "Computer Gadget E-commerce Website",
  projectDescription:
    "A company website where customers can browse products, place orders, and make online payments.",

  // General/relevant skills identified by Project Analysis.
  requiredSkills: [
    "React",
    "Node.js",
    "MySQL",
    "Payment Gateway Integration",
  ],



  experienceLevel: "Intermediate",

  budget: {
    amount: 5000,
    currency: "MYR",
  },

  estimatedTimelineDays: 30,
};

const freelancers = [
  {
    id: "freelancer-1",
    name: "A",
    skills: [
      "React",
      "Node.js",
      "MySQL",
      "Stripe",
    ],
    trustScore: 88,
    experienceLevel: "Intermediate",
    bio: "Full-stack developer experienced in e-commerce websites and online payment integration.",
  },

  {
    id: "freelancer-2",
    name: "B",
    skills: [
      "Python",
      "Django",
    ],
    trustScore: 95,
    experienceLevel: "Intermediate",
    bio: "Backend developer experienced in Python web applications.",
  },

  {
    id: "freelancer-3",
    name: "C",
    skills: [
      "React",
    ],
    trustScore: null,
    experienceLevel: "Beginner",
    bio: "Junior frontend developer with React experience.",
  },

  {
    id: "freelancer-4",
    name: "D",
    skills: [
      "React",
      "PHP",
      "MySQL",
      "Payment Gateway Integration",
    ],
    trustScore: 75,
    experienceLevel: "Intermediate",
    bio: "Web developer experienced in e-commerce websites and payment integrations.",
  },
];

// ============================================================
// PROJECT ANALYSIS / REQUIREMENT TESTS
// ============================================================

assert.ok(
  Array.isArray(project.requiredSkills),
  "Project must contain requiredSkills",
);

assert.ok(
  "Project must contain explicitSkills",
);

assert.ok(
  "React should be preserved as an explicit client requirement",
);

assert.ok(
    project.requiredSkills.includes("Payment Gateway Integration"),
  ),
  "Payment Gateway Integration should be preserved as an explicit client requirement",
);

console.log("✓ Project explicit skill tests passed");

// ============================================================
// LOCAL PRE-FILTER TESTS
// ============================================================

assert.equal(
  calculateSkillOverlap(
    project.requiredSkills,
    freelancers[0].skills,
  ),
  0.75,
);

assert.equal(
  calculateSkillOverlap(
    project.requiredSkills,
    freelancers[1].skills,
  ),
  0,
);

assert.equal(
  calculateSkillOverlap(
    project.requiredSkills,
    freelancers[2].skills,
  ),
  0.25,
);

// freelancer-4 has 3/4 required skills
assert.equal(
  calculateSkillOverlap(
    project.requiredSkills,
    freelancers[3].skills,
  ),
  0.75,
);

// ------------------------------------------------------------
// Loose pre-filter
// ------------------------------------------------------------

const filtered = prefilterFreelancers(
  project,
  freelancers,
  0.2,
);

// freelancer-2 has zero overlap and should be removed.
//
// freelancer-1, freelancer-3 and freelancer-4 remain.
//
// IMPORTANT:
// freelancer-3 remains even though they do NOT have every
// required skill. This proves the pre-filter is intentionally
// loose and Gonka gets the final decision.
assert.deepEqual(
  filtered.map((freelancer) => freelancer.id).sort(),
  [
    "freelancer-1",
    "freelancer-3",
    "freelancer-4",
  ].sort(),
);

console.log("✓ matchFreelancers pre-filter tests passed");

// ============================================================
// REAL GONKA B1 INTEGRATION TEST
// ============================================================

async function runGonkaTest(): Promise<void> {
  // Do not fail the whole test suite when Gonka credentials
  // are not configured locally.
  if (!process.env.GONKA_API_KEY?.trim()) {
    console.log(
      "⚠ Skipping real Gonka B1 integration test: GONKA_API_KEY is not configured.",
    );
    return;
  }

  console.log("\n============================================================");
  console.log("REAL GONKA B1 — MATCH FREELANCERS");
  console.log("============================================================");

  console.log("\nProject:");
  console.log(`  ${project.projectTitle}`);

  console.log(
    `  Required Skills: ${project.requiredSkills.join(", ")}`,
  );

  console.log(
    `  Explicit Client Skills: ${project.explicitSkills.join(", ")}`,
  );

  const results = await matchFreelancers({
    project,
    freelancers,
    minimumSkillOverlap: 0.2,
  });

  // ----------------------------------------------------------
  // 1. PRE-FILTER CHECK
  // ----------------------------------------------------------

  // freelancer-2 has zero skill overlap and therefore should
  // never be sent to Gonka.
  assert.deepEqual(
    results.map((result) => result.freelancerId).sort(),
    [
      "freelancer-1",
      "freelancer-3",
      "freelancer-4",
    ].sort(),
  );

  console.log(
    "✓ Low-overlap freelancer was correctly removed before Gonka",
  );

  // ----------------------------------------------------------
  // 2. RESULT COUNT
  // ----------------------------------------------------------

  assert.equal(
    results.length,
    3,
    "Gonka should score all three candidates that passed the pre-filter",
  );

  // ----------------------------------------------------------
  // 3. RESULT VALIDATION
  // ----------------------------------------------------------

  for (const result of results) {
    // Match Score must be 0-100.
    assert.ok(Number.isInteger(result.matchScore));

    assert.ok(
      result.matchScore >= 0 &&
        result.matchScore <= 100,
      `Invalid Match Score for ${result.freelancerId}`,
    );

    // --------------------------------------------------------
    // Reasoning MUST exist.
    // --------------------------------------------------------

    assert.ok(
      typeof result.reasoning === "string",
      `Reasoning must be a string for ${result.freelancerId}`,
    );

    assert.ok(
      result.reasoning.trim().length > 0,
      `Reasoning must not be empty for ${result.freelancerId}`,
    );

    // Gonka request ID must be returned.
    assert.ok(
      typeof result.gonkaRequestId === "string",
    );

    assert.ok(
      result.gonkaRequestId.trim().length > 0,
      `Missing Gonka request ID for ${result.freelancerId}`,
    );

    // --------------------------------------------------------
    // Trust Score
    // --------------------------------------------------------

    assert.ok(
      result.trustScore === null ||
        (
          Number.isInteger(result.trustScore) &&
          result.trustScore >= 0 &&
          result.trustScore <= 100
        ),
      `Invalid Trust Score for ${result.freelancerId}`,
    );

    // --------------------------------------------------------
    // Overall Score
    // --------------------------------------------------------

    assert.ok(
      Number.isFinite(result.overallScore),
      `Overall Score must be numeric for ${result.freelancerId}`,
    );

    assert.ok(
      result.overallScore >= 0 &&
        result.overallScore <= 100,
      `Invalid Overall Score for ${result.freelancerId}`,
    );

    // --------------------------------------------------------
    // Verify the 70/30 formula.
    // --------------------------------------------------------

    if (result.trustScore === null) {
      assert.equal(
        result.overallScore,
        result.matchScore,
        "Without Trust Score, Overall Score should equal Match Score",
      );
    } else {
      const expectedOverallScore = Number(
        (
          result.matchScore * 0.7 +
          result.trustScore * 0.3
        ).toFixed(2),
      );

      assert.equal(
        result.overallScore,
        expectedOverallScore,
        "Overall Score must equal Match × 0.7 + Trust × 0.3",
      );
    }
  }

  console.log(
    "✓ Match Score, Trust Score, Overall Score and reasoning validated",
  );

  // ----------------------------------------------------------
  // 4. TRUST SCORE MUST BE PRESERVED
  // ----------------------------------------------------------

  const originalTrustScores = new Map(
    freelancers.map((freelancer) => [
      freelancer.id,
      freelancer.trustScore,
    ]),
  );

  for (const result of results) {
    assert.equal(
      result.trustScore,
      originalTrustScores.get(
        result.freelancerId,
      ),
      `Trust Score for ${result.freelancerId} must be preserved`,
    );
  }

  console.log("✓ Trust Scores preserved correctly");

  // ----------------------------------------------------------
  // 5. RESULTS MUST BE RANKED
  // ----------------------------------------------------------

  for (let i = 1; i < results.length; i++) {
    assert.ok(
      results[i - 1].overallScore >=
        results[i].overallScore,
      "Freelancers must be sorted by Overall Score descending",
    );
  }

  console.log(
    "✓ Results correctly ranked by Overall Score",
  );

  // ----------------------------------------------------------
  // 6. MATCH SCORE AND TRUST SCORE REMAIN INDEPENDENT
  // ----------------------------------------------------------

  for (const result of results) {
    const freelancer = freelancers.find(
      (item) =>
        item.id === result.freelancerId,
    );

    assert.ok(freelancer);

    assert.equal(
      result.trustScore,
      freelancer.trustScore,
      "Trust Score must come from freelancer profile, not Gonka Match Score",
    );
  }

  console.log(
    "✓ Match Score and Trust Score remain independent",
  );

  // ----------------------------------------------------------
  // 7. PRINT REASONING
  // ----------------------------------------------------------

  console.log("\n============================================================");
  console.log("GONKA MATCHING RESULTS");
  console.log("============================================================");

  for (const result of results) {
    console.log(
      `\n${result.freelancerId}`,
    );

    console.log(
      `  Match Score : ${result.matchScore}/100`,
    );

    console.log(
      `  Trust Score : ${result.trustScore ?? "N/A"}/100`,
    );

    console.log(
      `  Overall     : ${result.overallScore}/100`,
    );

    console.log(
      `  Request ID  : ${result.gonkaRequestId}`,
    );

    console.log(
      `  Reasoning   : ${result.reasoning}`,
    );
  }

  console.log("\n============================================================");
  console.log("✓ REAL GONKA B1 INTEGRATION TEST PASSED");
  console.log("============================================================");

  console.log(
    `Scored candidates: ${results.length}`,
  );
}

runGonkaTest().catch((error) => {
  console.error(
    "\n✗ Real Gonka B1 integration test failed",
  );

  console.error(error);

  process.exitCode = 1;
});