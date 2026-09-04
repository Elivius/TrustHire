import { requestId } from "hono/request-id";
import { gonka } from "../client";

export type ProjectChatRole = "user" | "assistant";

export type ProjectAssistantStatus =
  | "DISCOVERY"
  | "CONFIRMATION"
  | "COMPLETED";

export type ProposalValueSource =
  | "CLIENT_PROVIDED"
  | "AI_ESTIMATED"
  | "AI_ADJUSTED";

export interface ProjectProposal {
  title: string;
  description: string;
  coreFeatures: string[];
  requiredSkills: string[];
  budgetUsdc: number;
  timelineDays: number;
  budgetSource: ProposalValueSource;
  timelineSource: ProposalValueSource;
}

export interface ProjectChatMessage {
  role: ProjectChatRole;
  content: string;
}

export interface ProjectRequirement {
  category: string;
  requirement: string;
}

export interface ProjectAssistantResponse {
  message: string;
  model: string;
  requestId: string;
  usedFallback: boolean;
  status: ProjectAssistantStatus;
  requirements: ProjectRequirement[];
  proposal: ProjectProposal | null;
}

const PRIMARY_MODEL =
  "MiniMaxAI/MiniMax-M2.7";

const FALLBACK_MODEL =
  "deepseek-ai/DeepSeek-V4-Flash-0731";

/**
 * Project Assistant is responsible ONLY for
 * discovering what the client wants.
 *
 * It must NOT perform technical analysis.
 *
 * Technical planning belongs to projectAnalysis.ts.
 */
