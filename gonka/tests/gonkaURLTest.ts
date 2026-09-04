import { gonka } from "../client.js";

const MODEL = "MiniMaxAI/MiniMax-M2.7";

const TEST_URL =
  "https://www.apu.edu.my";

async function main() {
  console.log("============================================================");
  console.log("REAL GONKA — URL ACCESS TEST");
  console.log("============================================================");

  console.log(`Model: ${MODEL}`);
  console.log(`URL: ${TEST_URL}`);
  console.log("\nSending request to Gonka...\n");

  const response = await gonka.chat.completions.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: "system",
        content:
          "You are testing whether you can access and inspect external URLs.",
      },
      {
        role: "user",
        content: `
I want to test whether you can access an external URL.

URL:
${TEST_URL}

Please try to inspect this URL.

If you can access it, tell me:

1. What repository or website this is.
2. What the repository is about.
3. What files or content you can actually see.
4. Any specific details you can verify from the URL.

If you CANNOT access or browse the URL, explicitly say:

"I cannot access this URL."

IMPORTANT:
- Do not guess.
- Do not use general knowledge to pretend you inspected the URL.
- Only report information you can actually obtain from the URL.
`,
      },
    ],
  });

  const content =
    response.choices[0]?.message?.content;

  console.log("============================================================");
  console.log("GONKA RESPONSE");
  console.log("============================================================");

  console.log(content ?? "No response content");

  console.log("\n============================================================");
  console.log(`Request ID: ${response.id}`);
  console.log("============================================================");
}

main().catch((error) => {
  console.error("\n❌ URL access test failed:");
  console.error(error);
  process.exit(1);
});