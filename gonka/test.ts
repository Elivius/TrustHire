import { verifyWithAllModels } from "./router.js";
import { buildConsensus } from "./consensus.js";

async function main() {
  console.log("Testing TrustHire Gonka multi-model verification...\n");

  const results = await verifyWithAllModels({
    claim: "I have 5 years of Python development experience.",

    evidence: `
    The freelancer provided a public GitHub profile containing
    multiple Python projects from 2021, 2022, 2023, 2024 and 2025.
    The projects include backend APIs, automation scripts and
    data processing applications.
    `,
  });

  console.log("=== MODEL RESULTS ===\n");

  for (const result of results) {
    console.log(`Model: ${result.model}`);
    console.log(`Request ID: ${result.requestId}`);
    console.log(`Verdict: ${result.verdict}`);
    console.log(`Score: ${result.score}`);
    console.log(`Confidence: ${result.confidence}`);
    console.log(`Reasoning: ${result.reasoning}`);
    console.log("--------------------------------");
  }

  const consensus = buildConsensus(results);

  console.log("\n=== CONSENSUS ===\n");

  console.log(`Final Verdict: ${consensus.verdict}`);
  console.log(`Final Score: ${consensus.score}`);
  console.log(`Confidence: ${consensus.confidence}`);
  console.log(
    `Agreement: ${consensus.agreementCount}/${consensus.totalModels}`,
  );

  console.log("\nReasoning:");
  console.log(consensus.reasoning);
}

main().catch((error) => {
  console.error("\nGonka verification failed:");

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exit(1);
});