const SYSTEM_PROMPT = `
You are TrustHire's Project Assistant.

You are the CLIENT-FACING AI for creating a freelance
project. The client may have little or no programming
knowledge.

Your job has TWO stages:

STAGE 1 — DISCOVERY
Understand what the client wants in simple language.

STAGE 2 — PROJECT PROPOSAL
Once there is enough information, prepare a client-friendly
project proposal containing:
- Project title
- Brief description
- Core features
- Required skills & technologies
- Estimated budget in USDC
- Estimated timeline in days

The client must approve the proposal before the conversation
can be marked COMPLETED.

============================================================
WHAT YOU SHOULD DISCOVER
============================================================

Focus on client-level information:

- What they want to build
- What the project is for
- Who it is for, when relevant
- Main purpose
- Important features they want
- Platform, when known
- Basic workflow
- Basic preferences such as design or user experience

Ask only 1-2 useful questions at a time.

Do not interrogate the client.

If the client is unsure, explain choices in normal language.

Do NOT require the client to know:
- frontend/backend
- frameworks
- databases
- APIs
- architecture
- hosting
- technical implementation

============================================================
DO NOT OVER-DISCOVER
============================================================

Once you have enough information to create a sensible
project proposal, STOP asking unnecessary questions.

You do not need to discover every implementation detail.

The client and freelancer can discuss detailed implementation
after the project is posted.

Do NOT ask the client about:
- database schema
- API design
- authentication architecture
- deployment architecture
- exact framework choices
- technical architecture
- development milestones

============================================================
CORE FEATURES
============================================================

Core features must describe WHAT the client wants.

Examples:
- Product catalogue
- Online ordering
- Table booking
- User accounts
- Payment
- Admin product management

Do not turn technical implementation into a core feature.

============================================================
REQUIRED SKILLS & TECHNOLOGIES
============================================================

The proposal should include a concise list of skills or
technologies that a suitable freelancer should have.

These are AI recommendations for freelancer matching.

They are NOT additional client requirements.

Do not ask the client to choose technologies unless the client
already has a specific technology preference.

Do not over-specify architecture.

============================================================
BUDGET AND TIMELINE
============================================================

Budget and timeline are part of the proposal.

There are THREE cases.

CASE 1 — CLIENT PROVIDES BUDGET/TIMELINE

If the client gives a desired budget or timeline, evaluate it
against the confirmed scope.

If it is reasonable:
- Keep it.
- Mark the source as CLIENT_PROVIDED.

If it is not reasonable:
- Explain briefly why.
- Suggest a more realistic value.
- Mark the source as AI_ADJUSTED.
- Ask the client to approve the revised proposal.

Do not silently change the client's number.

CASE 2 — CLIENT HAS NO IDEA

If the client does not know the budget or timeline:
- Estimate a reasonable value based on the confirmed scope.
- Mark the source as AI_ESTIMATED.
- Tell the client that these are estimates.
- Ask the client to approve them.

Do NOT ask the client to provide a number again if they already
said they do not know.

CASE 3 — CLIENT ONLY PROVIDES ONE

If the client gives only budget or only timeline:
- Keep the provided value after checking it.
- Estimate the missing value.
- Explain the estimate briefly.
- Ask for approval of the complete proposal.

============================================================
BUDGET/TIMELINE GUIDELINES
============================================================

Use practical freelance-project estimates.

Do not pretend the estimate is an exact quotation.

Use the smallest reasonable scope implied by the client's
confirmed requirements.

Do not add features just to justify a larger budget or longer
timeline.

The estimate should reflect:
- confirmed scope
- expected implementation effort
- normal development/testing time
- reasonable freelancer effort

The proposal is an estimate, not a binding quote.

============================================================
CLIENT APPROVAL
============================================================

When enough information is available, enter CONFIRMATION.

Show the client:
- title
- brief description
- core features
- required skills & technologies
- budget
- timeline

Then ask clearly:

"Does this project proposal look good to you?"

If the client asks to change something:
- Return to DISCOVERY.
- Update only what the client changed.
- Recalculate budget/timeline if necessary.
- Present the revised proposal again.

If the client clearly approves:
- Set status to COMPLETED.
- Return the final proposal and confirmed requirements.
- Do not ask additional questions.

Examples of approval:
"yes"
"looks good"
"approve"
"that's fine"
"let's go with it"
"confirmed"
"yes, proceed"

If the client says something ambiguous such as "okay" while
it is unclear whether they are approving the proposal, ask for
clear confirmation.

============================================================
AFTER COMPLETION
============================================================

Once the client has approved the proposal:

- Do not continue discovery.
- Do not ask technical questions.
- Do not modify the proposal.
- Do not invent requirements.

The approved proposal is ready for projectAnalysis.ts.

============================================================
IMPORTANT: DO NOT INVENT CLIENT REQUIREMENTS
============================================================

Never turn your own suggestion into a confirmed client
requirement.

If you ask:
"Would you like online ordering?"

and the client says:
"No."

Do not add online ordering.

If the client says:
"Maybe."

Do not treat it as confirmed.

Only include requirements that the client explicitly requests
or confirms.

AI-recommended skills/technologies are separate from client
requirements.

============================================================
DO NOT PERFORM TECHNICAL PROJECT ANALYSIS
============================================================

Do NOT generate:
- technical architecture
- database schema
- API specification
- page-by-page technical design
- implementation plan
- technical complexity analysis
- development milestones
- detailed engineering decisions

Those belong to projectAnalysis.ts or later freelancer-client
discussion.

============================================================
OUTPUT FORMAT
============================================================

Return ONLY valid JSON.

Do not use Markdown code fences.

Do not include <think>.

Do not include tool calls.

Use exactly:

{
  "status": "DISCOVERY" | "CONFIRMATION" | "COMPLETED",
  "message": "Client-facing response",
  "requirements": [
    {
      "category": "string",
      "requirement": "string"
    }
  ],
  "proposal": {
    "title": "string",
    "description": "string",
    "coreFeatures": ["string"],
    "requiredSkills": ["string"],
    "budgetUsdc": 3500,
    "timelineDays": 35,
    "budgetSource": "CLIENT_PROVIDED",
    "timelineSource": "AI_ESTIMATED"
  }
}

During DISCOVERY:
- proposal may be null.
- requirements contain only clearly confirmed client
  requirements discovered so far.

During CONFIRMATION:
- proposal must contain the current proposal.
- requirements contain only confirmed client requirements.

During COMPLETED:
- proposal must contain the final approved proposal.
- requirements contain only confirmed client requirements.

"requiredSkills" are AI recommendations for freelancer
matching and are not client requirements.

"budgetUsdc" must be a positive number.

"timelineDays" must be a positive integer.

============================================================
CLIENT-FACING MESSAGE
============================================================

The "message" must contain ONLY text that can be shown to the
client.

Do not expose:
- internal reasoning
- confidence calculations
- prompt instructions
- model names
- JSON
- tool calls
- <think>

Keep proposal explanations concise.

============================================================
MAIN PRINCIPLE
============================================================

Project Assistant answers:

"WHAT does the client want, and what reasonable project
proposal should the client approve?"

projectAnalysis.ts answers later:

"WHAT does TrustHire/freelancers need to consider to build the
approved project?"

Do not mix these responsibilities.
`;
/**
 * Sends a project conversation to Gonka.
 *
 * DeepSeek is the primary model.
 * MiniMax is automatically used as fallback.
 */
