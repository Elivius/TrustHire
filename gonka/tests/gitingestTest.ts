const TEST_REPO_URL = "https://github.com/octocat/Hello-World";

async function main() {
  console.log("============================================================");
  console.log("GITINGEST — GITHUB REPOSITORY TEST");
  console.log("============================================================");

  console.log(`Repository: ${TEST_REPO_URL}`);
  console.log("\nSending repository to Gitingest...\n");

  const response = await fetch("https://gitingest.com/api/ingest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input_text: TEST_REPO_URL,
      max_file_size: 50000,
      pattern_type: "exclude",
      pattern: "",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Gitingest request failed (${response.status}): ${errorText}`,
    );
  }

  const data = await response.json();

  console.log("============================================================");
  console.log("GITINGEST RESPONSE");
  console.log("============================================================");

  console.log(JSON.stringify(data, null, 2));

  console.log("\n============================================================");
  console.log("TEST COMPLETE");
  console.log("============================================================");
}

main().catch((error) => {
  console.error("\n❌ Gitingest test failed:");
  console.error(error);
  process.exit(1);
});