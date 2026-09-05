import { NextRequest, NextResponse } from "next/server";
import {
  matchProjects,
  type MatchProjectsInput,
} from "@/../../gonka/integrations/matchProjects";

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

    console.log(
      "[Gonka Project Matching] Freelancer:",
      body.freelancer.name || body.freelancer.id
    );

    console.log(
      "[Gonka Project Matching] Projects received:",
      body.projects.length
    );

    const results = await matchProjects(body);

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