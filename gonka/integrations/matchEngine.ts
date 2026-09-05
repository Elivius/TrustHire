import { gonka } from "../client";
import { parseGonkaJson } from "../responseParser";
import { GONKA_MODELS } from "../models";

/* ============================================================
   SHARED MATCHING TYPES
   ============================================================ */

export interface MatchProject {
  id: string;
  projectTitle: string;
  projectDescription?: string;
  projectType?: string;
  platform?: string | null;
  targetUsers?: string[];
  coreFeatures?: string[];

  /**
   * All skills identified by Project Analysis.
   *
   * This can contain both:
   * - skills explicitly requested by the client
   * - relevant skills inferred from the project
   */
  requiredSkills: string[];

  /**
   * Skills that the client explicitly requested.
   *
   * These receive stronger consideration during AI matching.
   *
   * Optional so existing projects/data remain compatible.
   */
  experienceLevel?: string;

  budget?: {
    amount: number;
    currency: string;
  };

  estimatedTimelineDays?: number;
  keyDeliverables?: string[];
  technicalConsiderations?: string[];
}

export interface MatchFreelancer {
  id: string;
  name?: string;
  skills: string[];
  bio?: string;
  portfolioLinks?: string[];
  pastProjectLinks?: string[];
  experienceLevel?: string;
  trustScore?: number | null;
}

export interface SkillEvaluation {
  skill: string;
  matched: boolean;
  evidence: string;
}

export interface MatchScoreResult {
  candidateId: string;
  matchScore: number;
  reasoning: string;
  skillEvaluation: SkillEvaluation[];
  gonkaRequestId: string;
}

export type MatchDirection =
  | "FREELANCER_FOR_PROJECT"
  | "PROJECT_FOR_FREELANCER";

interface GonkaMatchResponse {
  matches: Array<{
    candidateId: string;
    matchScore: number;
    reasoning: string;
    skillEvaluation: Array<{
      skill: string;
      matched: boolean;
      evidence: string;
    }>;
  }>;
}

/* ============================================================
   CONFIGURATION
   ============================================================ */

const DEFAULT_MATCH_MODEL =
  GONKA_MODELS[0] ?? "MiniMaxAI/MiniMax-M2.7";

const MAX_CANDIDATES_PER_REQUEST = 20;

export function getMatchModel(): string {
  const configured = process.env.GONKA_MATCH_MODEL?.trim();

  if (configured) return configured;

  const configuredModels = process.env.GONKA_MODELS
    ?.split(",")
    .map((model) => model.trim())
    .filter(Boolean);

  return configuredModels?.[0] ?? DEFAULT_MATCH_MODEL;
}

/* ============================================================
   SKILL PRE-FILTER
   ============================================================ */

