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
  if (project.requiredSkills.length === 0) {
    return freelancers;
  }

  return freelancers.filter(
    (freelancer) =>
      calculateSkillOverlap(
        project.requiredSkills,
        freelancer.skills,
      ) >= minimumOverlap,
  );
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

Your task is to rank candidates against a source entity.

Evaluate ONLY the information provided below.

Do not invent:
- experience
- skills
- budget
- timeline
- portfolio work
- project requirements
- project history

SOURCE TYPE:
${sourceLabel}

SOURCE:
${JSON.stringify(source, null, 2)}

${candidateLabel}:
${JSON.stringify(candidates, null, 2)}

MATCHING PRINCIPLES:

1. Evaluate the candidate against the actual requirements and
   context of the source.

2. For freelancer-for-project matching:
   - Compare freelancer skills with project requirements.
   - Consider project type, technical scope, experience level,
     budget, timeline, deliverables, and portfolio evidence
     when available.

3. For project-for-freelancer matching:
   - Compare project requirements with the freelancer's skills,
     experience, bio, portfolio evidence, and past project
     information when available.

4. REQUIRED SKILLS — EVALUATE EVERY SKILL:

The project's requiredSkills list is authoritative.

You MUST evaluate EVERY skill in requiredSkills individually.

For EACH required skill:

1. Identify the exact skill name.
2. Check whether the freelancer has that skill.
3. Determine whether the supplied evidence supports the match.
4. Mark it as matched=true or matched=false.
5. Provide a short evidence-based explanation.

IMPORTANT:

If requiredSkills contains:

["React", "TypeScript"]

you MUST return exactly two skillEvaluation entries:

[
  {
    "skill": "React",
    "matched": true or false,
    "evidence": "..."
  },
  {
    "skill": "TypeScript",
    "matched": true or false,
    "evidence": "..."
  }
]

Do NOT evaluate only the first skill.

Do NOT omit a required skill.

Do NOT combine multiple skills into one skillEvaluation entry.

Do NOT assume that matching one required skill means all required skills are satisfied.

The final Match Score must consider the complete requiredSkills list.

6. Do NOT reject a candidate solely because they do not match
   every general or inferred skill.

7. Consider transferable and related skills when appropriate,
   but only when supported by the supplied candidate data.

8. Match Score must represent suitability for THIS specific
   source/candidate pair.

9. Do NOT use Trust Score as Match Score.

10. Trust Score is a separate freelancer reputation signal
    handled by TrustHire.

11. Provide a short, evidence-based reasoning for every score.

12. The reasoning MUST explain important strengths or gaps,
    especially when an explicit client requirement is satisfied
    or missing.

13. Do not invent reasons for a match.

14. Return exactly one result for every candidate ID provided.

15. Scores must be integers from 0 to 100.

SCORING GUIDANCE:

90-100:
Excellent match. Strong alignment with the important project
requirements and explicit client requirements.

75-89:
Strong match. Most important requirements are satisfied with
only minor gaps.

60-74:
Moderate match. Relevant candidate but has noticeable gaps.

40-59:
Weak match. Some relevant capabilities exist, but important
requirements are missing.

0-39:
Poor match. Very limited evidence of suitability.

IMPORTANT CANDIDATE ID RULE:

Each candidate object has an "id" field.

You MUST copy that exact "id" value into "candidateId".

Do NOT:
- create a new ID
- rename the ID
- shorten the ID
- use the candidate's name
- use the candidate's array index
- use "candidate-1", "candidate-2", etc.

Every returned candidateId MUST exactly match one of the
candidate "id" values provided above.

Return ONLY valid JSON in exactly this structure:

Return ONLY valid JSON in exactly this structure:

{
  "matches": [
    {
      "candidateId": "candidate-id",
      "matchScore": 0,
      "skillEvaluation": [
        {
          "skill": "Required Skill 1",
          "matched": true,
          "evidence": "Evidence from candidate data."
        },
        {
          "skill": "Required Skill 2",
          "matched": false,
          "evidence": "No supporting evidence found."
        }
      ],
      "reasoning": "Brief explanation based only on the supplied data."
    }
  ]
}
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

    const requestId = response.id ?? "unknown";

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
      gonkaRequestId: requestId,
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