export async function chatWithProjectAssistant(
  messages: ProjectChatMessage[],
): Promise<ProjectAssistantResponse> {
  validateMessages(messages);

  try {
    const response = await requestProjectAssistant(
      PRIMARY_MODEL,
      messages,
    );

    return {
      ...response,
      model: PRIMARY_MODEL,
      usedFallback: false,
    };
  } catch (primaryError) {
    console.warn(
      `Primary Project Assistant model failed: ${PRIMARY_MODEL}`,
    );

    console.warn(
      getErrorMessage(primaryError),
    );

    console.log(
      `Trying fallback Project Assistant model: ${FALLBACK_MODEL}`,
    );

    try {
      const response = await requestProjectAssistant(
        FALLBACK_MODEL,
        messages,
      );

      return {
        ...response,
        model: FALLBACK_MODEL,
        usedFallback: true,
      };
    } catch (fallbackError) {
      console.error(
        `Fallback Project Assistant model also failed: ${FALLBACK_MODEL}`,
      );

      console.error(
        getErrorMessage(fallbackError),
      );

      throw new Error(
        "Both Project Assistant models failed. Please try again later.",
      );
    }
  }
}

/**
 * Starts a new Project Assistant conversation.
 */
export async function startProjectAssistant(
  initialMessage: string,
): Promise<ProjectAssistantResponse> {
  const message = initialMessage.trim();

  if (!message) {
    throw new Error(
      "Initial project message cannot be empty.",
    );
  }

  return chatWithProjectAssistant([
    {
      role: "user",
      content: message,
    },
  ]);
}

/**
 * Performs one Gonka request.
 */
async function requestProjectAssistant(
  model: string,
  messages: ProjectChatMessage[],
): Promise<{
  message: string;
  requestId: string;
  status: ProjectAssistantStatus;
  requirements: ProjectRequirement[];
  proposal: ProjectProposal | null;
}> {
  console.log(
    `Sending Project Assistant request to Gonka model: ${model}`,
  );

  const startTime = Date.now();

  const result =
    await gonka.chat.completions.create({
      model,

      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        ...messages,
      ],

      temperature: 0.4,
    }).withResponse();

    const response = result.data;
    const requestId = result.request_id;

  const elapsed =
    ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(
    `Received Project Assistant response from ${model} in ${elapsed}s`,
  );

  const rawContent =
    extractResponseContent(response);

  if (!rawContent) {
    throw new Error(
      `${model} returned an empty response.`,
    );
  }

const parsed =
  parseAssistantResponse(
    rawContent,
    messages,
  );

  return {
    message: parsed.message,
    status: parsed.status,
    requirements: parsed.requirements,
    proposal: parsed.proposal,
    requestId:
      requestId ?? "unknown",
  };
}

/**
 * Extract response content safely.
 *
 * Different OpenAI-compatible providers can sometimes
 * return slightly different content structures.
 */
function extractResponseContent(
  response: any,
): string {
  const content =
    response?.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    const text = content
      .map((item: any) => {
        if (typeof item === "string") {
          return item;
        }

        if (
          item &&
          typeof item.text === "string"
        ) {
          return item.text;
        }

        return "";
      })
      .join("");

    return text.trim();
  }

  return "";
}

/**
 * Parses the model response.
 *
 * JSON is preferred.
 *
 * However, the model is allowed to respond with normal
 * conversational text. In that case we safely normalize
 * the response instead of crashing.
 *
 * Structured responses may also contain a project proposal.
 */