function normaliseSkill(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[+#./_-]/g, " ")
    .replace(/\s+/g, " ");
}

function skillMatches(
  required: string,
  freelancerSkill: string,
): boolean {
  const requiredNormalised = normaliseSkill(required);
  const freelancerNormalised = normaliseSkill(freelancerSkill);

  if (!requiredNormalised || !freelancerNormalised) {
    return false;
  }

  if (requiredNormalised === freelancerNormalised) {
    return true;
  }

  return (
    requiredNormalised.includes(freelancerNormalised) ||
    freelancerNormalised.includes(requiredNormalised)
  );
}

export function calculateSkillOverlap(
  requiredSkills: string[],
  freelancerSkills: string[],
): number {
  if (requiredSkills.length === 0) return 0;

  const matched = requiredSkills.filter((required) =>
    freelancerSkills.some((skill) =>
      skillMatches(required, skill),
    ),
  ).length;

  return matched / requiredSkills.length;
}

/**
 * Cheap candidate filter.
 *
 * IMPORTANT:
 * This is NOT the final matching decision.
 *
 * Its only purpose is to reduce the number of Gonka calls.
 *
 * The threshold should remain relatively loose because Gonka
 * performs the actual contextual matching.
 */
export function prefilterFreelancers(
  project: MatchProject,
  freelancers: MatchFreelancer[],
  minimumOverlap = 0.2,
): MatchFreelancer[] {
  // No requirements means there is nothing useful to filter on.
  if (project.requiredSkills.length === 0) {
    return freelancers;
  }

  // For small candidate pools, don't filter aggressively.
  // Gonka can handle the semantic matching.
  if (freelancers.length <= MAX_CANDIDATES_PER_REQUEST) {
    return freelancers;
  }

  const filtered = freelancers.filter(
    (freelancer) =>
      calculateSkillOverlap(
        project.requiredSkills,
        freelancer.skills,
      ) >= minimumOverlap,
  );

  // If the lexical filter removes everyone, do not block matching.
  // Return the original pool and let Gonka perform the semantic evaluation.
  if (filtered.length === 0) {
    return freelancers;
  }

  return filtered;
}

/* ============================================================
   PROMPT
   ============================================================ */

function buildMatchPrompt(
  direction: MatchDirection,
  source: MatchProject | MatchFreelancer,
  candidates: Array<MatchProject | MatchFreelancer>,
): string {
  const sourceLabel =
    direction === "FREELANCER_FOR_PROJECT"
      ? "PROJECT"
      : "FREELANCER";

  const candidateLabel =
    direction === "FREELANCER_FOR_PROJECT"
      ? "FREELANCER CANDIDATES"
      : "PROJECT CANDIDATES";

  return `
You are TrustHire's Freelancer Matching AI.

Your task is to evaluate and rank every candidate against the source.

Use ONLY the information provided in SOURCE and CANDIDATES.

Never invent:
- skills
- experience
- portfolio work
- budget
- timeline
- project requirements
- project history
- certifications
- achievements
- availability

SOURCE TYPE:
${sourceLabel}

SOURCE:
${JSON.stringify(source, null, 2)}

${candidateLabel}:
${JSON.stringify(candidates, null, 2)}

MATCHING RULES:

1. Evaluate each candidate against the actual requirements and context of the source.

2. For freelancer-for-project matching:
   - Compare the freelancer against the project's requirements.
   - Consider skills, experience, bio, portfolio evidence, and other supplied information.

3. For project-for-freelancer matching:
   - Compare the project requirements with the freelancer's skills,
     experience, bio, portfolio evidence, and other supplied information.

4. REQUIRED SKILLS:

If the source contains a "requiredSkills" array, you MUST evaluate
EVERY item in that array individually.

Required skills are NOT necessarily standardized skills.

A requirement may be:
- a programming language
- a framework
- a library
- a software/tool
- a technical capability
- a professional skill
- a soft skill
- domain knowledge
- an industry capability
- a design capability
- a methodology
- another free-form requirement

Do NOT assume a requirement must exist in a predefined skill taxonomy.

For EVERY required skill:

- Evaluate it individually.
- Compare it against the candidate's supplied information.
- Consider the candidate's skills.
- Consider the candidate's bio.
- Consider portfolio evidence when provided.
- Consider semantically related capabilities ONLY when supported by the evidence.
- Set "matched" to true or false.
- Give concise evidence.

Do NOT require exact text matching.

For example:

Required:
"User Interface Design"

Candidate:
"UI/UX Design"

This MAY be considered a match if the supplied evidence supports the equivalence.

However, do NOT assume equivalence without evidence.

IMPORTANT:

If requiredSkills contains:

["React", "TypeScript", "UI/UX Design"]

then skillEvaluation MUST contain exactly 3 entries:

1. React
2. TypeScript
3. UI/UX Design

Never:
- evaluate only one required skill
- omit a required skill
- combine multiple required skills
- invent a required skill
- add a skill that is not required
- evaluate only the skills that the candidate happens to have

The final matchScore MUST consider ALL required skills.

If no requiredSkills are provided, evaluate the candidate using the
other available project/source information.

5. Do NOT reject a candidate solely because they do not match every skill.

6. Consider transferable or related capabilities only when supported
   by the supplied evidence.

7. MatchScore represents suitability for this specific source/candidate pair.

8. Do NOT use Trust Score as Match Score.

11. Provide evidence-based reasoning.

12. Do not invent reasons for a match.

13. Return exactly ONE result for EVERY candidate provided.

14. Every candidate MUST appear exactly once in the matches array.

SCORING GUIDANCE:

The Match Score must primarily reflect how suitable the candidate
is for this specific project.

When requiredSkills are present, they are the most important factor.

Consider the following factors:

1. Required skill coverage.
2. Strength and relevance of evidence for each required skill.
3. Relevant experience level.
4. Relevant portfolio evidence.
5. Relevance of the candidate's bio.
6. Other explicit project requirements.

Do NOT calculate the score using a simple required-skill count alone.

Two candidates with the same number of matched skills may receive
different scores when the strength, relevance, or quality of their
supporting evidence differs.

For example, a candidate who matches Java and Sui Move through
direct skills and relevant portfolio evidence should generally
score higher than a candidate who only has one directly relevant
skill with no additional supporting evidence.

TRUST SCORE:

Trust Score MUST NOT affect Match Score.

Do NOT increase or decrease Match Score because of Trust Score.

Do NOT mention Trust Score as a reason for the Match Score.

Trust Score is a separate TrustHire reputation signal and will be
displayed separately.

SCORE RANGES:

90-100:
Excellent match. Strong evidence that the candidate can satisfy
the project's important requirements.

75-89:
Strong match. Most important requirements are satisfied with
good supporting evidence and only minor gaps.

60-74:
Moderate match. Several relevant capabilities are present, but
there are noticeable gaps in important requirements.

40-59:
Weak match. Some relevant capabilities exist, but important
requirements are missing or poorly supported.

0-39:
Poor match. Very limited evidence of suitability for the project.

The final score must be an integer from 0 to 100.

CANDIDATE ID RULE:

Each candidate has an "id" field.

You MUST copy the candidate's "id" EXACTLY into "candidateId".

Do NOT:
- modify the ID
- shorten the ID
- create a new ID
- use the candidate's name
- use the candidate's array index
- use "candidate-1", "candidate-2", etc.

Every returned candidateId MUST exactly match an id from the
candidate list.

OUTPUT SIZE RULES:

The response must be compact.

For each skillEvaluation:
- "evidence" MUST be no more than ONE short sentence.
- Keep evidence under approximately 15 words.
- Do not repeat information already obvious from the candidate data.

For "reasoning":
- Provide a clear, evidence-based explanation of approximately 50-80 words.
- Explain the candidate's strongest relevant capabilities.
- Explain which required skills are satisfied and which are missing.
- Explain important supporting evidence from the candidate's skills, bio,
  experience, and portfolio when available.
- Explain important gaps that reduce the match score.
- Explain why the candidate is suitable or unsuitable for this specific project.
- Do NOT repeat the candidate's entire profile.
- Do NOT invent information.
- Do NOT mention information that was not supplied.

The reasoning should be detailed enough for a client to understand
WHY the candidate received the score, while remaining concise.

Do NOT provide long explanations.

Do NOT repeat the candidate's full profile.

Do NOT repeat the project description.

Do NOT include markdown.

Do NOT include comments.

Do NOT include <think> or analysis.

Return ONLY valid JSON.

OUTPUT FORMAT:

{
  "matches": [
    {
      "candidateId": "EXACT-CANDIDATE-ID",
      "matchScore": 0,
      "skillEvaluation": [
        {
          "skill": "Required Skill 1",
          "matched": true,
          "evidence": "Short evidence from supplied candidate data."
        },
        {
          "skill": "Required Skill 2",
          "matched": false,
          "evidence": "No supporting evidence found."
        }
      ],
      "reasoning": "Short explanation of the strongest strengths and gaps."
    }
  ]
}

FINAL CHECK BEFORE RESPONDING:

- Return exactly ${candidates.length} matches.
- Every candidate appears exactly once.
- Every candidateId exactly matches an input candidate id.
- Every requiredSkills item is evaluated exactly once.
- Do not omit required skills.
- Do not add extra skills.
- matchScore is an integer from 0 to 100.
- Return JSON only.
`.trim();
}

/* ============================================================
   RESPONSE VALIDATION
   ============================================================ */

function validateMatchResponse(
  value: unknown,
  expectedCandidateIds: Set<string>,
  requiredSkills: string[],
): GonkaMatchResponse {
  if (!value || typeof value !== "object") {
    throw new Error(
      "Gonka match response is not an object",
    );
  }

  const data = value as Record<string, unknown>;

  if (!Array.isArray(data.matches)) {
    throw new Error(
      "Gonka match response is missing matches array",
    );
  }

  if (data.matches.length !== expectedCandidateIds.size) {
    throw new Error(
      `Gonka returned ${data.matches.length} matches, ` +
      `expected ${expectedCandidateIds.size}`,
    );
  }

  const matches = data.matches.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(
        `Invalid match result at index ${index}`,
      );
    }

    const match = item as Record<string, unknown>;

    /*
     * Candidate ID
     */
    if (
      typeof match.candidateId !== "string" ||
      !match.candidateId.trim()
    ) {
      throw new Error(
        `Missing candidateId at index ${index}`,
      );
    }

    const candidateId = match.candidateId.trim();

    if (!expectedCandidateIds.has(candidateId)) {
      throw new Error(
        `Invalid candidateId at index ${index}: ${candidateId}`,
      );
    }

    /*
     * Match score
     */
    const score = Number(match.matchScore);

    if (
      !Number.isInteger(score) ||
      score < 0 ||
      score > 100
    ) {
      throw new Error(
        `Invalid matchScore for ${candidateId}`,
      );
    }

    /*
     * Reasoning
     */
    if (
      typeof match.reasoning !== "string" ||
      !match.reasoning.trim()
    ) {
      throw new Error(
        `Invalid reasoning for ${candidateId}`,
      );
    }

    /*
     * Skill evaluation
     */
    if (!Array.isArray(match.skillEvaluation)) {
      throw new Error(
        `Missing skillEvaluation for ${candidateId}`,
      );
    }

    if (
      match.skillEvaluation.length !==
      requiredSkills.length
    ) {
      throw new Error(
        `Invalid skillEvaluation count for ${candidateId}: ` +
        `expected ${requiredSkills.length}, ` +
        `got ${match.skillEvaluation.length}`,
      );
    }

    const evaluatedSkills = new Set<string>();

    const skillEvaluation =
      match.skillEvaluation.map(
        (item, skillIndex) => {
          if (
            !item ||
            typeof item !== "object"
          ) {
            throw new Error(
              `Invalid skill evaluation at index ${skillIndex} ` +
              `for ${candidateId}`,
            );
          }

          const evaluation =
            item as Record<string, unknown>;

          if (
            typeof evaluation.skill !== "string" ||
            !evaluation.skill.trim()
          ) {
            throw new Error(
              `Missing skill name at index ${skillIndex} ` +
              `for ${candidateId}`,
            );
          }

          const skill =
            evaluation.skill.trim();

          /*
           * Find the corresponding required skill.
           */
          const matchedRequiredSkill =
            requiredSkills.find(
              (requiredSkill) =>
                normaliseSkill(requiredSkill) ===
                normaliseSkill(skill),
            );

          if (!matchedRequiredSkill) {
            throw new Error(
              `Unknown skill "${skill}" in evaluation ` +
              `for ${candidateId}`,
            );
          }

          const normalisedSkill =
            normaliseSkill(
              matchedRequiredSkill,
            );

          /*
           * Prevent duplicate skill evaluations.
           */
          if (
            evaluatedSkills.has(
              normalisedSkill,
            )
          ) {
            throw new Error(
              `Duplicate skill "${skill}" ` +
              `for ${candidateId}`,
            );
          }

          evaluatedSkills.add(
            normalisedSkill,
          );

          /*
           * matched must be a real boolean.
           */
          if (
            typeof evaluation.matched !==
            "boolean"
          ) {
            throw new Error(
              `Invalid matched value for "${skill}" ` +
              `for ${candidateId}`,
            );
          }

          /*
           * Evidence is required.
           */
          if (
            typeof evaluation.evidence !==
              "string" ||
            !evaluation.evidence.trim()
          ) {
            throw new Error(
              `Missing evidence for "${skill}" ` +
              `for ${candidateId}`,
            );
          }

          return {
            skill: matchedRequiredSkill,
            matched: evaluation.matched,
            evidence:
              evaluation.evidence.trim(),
          };
        },
      );

    /*
     * Ensure EVERY required skill was evaluated.
     */
    for (const requiredSkill of requiredSkills) {
      if (
        !evaluatedSkills.has(
          normaliseSkill(requiredSkill),
        )
      ) {
        throw new Error(
          `Gonka did not evaluate required skill ` +
          `"${requiredSkill}" for ${candidateId}`,
        );
      }
    }

    return {
      candidateId,
      matchScore: score,
      reasoning: match.reasoning.trim(),
      skillEvaluation,
    };
  });

  /*
   * Prevent duplicate candidate IDs.
   */
  const seen = new Set<string>();

  for (const match of matches) {
    if (seen.has(match.candidateId)) {
      throw new Error(
        `Duplicate candidateId: ${match.candidateId}`,
      );
    }

    seen.add(match.candidateId);
  }

  /*
   * Ensure every expected candidate received
   * exactly one result.
   */
  for (const candidateId of expectedCandidateIds) {
    if (!seen.has(candidateId)) {
      throw new Error(
        `Gonka did not return a result for ${candidateId}`,
      );
    }
  }

  return {
    matches,
  };
}

