import readline from "node:readline";

import {
  chatWithProjectAssistant,
  type ProjectChatMessage,
  type ProjectAssistantStatus,
  type ProjectRequirement,
} from "../integrations/projectAssistant.js";

const conversation: ProjectChatMessage[] = [];

let conversationStatus:
  | ProjectAssistantStatus
  | "STARTING" = "STARTING";

let finalRequirements:
  ProjectRequirement[] = [];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askUser(
  question: string,
): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function printHeader(): void {
  console.log(`
============================================================
TRUSTHIRE PROJECT ASSISTANT
============================================================

Interactive Project Assistant Test

Primary Model:
deepseek-ai/DeepSeek-V4-Flash-0731

Fallback Model:
MiniMaxAI/MiniMax-M2.7

Commands:
  /history  Show conversation history
  /clear    Clear conversation
  /exit     End the test

============================================================
`);
}

function printHistory(): void {
  if (conversation.length === 0) {
    console.log(`
============================================================
CONVERSATION HISTORY
============================================================

No messages yet.

============================================================
`);

    return;
  }

  console.log(`
============================================================
CONVERSATION HISTORY
============================================================
`);

  conversation.forEach(
    (message, index) => {
      const role =
        message.role === "user"
          ? "YOU"
          : "AI";

      console.log(
        `[${index + 1}] ${role}:`,
      );

      console.log(message.content);
      console.log("");
    },
  );

  console.log(
    "============================================================",
  );
}

function printRequirements(
  requirements: ProjectRequirement[],
): void {
  console.log(`
============================================================
CONFIRMED PROJECT REQUIREMENTS
============================================================
`);

  if (requirements.length === 0) {
    console.log(
      "No confirmed requirements.",
    );
  } else {
    requirements.forEach(
      (item, index) => {
        console.log(
          `${index + 1}. [${item.category}] ${item.requirement}`,
        );
      },
    );
  }

  console.log(`
============================================================
`);
}

async function sendMessage(
  message: string,
): Promise<void> {
  conversation.push({
    role: "user",
    content: message,
  });

  console.log(`
------------------------------------------------------------
Sending to Project Assistant...
------------------------------------------------------------
`);

  try {
    const response =
      await chatWithProjectAssistant(
        conversation,
      );

    conversation.push({
      role: "assistant",
      content: response.message,
    });

    conversationStatus =
      response.status;

    finalRequirements =
      response.requirements;

    console.log(`
============================================================
TRUSTHIRE AI
============================================================

${response.message}

------------------------------------------------------------
AI METADATA
------------------------------------------------------------

Model: ${response.model}
Request ID: ${response.requestId}
Used Fallback: ${response.usedFallback}
Status: ${response.status}

============================================================
`);

    if (
      response.status ===
      "CONFIRMATION"
    ) {
      printRequirements(
        response.requirements,
      );

      console.log(
        "Waiting for your confirmation...",
      );
      console.log("");
    }

    if (
      response.status ===
      "COMPLETED"
    ) {
      printRequirements(
        response.requirements,
      );

      console.log(`
============================================================
PROJECT REQUIREMENTS COMPLETE
============================================================

✓ Client confirmed the requirements.
✓ No more Project Assistant requests will be sent.
✓ Ready for projectAnalysis.ts.

============================================================
`);
    }
  } catch (error) {
    // Remove the user message if the request failed.
    conversation.pop();

    console.error(`
============================================================
PROJECT ASSISTANT ERROR
============================================================

${
  error instanceof Error
    ? error.message
    : String(error)
}

============================================================
`);

    console.log(
      "You can try sending your message again.",
    );
  }
}

async function runInteractiveTest(): Promise<void> {
  printHeader();

  while (true) {
    // ------------------------------------------------------
    // STOP AFTER COMPLETION
    // ------------------------------------------------------

    if (
      conversationStatus ===
      "COMPLETED"
    ) {
      console.log(
        "Project Assistant conversation is complete.",
      );

      break;
    }

    const input =
      await askUser("You: ");

    const message =
      input.trim();

    if (!message) {
      continue;
    }

    const command =
      message.toLowerCase();

    // ------------------------------------------------------
    // EXIT
    // ------------------------------------------------------

    if (
      command === "/exit" ||
      command === "exit"
    ) {
      break;
    }

    // ------------------------------------------------------
    // HISTORY
    // ------------------------------------------------------

    if (
      command === "/history"
    ) {
      printHistory();
      continue;
    }

    // ------------------------------------------------------
    // CLEAR
    // ------------------------------------------------------

    if (
      command === "/clear"
    ) {
      conversation.length = 0;

      conversationStatus =
        "STARTING";

      finalRequirements = [];

      console.log(`
============================================================
CONVERSATION CLEARED
============================================================

The Project Assistant no longer has the previous
conversation context.

============================================================
`);

      continue;
    }

    // ------------------------------------------------------
    // NORMAL CHAT
    // ------------------------------------------------------

    await sendMessage(message);
  }

  rl.close();

  console.log(`
============================================================
PROJECT ASSISTANT TEST ENDED
============================================================

Total messages:
${conversation.length}

Final status:
${conversationStatus}

Confirmed requirements:
${finalRequirements.length}

============================================================
`);
}

runInteractiveTest().catch(
  (error) => {
    rl.close();

    console.error(`
============================================================
PROJECT ASSISTANT TEST FAILED
============================================================

${
  error instanceof Error
    ? error.message
    : String(error)
}

============================================================
`);

    process.exit(1);
  },
);