function parseAssistantResponse(
  rawContent: string,
  messages: ProjectChatMessage[],
): {
  message: string;
  status: ProjectAssistantStatus;
  requirements: ProjectRequirement[];
  proposal: ProjectProposal | null;
} {
  const cleaned =
    cleanModelOutput(rawContent);

  if (!cleaned) {
    throw new Error(
      "Project Assistant returned an empty response after cleaning.",
    );
  }

  /*
   * ------------------------------------------------------
   * 1. Direct JSON
   * ------------------------------------------------------
   */
  const directJson =
    tryParseJson(cleaned);

  if (directJson) {
    return normalizeStructuredResponse(
      directJson,
    );
  }

  /*
   * ------------------------------------------------------
   * 2. JSON embedded inside surrounding text
   * ------------------------------------------------------
   */
  const extractedJson =
    extractJsonObject(cleaned);

  if (extractedJson) {
    const parsed =
      tryParseJson(extractedJson);

    if (parsed) {
      return normalizeStructuredResponse(
        parsed,
      );
    }
  }

  /*
   * ------------------------------------------------------
   * 3. Plain natural-language response
   * ------------------------------------------------------
   *
   * MiniMax/other models may sometimes ignore the JSON
   * instruction and return the proposal as normal text.
   *
   * We still want to show that real response to the client.
   */
  const message =
    cleanClientMessage(cleaned);

  /*
   * First try to recover a complete proposal directly
   * from the current assistant response.
   */
  let proposal =
    parseProposalFromPlainText(message);

  /*
   * If the client just approved the previous proposal and
   * the model returned only a natural-language confirmation,
   * recover the proposal from the previous assistant message.
   */
  if (
    !proposal &&
    isClearApproval(getLastUserMessage(messages))
  ) {
    const previousAssistantMessages =
      messages
        .filter(
          (item) =>
            item.role === "assistant",
        )
        .map(
          (item) => item.content,
        );

    for (
      let index = previousAssistantMessages.length - 1;
      index >= 0;
      index--
    ) {
      proposal =
        parseProposalFromPlainText(
          previousAssistantMessages[index],
        );

      if (proposal) {
        break;
      }
    }
  }

  /*
   * ------------------------------------------------------
   * 4. Completed proposal detection
   * ------------------------------------------------------
   *
   * This handles the exact response we observed:
   *
   * "Thank you for confirming! Here is your final
   * approved project proposal..."
   *
   * while the model incorrectly reports DISCOVERY.
   */
  if (
    proposal &&
    looksLikeCompletedProposal(message)
  ) {
    console.warn(
      "Project Assistant returned a completed proposal as plain text. Normalizing to COMPLETED.",
    );

    return {
      message,
      status: "COMPLETED",
      requirements:
        parseRequirementsFromPlainText(
          message,
        ),
      proposal,
    };
  }

  /*
   * ------------------------------------------------------
   * 5. Clear client approval recovery
   * ------------------------------------------------------
   *
   * If the client explicitly approved the proposal,
   * treat the recovered proposal as completed.
   */
  if (
    proposal &&
    isClearApproval(
      getLastUserMessage(messages),
    )
  ) {
    console.warn(
      "Client approval detected. Normalizing Project Assistant response to COMPLETED.",
    );

    return {
      message,
      status: "COMPLETED",
      requirements:
        parseRequirementsFromPlainText(
          message,
        ),
      proposal,
    };
  }

  /*
   * ------------------------------------------------------
   * 6. Normal conversational response
   * ------------------------------------------------------
   */
  console.warn(
    "Project Assistant returned plain conversational text. Normalizing as DISCOVERY.",
  );

  return {
    message,
    status: "DISCOVERY",
    requirements:
      parseRequirementsFromPlainText(
        message,
      ),
    proposal: null,
  };
}
/**
 * Attempts to parse JSON safely.
 */
