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

    // ------------------------------------------------------------
    // Send ONLY trusted freelancer data to matching engine
    // ------------------------------------------------------------

    const results = await matchProjects({
      ...body,
      freelancer: trustedFreelancer,
    });

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