/* ============================================================
   GONKA EXECUTION
   ============================================================ */

async function scoreBatch(
  direction: MatchDirection,
  source: MatchProject | MatchFreelancer,
  candidates: Array<
    MatchProject | MatchFreelancer
  >,
  model = getMatchModel(),
): Promise<MatchScoreResult[]> {
  const candidateIds = candidates.map(
    (candidate) => candidate.id,
  );

  const expectedIds = new Set(candidateIds);
  

  console.log(
    `Sending ${direction} matching request to Gonka model: ${model}`,
  );
  
  console.log(
  "[Gonka DEBUG] scoreBatch requiredSkills:",
  direction === "FREELANCER_FOR_PROJECT"
    ? (source as MatchProject).requiredSkills
    : []
  );

  const result =
    await gonka.chat.completions.create({
      model,
      max_tokens: 4096,
      messages: [
        {
          role: "system",
          content:
            "You are TrustHire's objective matching model. Return only valid JSON.",
        },
        {
          role: "user",
          content: buildMatchPrompt(
            direction,
            source,
            candidates,
          ),
        },
      ],
      temperature: 0,
    }).withResponse();

    const response = result.data;
    const gonkaRequestId = result.request_id;
    console.log("[Gonka] Request ID:", gonkaRequestId);

  const content =
    response.choices[0]?.message?.content;

  if (!content) {
    throw new Error(
      "Gonka returned an empty matching response",
    );
  }
  console.log("[Gonka Match] Expected candidate IDs:", candidateIds);
  console.log("[Gonka Match] Raw model response:", content);

  const requiredSkills =
    direction === "FREELANCER_FOR_PROJECT"
      ? (source as MatchProject).requiredSkills
      : [];

  const parsed = validateMatchResponse(
    parseGonkaJson(content),
    expectedIds,
    requiredSkills,
  );

    return parsed.matches.map((match) => ({
      ...match,
      gonkaRequestId: gonkaRequestId,
    }));
}

export async function scoreCandidates(
  direction: MatchDirection,
  source: MatchProject | MatchFreelancer,
  candidates: Array<
    MatchProject | MatchFreelancer
  >,
  model = getMatchModel(),
): Promise<MatchScoreResult[]> {
  if (candidates.length === 0) {
    return [];
  }

  const results: MatchScoreResult[] = [];

  for (
    let offset = 0;
    offset < candidates.length;
    offset += MAX_CANDIDATES_PER_REQUEST
  ) {
    const batch = candidates.slice(
      offset,
      offset + MAX_CANDIDATES_PER_REQUEST,
    );

    const batchResults = await scoreBatch(
      direction,
      source,
      batch,
      model,
    );

    results.push(...batchResults);
  }

  return results.sort(
    (a, b) => b.matchScore - a.matchScore,
  );
}