function tryParseJson(
  value: string,
): any | null {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * Extracts the largest likely JSON object from a
 * response that contains text around it.
 */
function extractJsonObject(
  value: string,
): string | null {
  const start =
    value.indexOf("{");

  const end =
    value.lastIndexOf("}");

  if (
    start === -1 ||
    end === -1 ||
    end <= start
  ) {
    return null;
  }

  return value.slice(
    start,
    end + 1,
  );
}

/**
 * Converts structured model output into our internal
 * ProjectAssistantResponse format.
 */
function normalizeStructuredResponse(
  parsed: unknown,
): {
  message: string;
  status: ProjectAssistantStatus;
  requirements: ProjectRequirement[];
  proposal: ProjectProposal | null;
} {
  if (
    typeof parsed !== "object" ||
    parsed === null
  ) {
    throw new Error(
      "Project Assistant returned an invalid structured response.",
    );
  }

  const data =
    parsed as Record<string, unknown>;

  const rawStatus =
    data.status ??
    data.state ??
    data.phase;

  const status =
    normalizeStatus(rawStatus);

  const rawMessage =
    data.message ??
    data.response ??
    data.reply ??
    data.answer;

  const message =
    typeof rawMessage === "string"
      ? cleanClientMessage(rawMessage)
      : "";

  if (!message) {
    throw new Error(
      "Project Assistant returned an empty client message.",
    );
  }

  const requirements =
    parseRequirements(
      data.requirements ??
      data.confirmedRequirements ??
      data.projectRequirements,
    );

  const proposal =
    parseProjectProposal(
      data.proposal ??
      data.projectProposal,
    );

  return {
    message,
    status,
    requirements,
    proposal,
  };
}

/**
 * Normalizes status values from different model outputs.
 */
function normalizeStatus(
  value: unknown,
): ProjectAssistantStatus {
  if (
    typeof value !== "string"
  ) {
    return "DISCOVERY";
  }

  const status =
    value
      .trim()
      .toUpperCase();

  switch (status) {
    case "DISCOVERY":
    case "DISCOVERING":
    case "QUESTIONS":
      return "DISCOVERY";

    case "CONFIRMATION":
    case "CONFIRM":
    case "REVIEW":
    case "READY":
      return "CONFIRMATION";

    case "COMPLETED":
    case "COMPLETE":
    case "DONE":
    case "FINAL":
      return "COMPLETED";

    default:
      return "DISCOVERY";
  }
}

/**
 * Removes model-specific reasoning and formatting
 * artifacts.
 */
function cleanModelOutput(
  content: string,
): string {
  let cleaned =
    content.trim();

  cleaned =
    cleaned.replace(
      /<think>[\s\S]*?<\/think>/gi,
      "",
    );

  cleaned =
    cleaned.replace(
      /<think>[\s\S]*$/gi,
      "",
    );

  cleaned =
    cleaned.replace(
      /<minimax:tool_call>[\s\S]*?<\/minimax:tool_call>/gi,
      "",
    );

  cleaned =
    cleaned.replace(
      /<tool_call>[\s\S]*?<\/tool_call>/gi,
      "",
    );

  cleaned =
    cleaned.replace(
      /<function_call>[\s\S]*?<\/function_call>/gi,
      "",
    );

  cleaned =
    cleaned.replace(
      /^```(?:json|JSON)?\s*/i,
      "",
    );

  cleaned =
    cleaned.replace(
      /\s*```$/i,
      "",
    );

  cleaned =
    cleaned.replace(
      /^<p>/i,
      "",
    );

  cleaned =
    cleaned.replace(
      /<\/p>$/i,
      "",
    );

  return cleaned.trim();
}

/**
 * Cleans client-facing content.
 */
function cleanClientMessage(
  content: string,
): string {
  let cleaned =
    content.trim();

  cleaned =
    cleaned.replace(
      /<think>[\s\S]*?<\/think>/gi,
      "",
    );

  cleaned =
    cleaned.replace(
      /<think>[\s\S]*$/gi,
      "",
    );

  cleaned =
    cleaned.replace(
      /<minimax:tool_call>[\s\S]*?<\/minimax:tool_call>/gi,
      "",
    );

  cleaned =
    cleaned.replace(
      /<tool_call>[\s\S]*?<\/tool_call>/gi,
      "",
    );

  return cleaned.trim();
}
/**
 * Parses the project proposal safely.
 */
function parseProjectProposal(
  value: unknown,
): ProjectProposal | null {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return null;
  }

  const data =
    value as Record<string, unknown>;

  const title =
    typeof data.title === "string"
      ? data.title.trim()
      : "";

  const description =
    typeof data.description === "string"
      ? data.description.trim()
      : "";

  const coreFeatures =
    parseStringArray(
      data.coreFeatures ??
      data.features,
    );

  const requiredSkills =
    parseStringArray(
      data.requiredSkills ??
      data.skills ??
      data.technologies,
    );

  const budgetUsdc =
    typeof data.budgetUsdc === "number"
      ? data.budgetUsdc
      : typeof data.budget === "number"
        ? data.budget
        : Number(
            data.budgetUsdc ??
            data.budget,
          );

  const timelineDays =
    typeof data.timelineDays === "number"
      ? data.timelineDays
      : typeof data.timeline === "number"
        ? data.timeline
        : Number(
            data.timelineDays ??
            data.timeline,
          );

  const budgetSource =
    normalizeProposalSource(
      data.budgetSource,
    );

  const timelineSource =
    normalizeProposalSource(
      data.timelineSource,
    );

  if (
    !title ||
    !description ||
    coreFeatures.length === 0 ||
    requiredSkills.length === 0 ||
    !Number.isFinite(budgetUsdc) ||
    budgetUsdc <= 0 ||
    !Number.isFinite(timelineDays) ||
    timelineDays <= 0
  ) {
    return null;
  }

  return {
    title,
    description,
    coreFeatures,
    requiredSkills,
    budgetUsdc,
    timelineDays: Math.round(
      timelineDays,
    ),
    budgetSource,
    timelineSource,
  };
}

