import { NextRequest, NextResponse } from "next/server";
import {
  matchFreelancers,
  type MatchFreelancersInput,
} from "@/../../gonka/integrations/matchFreelancers";

export async function POST(request: NextRequest) {
  try {
    const body =
      (await request.json()) as MatchFreelancersInput;

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

    const results =
      await matchFreelancers(body);

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