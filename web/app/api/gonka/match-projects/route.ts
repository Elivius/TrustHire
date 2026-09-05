import { NextRequest, NextResponse } from "next/server";
import {
  matchProjects,
  type MatchProjectsInput,
} from "@/../../gonka/integrations/matchProjects";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MatchProjectsInput;

    if (!body.freelancer) {
      return NextResponse.json(
        {
          success: false,
          message: "Freelancer is required.",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.projects)) {
      return NextResponse.json(
        {
          success: false,
          message: "Projects must be an array.",
        },
        { status: 400 }
      );
    }

const supabase = await createClient();

const freelancerId = body.freelancer.id;

// ------------------------------------------------------------
// Get freelancer profile from DATABASE
// ------------------------------------------------------------

const { data: freelancerProfile, error: profileError } =
  await supabase
    .from("freelancer_profiles")
    .select("trust_score")
    .eq("freelancer_id", freelancerId)
    .maybeSingle();

    if (profileError) {
      console.error(
        "[Gonka Project Matching] Failed to load freelancer profile:",
        profileError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Failed to load freelancer Trust Score.",
        },
        { status: 500 }
      );
    }

    // ------------------------------------------------------------
    // Get ONLY VERIFIED skills from profile_claims
    // ------------------------------------------------------------

    const { data: claims, error: claimsError } =
      await supabase
        .from("profile_claims")
        .select("claim_text, status")
        .eq("freelancer_id", freelancerId)
        .eq("claim_type", "Skill")
        .eq("status", "VERIFIED");

    if (claimsError) {
      console.error(
        "[Gonka Project Matching] Failed to load verified skills:",
        claimsError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Failed to load verified freelancer skills.",
        },
        { status: 500 }
      );
    }

    // ------------------------------------------------------------
    // Convert:
    //
    // "React - Expert"
    //
    // into:
    //
    // "React"
    // ------------------------------------------------------------

    const verifiedSkills = (claims ?? [])
      .map((claim) => {
        const separatorIndex =
          claim.claim_text.lastIndexOf(" - ");

        if (separatorIndex === -1) {
          return claim.claim_text.trim();
        }

        return claim.claim_text
          .slice(0, separatorIndex)
          .trim();
      })
      .filter(Boolean);

    // ------------------------------------------------------------
    // TRUSTED DATA
    //
    // Never use body.freelancer.skills or
    // body.freelancer.trustScore as the source of truth.
    // ------------------------------------------------------------

    const databaseTrustScore =
      freelancerProfile?.trust_score ?? 0;

    const trustedFreelancer = {
      ...body.freelancer,

      // ONLY VERIFIED skills from profile_claims
      skills: verifiedSkills,

      // ONLY Trust Score from freelancer_profiles
      trustScore: databaseTrustScore,
    };

    // ------------------------------------------------------------
    // CHEAP LOCAL PRE-FILTER
    //
    // Do not send every open project to Gonka.
    // Rank projects using verified freelancer skills first,
    // then send only the best 16 projects to the AI.
    // ------------------------------------------------------------

    const normaliseSkill = (skill: string) =>
      skill.trim().toLowerCase();

    const verifiedSkillSet = new Set(
      verifiedSkills.map(normaliseSkill)
    );

    const rankedProjects = [...body.projects]
      .map((project) => {
        const requiredSkills = project.requiredSkills ?? [];

        const matchedSkills = requiredSkills.filter((skill) =>
          verifiedSkillSet.has(normaliseSkill(skill))
        );

        const overlapCount = matchedSkills.length;

        const overlapRatio =
          requiredSkills.length > 0
            ? overlapCount / requiredSkills.length
            : 0;

        return {
          project,
          overlapCount,
          overlapRatio,
        };
      })
      .sort((a, b) => {
        // First: percentage of required skills matched
        if (b.overlapRatio !== a.overlapRatio) {
          return b.overlapRatio - a.overlapRatio;
        }

        // Second: absolute number of matching skills
        if (b.overlapCount !== a.overlapCount) {
          return b.overlapCount - a.overlapCount;
        }

        // Third: stable ordering
        return a.project.id.localeCompare(b.project.id);
      });

    const projectsForGonka = rankedProjects
      .slice(0, 16)
      .map(({ project }) => project);

    console.log(
      "[Gonka Project Matching] Freelancer:",
      trustedFreelancer.name || trustedFreelancer.id
    );

    console.log(
      "[Gonka Project Matching] Verified skills:",
      trustedFreelancer.skills
    );

    console.log(
      "[Gonka Project Matching] Database Trust Score:",
      trustedFreelancer.trustScore
    );

    console.log(
      "[Gonka Project Matching] Projects received:",
      body.projects.length
    );
    console.log(
      "[Gonka Project Matching] Projects selected for Gonka:",
      projectsForGonka.length
    );

    console.log(
      "[Gonka Project Matching] Selected project IDs:",
      projectsForGonka.map((project) => project.id)
    );

    // ------------------------------------------------------------
    // Send ONLY trusted freelancer data to matching engine
    // ------------------------------------------------------------

    const results = await matchProjects({
      ...body,
      freelancer: trustedFreelancer,
      projects: projectsForGonka,
    });
    // ------------------------------------------------------------
    // PERSIST GONKA MATCH RESULTS
    // ------------------------------------------------------------

    const matchRows = results.map((result) => ({
      freelancer_id: freelancerId,
      project_id: result.candidateId,
      match_score: Math.round(result.matchScore),
      reasoning: result.reasoning,
      skill_evaluation: result.skillEvaluation ?? [],
      gonka_request_id: result.gonkaRequestId,
      updated_at: new Date().toISOString(),
    }));

    if (matchRows.length > 0) {
      const { error: matchSaveError } = await supabase
        .from("project_match_results")
        .upsert(matchRows, {
          onConflict: "freelancer_id,project_id",
        });

if (matchSaveError) {
  console.error(
    "[Gonka Project Matching] Failed to save match results:",
    {
      message: matchSaveError.message,
      details: matchSaveError.details,
      hint: matchSaveError.hint,
      code: matchSaveError.code,
      rows: matchRows,
    }
  );


        return NextResponse.json(
          {
            success: false,
            message: "Gonka matching succeeded but results could not be saved.",
          },
          { status: 500 }
        );
      }
    }

    console.log(
      "[Gonka Project Matching] Saved results:",
      matchRows.length
    );

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error(
      "[Gonka Project Matching] Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to match projects.",
      },
      { status: 500 }
    );
  }
}