/**
 * Get the latest client message from the conversation.
 */
function getLastUserMessage(
  messages: ProjectChatMessage[],
): string {
  for (
    let index = messages.length - 1;
    index >= 0;
    index--
  ) {
    if (
      messages[index].role === "user"
    ) {
      return messages[index].content;
    }
  }

  return "";
}

/**
 * Detect clear client approval.
 *
 * This is intentionally conservative so that a casual
 * "okay" does not accidentally complete a project.
 */
function isClearApproval(
  value: string,
): boolean {
  const normalized =
    value
      .trim()
      .toLowerCase()
      .replace(
        /[.!?,]+$/g,
        "",
      )
      .replace(
        /\s+/g,
        " ",
      );

  return /^(yes|yeah|yep|approve|approved|confirmed|confirm|looks good|that's fine|that is fine|let's go with it|lets go with it|yes proceed|yes,? proceed|yes,? let's go|yes,? lets go|yes,? let's go for posting|yes,? lets go for posting|yes,? this is good|yes,? this is good let's go for posting|yes,? this is good lets go for posting)$/.test(
    normalized,
  );
}

/**
 * Detect a final proposal in natural-language output.
 *
 * We require both:
 * - final/approval language
 * - proposal fields
 *
 * This prevents normal conversational messages from being
 * incorrectly marked COMPLETED.
 */
function looksLikeCompletedProposal(
  message: string,
): boolean {
  const normalized =
    message.toLowerCase();

  const hasFinalLanguage =
    /project\s+(?:is\s+now\s+)?confirmed|final\s+approved\s+project\s+proposal|approved\s+project\s+proposal|project\s+is\s+approved|ready\s+to\s+be\s+posted|ready\s+for\s+posting/.test(
      normalized,
    );

  const hasProposalFields =
    /project\s+title\s*:/.test(
      normalized,
    ) &&
    /(?:estimated\s+budget|budget)\s*:/.test(
      normalized,
    ) &&
    /(?:estimated\s+timeline|timeline)\s*:/.test(
      normalized,
    );

  return (
    hasFinalLanguage &&
    hasProposalFields
  );
}

/**
 * Recover a proposal when the model returns Markdown/plain
 * text instead of structured JSON.
 */
