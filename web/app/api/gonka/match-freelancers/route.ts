import { NextRequest, NextResponse } from "next/server";
import {
  matchFreelancers,
  type MatchFreelancersInput,
} from "@/../../gonka/integrations/matchFreelancers";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body =
      (await request.json()) as MatchFreelancersInput;

    console.log(
      "[Gonka DEBUG] Project requiredSkills:",
      body.project?.requiredSkills
    );

    console.log(
      "[Gonka DEBUG] requiredSkills count:",
      body.project?.requiredSkills?.length
    );

    if (!body.project) {
      return NextResponse.json(
        {
          success: false,
          message: "Project is required.",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.freelancers)) {
      return NextResponse.json(
        {
          success: false,
          message: "Freelancers must be an array.",
        },
        { status: 400 }
      );
    }

    console.log(
      "Starting Gonka Freelancer Matching:",
      body.project.projectTitle
    );

    // ------------------------------------------------------------
    // Load trusted freelancer data from Supabase
    // ------------------------------------------------------------

    const supabase = await createClient();

    const freelancerIds = body.freelancers
      .map((freelancer) => freelancer.id)
      .filter(Boolean);

    if (freelancerIds.length === 0) {
      return NextResponse.json({
        success: true,
        results: [],
      });
    }

    // ------------------------------------------------------------
    // STEP 1:
    // Get Trust Scores directly from the database.
    //
    // Never trust the trustScore sent by the frontend.
    // ------------------------------------------------------------

    const { data: profiles, error: profilesError } =
      await supabase
        .from("freelancer_profiles")
        .select("freelancer_id, trust_score")
        .in("freelancer_id", freelancerIds);

    if (profilesError) {
      console.error(
        "[Gonka Freelancer Matching] Failed to load Trust Scores:",
        profilesError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Failed to load freelancer Trust Scores.",
        },
        { status: 500 }
      );
    }

    // ------------------------------------------------------------
    // STEP 2:
    // Get ONLY verified skills from profile_claims.
    //
    // UNVERIFIED / UNCERTAIN / other statuses are excluded.
    // ------------------------------------------------------------

    const { data: claims, error: claimsError } =
      await supabase
        .from("profile_claims")
        .select(
          "freelancer_id, claim_text, status"
        )
        .in("freelancer_id", freelancerIds)
        .eq("claim_type", "Skill")
        .eq("status", "VERIFIED");

    if (claimsError) {
      console.error(
        "[Gonka Freelancer Matching] Failed to load verified skills:",
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
    // Build trusted data map
    // ------------------------------------------------------------

    const trustedFreelancerData = new Map<
      string,
      {
        skills: string[];
        trustScore: number | null;
      }
    >();

    for (const freelancerId of freelancerIds) {
      trustedFreelancerData.set(freelancerId, {
        skills: [],
        trustScore: null,
      });
    }

    // ------------------------------------------------------------
    // Add ONLY VERIFIED skills
    //
    // Stored claim example:
    // "React - Expert"
    //
    // Gonka receives:
    // "React"
    // ------------------------------------------------------------

    for (const claim of claims ?? []) {
      const freelancer =
        trustedFreelancerData.get(
          claim.freelancer_id
        );

      if (!freelancer) {
        continue;
      }

      const separatorIndex =
        claim.claim_text.lastIndexOf(" - ");

      const skill =
        separatorIndex >= 0
          ? claim.claim_text
              .slice(0, separatorIndex)
              .trim()
          : claim.claim_text.trim();

      if (
        skill &&
        !freelancer.skills.includes(skill)
      ) {
        freelancer.skills.push(skill);
      }
    }

    // ------------------------------------------------------------
    // Add Trust Score from freelancer_profiles
    // ------------------------------------------------------------

    for (const profile of profiles ?? []) {
      const freelancer =
        trustedFreelancerData.get(
          profile.freelancer_id
        );

      if (!freelancer) {
        continue;
      }

      freelancer.trustScore =
        profile.trust_score ?? null;
    }

    // ------------------------------------------------------------
    // Replace frontend-provided skills + trustScore
    // with trusted database values.
    //
    // IMPORTANT:
    // There is NO fallback to body.freelancers values.
    // ------------------------------------------------------------

    const trustedFreelancers =
      body.freelancers.map((freelancer) => {
        const trusted =
          trustedFreelancerData.get(
            freelancer.id
          );

        const verifiedSkills =
          trusted?.skills ?? [];

        const trustScore =
          trusted?.trustScore ?? null;

        console.log(
          "[Gonka Freelancer Matching] Trusted freelancer:",
          freelancer.name || freelancer.id
        );

        console.log(
          "[Gonka Freelancer Matching] Verified skills:",
          verifiedSkills
        );

        console.log(
          "[Gonka Freelancer Matching] Database Trust Score:",
          trustScore
        );

        return {
          ...freelancer,

          // ONLY database-verified skills
          skills: verifiedSkills,

          // ONLY database Trust Score
          trustScore,
        };
      });

    // ------------------------------------------------------------
    // Send trusted freelancer data to Gonka
    // ------------------------------------------------------------

    const results = await matchFreelancers({
      ...body,
      freelancers: trustedFreelancers,
    });

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error(
      "Gonka Freelancer Matching error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to match freelancers.",
      },
      { status: 500 }
    );
  }
}
