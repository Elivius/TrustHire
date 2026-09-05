import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const freelancerId =
      request.nextUrl.searchParams.get("freelancerId");

    if (!freelancerId) {
      return NextResponse.json(
        {
          success: false,
          message: "Freelancer ID is required.",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("project_match_results")
      .select(`
        project_id,
        match_score,
        reasoning,
        skill_evaluation,
        gonka_request_id
      `)
      .eq("freelancer_id", freelancerId)
      .order("match_score", {
        ascending: false,
      });

    if (error) {
      console.error(
        "[Gonka Match Results] Failed to load cached results:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message: "Failed to load cached match results.",
        },
        { status: 500 }
      );
    }

    const results = (data ?? []).map((row) => ({
      projectId: row.project_id,
      matchScore: row.match_score,
      reasoning: row.reasoning,
      skillEvaluation: row.skill_evaluation,
      gonkaRequestId: row.gonka_request_id,
    }));

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error(
      "[Gonka Match Results] Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load match results.",
      },
      { status: 500 }
    );
  }
}