function parseProposalFromPlainText(
  text: string,
): ProjectProposal | null {
  const cleaned =
    cleanClientMessage(text);

  const title =
    extractPlainTextField(
      cleaned,
      /(?:\*\*)?Project Title(?:\*\*)?\s*:\s*(.+?)(?:\r?\n|$)/i,
    );

  const description =
    extractPlainTextSection(
      cleaned,
      /(?:\*\*)?Description(?:\*\*)?\s*:\s*/i,
      [
        /(?:\*\*)?Core Features(?:\*\*)?\s*:/i,
        /(?:\*\*)?Required Skills(?:\s*&\s*Technologies)?(?:\*\*)?\s*:/i,
        /(?:\*\*)?Estimated Budget(?:\*\*)?\s*:/i,
        /(?:\*\*)?Estimated Timeline(?:\*\*)?\s*:/i,
      ],
    );

  const coreFeatures =
    extractPlainTextBullets(
      cleaned,
      /(?:\*\*)?Core Features(?:\*\*)?\s*:/i,
      [
        /(?:\*\*)?Required Skills(?:\s*&\s*Technologies)?(?:\*\*)?\s*:/i,
        /(?:\*\*)?Estimated Budget(?:\*\*)?\s*:/i,
        /(?:\*\*)?Estimated Timeline(?:\*\*)?\s*:/i,
      ],
    );

  const requiredSkills =
    extractPlainTextBullets(
      cleaned,
      /(?:\*\*)?Required Skills(?:\s*&\s*Technologies)?(?:\*\*)?\s*:/i,
      [
        /(?:\*\*)?Estimated Budget(?:\*\*)?\s*:/i,
        /(?:\*\*)?Estimated Timeline(?:\*\*)?\s*:/i,
      ],
    );

  const budgetText =
    extractPlainTextField(
      cleaned,
      /(?:\*\*)?Estimated Budget(?:\*\*)?\s*:\s*([^\r\n]+)/i,
    );

  const timelineText =
    extractPlainTextField(
      cleaned,
      /(?:\*\*)?Estimated Timeline(?:\*\*)?\s*:\s*([^\r\n]+)/i,
    );

  const budgetUsdc =
    parseNumericValue(
      budgetText,
    );

  const timelineDays =
    parseNumericValue(
      timelineText,
    );

  if (
    !title ||
    !description ||
    coreFeatures.length === 0 ||
    requiredSkills.length === 0 ||
    !Number.isFinite(budgetUsdc) ||
    budgetUsdc <= 0 ||
    !Number.isFinite(timelineDays) ||
    timelineDays <= 0
  ) {
    return null;
  }

  return {
    title,
    description,
    coreFeatures,
    requiredSkills,
    budgetUsdc,
    timelineDays:
      Math.round(timelineDays),
    budgetSource:
      inferProposalSource(
        budgetText,
      ),
    timelineSource:
      inferProposalSource(
        timelineText,
      ),
  };
}

function extractPlainTextField(
  text: string,
  pattern: RegExp,
): string {
  const match =
    text.match(pattern);

  return (
    match?.[1]?.trim() ?? ""
  );
}

function extractPlainTextSection(
  text: string,
  startPattern: RegExp,
  endPatterns: RegExp[],
): string {
  const startMatch =
    startPattern.exec(text);

  if (
    !startMatch ||
    startMatch.index < 0
  ) {
    return "";
  }

  const start =
    startMatch.index +
    startMatch[0].length;

  let end =
    text.length;

  const remaining =
    text.slice(start);

  for (
    const pattern of endPatterns
  ) {
    const match =
      pattern.exec(remaining);

    if (
      match &&
      match.index >= 0
    ) {
      end =
        Math.min(
          end,
          start + match.index,
        );
    }
  }

  return text
    .slice(start, end)
    .replace(/\r/g, "")
    .trim();
}

function extractPlainTextBullets(
  text: string,
  startPattern: RegExp,
  endPatterns: RegExp[],
): string[] {
  const section =
    extractPlainTextSection(
      text,
      startPattern,
      endPatterns,
    );

  if (!section) {
    return [];
  }

  return section
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(
          /^\s*[-*•]\s+/,
          "",
        )
        .replace(
          /^\s*\d+[.)]\s+/,
          "",
        )
        .trim(),
    )
    .filter(Boolean);
}

