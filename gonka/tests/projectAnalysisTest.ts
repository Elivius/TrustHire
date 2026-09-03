import { analyzeProject } from "../integrations/projectAnalysis.js";

async function main() {
  console.log("============================================================");
  console.log("TRUSTHIRE PROJECT ANALYSIS TEST");
  console.log("============================================================\n");

  // Simulated requirements coming from Project Assistant.
  // In the real application, this will come from Project Assistant
  // after the client confirms the requirements.

  const confirmedRequirements = {
    projectTitle: "Computer Gadget E-commerce Website",

    description:
      "A company website for a computer gadget business where customers can browse products, place orders, and make online payments.",

    coreFeatures: [
      "Product showcase",
      "Product information and pricing",
      "Online ordering",
      "Online payment",
    ],

    targetUsers: [
      "Customers",
    ],

    platform: "Web application",

    budget: {
      amount: 5000,
      currency: "MYR",
    },

    timeline: {
      days: 30,
    },
  };

  console.log("============================================================");
  console.log("CONFIRMED PROJECT REQUIREMENTS");
  console.log("============================================================\n");

  console.log(JSON.stringify(confirmedRequirements, null, 2));

  console.log("\n============================================================");
  console.log("Sending requirements to Project Analysis...");
  console.log("============================================================\n");

  try {
    const result = await analyzeProject(confirmedRequirements);

    console.log("============================================================");
    console.log("TRUSTHIRE PROJECT ANALYSIS");
    console.log("============================================================\n");

    console.log(JSON.stringify(result, null, 2));

    console.log("\n============================================================");
    console.log("PROJECT ANALYSIS TEST COMPLETE");
    console.log("============================================================");
  } catch (error) {
    console.error("\n============================================================");
    console.error("PROJECT ANALYSIS ERROR");
    console.error("============================================================\n");

    console.error(error);
  }
}

main();