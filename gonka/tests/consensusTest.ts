import { calculateConsensus } from "../consensus.js";
import type { ModelVerificationResult } from "../types.js";

function runTests() {
  console.log("============================================================");
  console.log("RUNNING GONKA CONSENSUS UNIT TESTS");
  console.log("============================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(description: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(`✅ PASS: ${description}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${description}`);
      if (details) console.error(`   Details: ${details}`);
      failed++;
    }
  }

  // 1. Unanimous agreement test
  {
    const results: ModelVerificationResult[] = [
      { model: "moonshotai/Kimi-K2.6", requestId: "req-1", verdict: "TRUE", score: 85, confidence: "HIGH", reasoning: "OK" },
      { model: "MiniMaxAI/MiniMax-M2.7", requestId: "req-2", verdict: "TRUE", score: 90, confidence: "HIGH", reasoning: "OK" },
      { model: "deepseek-ai/DeepSeek-V4-Flash-0731", requestId: "req-3", verdict: "TRUE", score: 80, confidence: "HIGH", reasoning: "OK" },
    ];
    const consensus = calculateConsensus(results);
    assert("Unanimous 3/3 TRUE gives verdict TRUE", consensus.verdict === "TRUE");
    assert("Unanimous 3/3 TRUE gives confidence HIGH", consensus.confidence === "HIGH");
    assert("Unanimous 3/3 TRUE hasConflict is false", consensus.hasConflict === false);
    assert("Unanimous 3/3 TRUE agreementCount is 3", consensus.agreementCount === 3);
    assert("Unanimous score is average (85)", consensus.score === 85);
  }

  // 2. Majority agreement test (2 vs 1)
  {
    const results: ModelVerificationResult[] = [
      { model: "moonshotai/Kimi-K2.6", requestId: "req-1", verdict: "TRUE", score: 80, confidence: "HIGH", reasoning: "OK" },
      { model: "MiniMaxAI/MiniMax-M2.7", requestId: "req-2", verdict: "TRUE", score: 80, confidence: "HIGH", reasoning: "OK" },
      { model: "deepseek-ai/DeepSeek-V4-Flash-0731", requestId: "req-3", verdict: "FALSE", score: 20, confidence: "HIGH", reasoning: "No evidence" },
    ];
    const consensus = calculateConsensus(results);
    assert("Majority 2/3 TRUE gives verdict TRUE", consensus.verdict === "TRUE");
    assert("Majority 2/3 TRUE gives confidence MEDIUM", consensus.confidence === "MEDIUM");
    assert("Majority 2/3 TRUE hasConflict is true", consensus.hasConflict === true);
    assert("Majority 2/3 TRUE agreementCount is 2", consensus.agreementCount === 2);
    assert("Majority 2/3 score is 60", consensus.score === 60);
  }

  // 3. 1 vs 1 Tie test (Should NOT arbitrarily pick TRUE)
  {
    const results: ModelVerificationResult[] = [
      { model: "moonshotai/Kimi-K2.6", requestId: "req-1", verdict: "TRUE", score: 90, confidence: "HIGH", reasoning: "OK" },
      { model: "MiniMaxAI/MiniMax-M2.7", requestId: "req-2", verdict: "FALSE", score: 10, confidence: "HIGH", reasoning: "Fake" },
    ];
    const consensus = calculateConsensus(results);
    assert("1 vs 1 Tie (TRUE vs FALSE) gives verdict UNCERTAIN", consensus.verdict === "UNCERTAIN");
    assert("1 vs 1 Tie gives confidence LOW", consensus.confidence === "LOW");
    assert("1 vs 1 Tie hasConflict is true", consensus.hasConflict === true);
    assert("1 vs 1 Tie agreementCount is 0", consensus.agreementCount === 0);
  }

  // 4. 2 vs 2 Tie test
  {
    const results: ModelVerificationResult[] = [
      { model: "moonshotai/Kimi-K2.6", requestId: "req-1", verdict: "TRUE", score: 80, confidence: "HIGH", reasoning: "OK" },
      { model: "MiniMaxAI/MiniMax-M2.7", requestId: "req-2", verdict: "TRUE", score: 85, confidence: "HIGH", reasoning: "OK" },
      { model: "deepseek-ai/DeepSeek-V4-Flash-0731", requestId: "req-3", verdict: "PARTIAL", score: 50, confidence: "MEDIUM", reasoning: "Partial" },
      { model: "moonshotai/Kimi-K2.6", requestId: "req-4", verdict: "PARTIAL", score: 55, confidence: "MEDIUM", reasoning: "Partial" },
    ];
    const consensus = calculateConsensus(results);
    assert("2 vs 2 Tie gives verdict UNCERTAIN", consensus.verdict === "UNCERTAIN");
    assert("2 vs 2 Tie gives confidence LOW", consensus.confidence === "LOW");
    assert("2 vs 2 Tie hasConflict is true", consensus.hasConflict === true);
  }

  // 5. 3-way Split (1 TRUE, 1 FALSE, 1 PARTIAL - No majority)
  {
    const results: ModelVerificationResult[] = [
      { model: "moonshotai/Kimi-K2.6", requestId: "req-1", verdict: "TRUE", score: 80, confidence: "HIGH", reasoning: "OK" },
      { model: "MiniMaxAI/MiniMax-M2.7", requestId: "req-2", verdict: "FALSE", score: 20, confidence: "HIGH", reasoning: "Bad" },
      { model: "deepseek-ai/DeepSeek-V4-Flash-0731", requestId: "req-3", verdict: "PARTIAL", score: 50, confidence: "MEDIUM", reasoning: "Some" },
    ];
    const consensus = calculateConsensus(results);
    assert("1-1-1 3-way Split gives verdict UNCERTAIN", consensus.verdict === "UNCERTAIN");
    assert("1-1-1 3-way Split gives confidence LOW", consensus.confidence === "LOW");
    assert("1-1-1 3-way Split hasConflict is true", consensus.hasConflict === true);
  }

  // 6. Unanimous PARTIAL
  {
    const results: ModelVerificationResult[] = [
      { model: "moonshotai/Kimi-K2.6", requestId: "req-1", verdict: "PARTIAL", score: 60, confidence: "MEDIUM", reasoning: "Partial" },
      { model: "MiniMaxAI/MiniMax-M2.7", requestId: "req-2", verdict: "PARTIAL", score: 65, confidence: "MEDIUM", reasoning: "Partial" },
    ];
    const consensus = calculateConsensus(results);
    assert("Unanimous PARTIAL gives verdict PARTIAL", consensus.verdict === "PARTIAL");
    assert("Unanimous PARTIAL gives confidence HIGH", consensus.confidence === "HIGH");
    assert("Unanimous PARTIAL hasConflict is false", consensus.hasConflict === false);
  }

  // 7. Empty array throws error
  {
    let threw = false;
    try {
      calculateConsensus([]);
    } catch {
      threw = true;
    }
    assert("Empty model results throws error", threw);
  }

  console.log("\n============================================================");
  console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed`);
  console.log("============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