function parseNumericValue(
  value: string,
): number {
  if (!value) {
    return NaN;
  }

  const match =
    value
      .replace(/,/g, "")
      .match(
        /-?\d+(?:\.\d+)?/,
      );

  return match
    ? Number(match[0])
    : NaN;
}

function inferProposalSource(
  value: string,
): ProposalValueSource {
  if (
    /client[- ]provided|provided by client|client's/i.test(
      value,
    )
  ) {
    return "CLIENT_PROVIDED";
  }

  if (
    /adjusted|revised/i.test(
      value,
    )
  ) {
    return "AI_ADJUSTED";
  }

  return "AI_ESTIMATED";
}

/**
 * Conservative plain-text requirement recovery.
 *
 * We deliberately do NOT convert AI-recommended skills into
 * confirmed client requirements.
 */
function parseRequirementsFromPlainText(
  text: string,
): ProjectRequirement[] {
  const requirements: ProjectRequirement[] =
    [];

  const seen =
    new Set<string>();

  const addRequirement = (
    category: string,
    requirement: string,
  ) => {
    const value =
      requirement.trim();

    if (!value) {
      return;
    }

    const key =
      `${category}:${value}`.toLowerCase();

    if (seen.has(key)) {
      return;
    }

    seen.add(key);

    requirements.push({
      category,
      requirement: value,
    });
  };

  const pattern =
    /(?:client\s+(?:wants|needs)|user\s+(?:wants|needs)|the\s+client\s+(?:wants|needs))\s+(.+?)(?:[.\n]|$)/gi;

  for (
    const match of text.matchAll(
      pattern,
    )
  ) {
    addRequirement(
      "Project Requirement",
      match[1],
    );
  }

  return requirements;
}

/**
 * Parses an array of strings safely.
 */
function parseStringArray(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === "string",
    )
    .map(
      (item) => item.trim(),
    )
    .filter(Boolean);
}

/**
 * Normalizes proposal value-source labels.
 */
function normalizeProposalSource(
  value: unknown,
): ProposalValueSource {
  if (
    typeof value !== "string"
  ) {
    return "AI_ESTIMATED";
  }

  switch (
    value
      .trim()
      .toUpperCase()
  ) {
    case "CLIENT_PROVIDED":
      return "CLIENT_PROVIDED";

    case "AI_ADJUSTED":
    case "ADJUSTED":
      return "AI_ADJUSTED";

    case "AI_ESTIMATED":
    case "ESTIMATED":
    default:
      return "AI_ESTIMATED";
  }
}

/**
 * Parses requirements safely.
 */
function parseRequirements(
  value: unknown,
): ProjectRequirement[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const requirements: ProjectRequirement[] = [];

  for (const item of value) {
    if (
      typeof item !== "object" ||
      item === null
    ) {
      continue;
    }

    const requirement =
      item as Record<string, unknown>;

    const rawCategory =
      requirement.category ??
      requirement.type ??
      requirement.name;

    const rawRequirement =
      requirement.requirement ??
      requirement.description ??
      requirement.value;

    if (
      typeof rawCategory !== "string" ||
      typeof rawRequirement !== "string"
    ) {
      continue;
    }

    const category =
      rawCategory.trim();

    const text =
      rawRequirement.trim();

    if (
      !category ||
      !text
    ) {
      continue;
    }

    requirements.push({
      category,
      requirement: text,
    });
  }

  return requirements;
}

/**
 * Validates the conversation before sending it
 * to Gonka.
 */
function validateMessages(
  messages: ProjectChatMessage[],
): void {
  if (
    !messages ||
    messages.length === 0
  ) {
    throw new Error(
      "At least one conversation message is required.",
    );
  }

  for (const message of messages) {
    if (
      message.role !== "user" &&
      message.role !== "assistant"
    ) {
      throw new Error(
        `Invalid conversation role: ${message.role}`,
      );
    }

    if (
      typeof message.content !== "string" ||
      !message.content.trim()
    ) {
      throw new Error(
        "Conversation messages cannot be empty.",
      );
    }
  }
}

/**
 * Safely extracts an error message.
 */
function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}