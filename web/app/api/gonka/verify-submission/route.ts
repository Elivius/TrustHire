import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  verifyMilestoneSubmission,
} from "../../../../../gonka/integrations/submissionVerification";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
}

if (!supabaseSecretKey) {
  throw new Error("SUPABASE_SECRET_KEY is not configured");
}

const supabase = createClient(
  supabaseUrl,
  supabaseSecretKey,
);

export async function POST(
  request: NextRequest,
) {
  try {
    const body = await request.json();

    const {
      milestoneId,
      repository,
      prNumber,
      submissionDescription,
    } = body;

    // ============================================================
    // 1. VALIDATE REQUEST
    // ============================================================

    if (!milestoneId) {
      return NextResponse.json(
        {
          success: false,
          message: "milestoneId is required.",
        },
        { status: 400 },
      );
    }

    if (!repository?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message:
            "GitHub repository is required.",
        },
        { status: 400 },
      );
    }

    if (
      !Number.isInteger(prNumber) ||
      prNumber <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A valid GitHub Pull Request number is required.",
        },
        { status: 400 },
      );
    }

    // ============================================================
    // 2. GET MILESTONE
    // ============================================================

    const {
      data: milestone,
      error: milestoneError,
    } = await supabase
      .from("milestones")
      .select(
        `
          milestone_id,
          project_id,
          title,
          description,
          status
        `,
      )
      .eq(
        "milestone_id",
        milestoneId,
      )
      .single();

    if (milestoneError) {
      console.error(
        "[Gonka Submission Verification] Milestone lookup failed:",
        milestoneError,
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Failed to retrieve milestone.",
          error:
            milestoneError.message,
        },
        { status: 500 },
      );
    }

    if (!milestone) {
      return NextResponse.json(
        {
          success: false,
          message: "Milestone not found.",
        },
        { status: 404 },
      );
    }

    // ============================================================
    // 3. BUILD CLIENT REQUIREMENT
    // ============================================================

    const milestoneRequirement = [
      milestone.title
        ? `Milestone title: ${milestone.title}`
        : "",
      milestone.description
        ? `Milestone requirement: ${milestone.description}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    if (!milestoneRequirement.trim()) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The milestone does not contain a usable requirement.",
        },
        { status: 400 },
      );
    }

    // ============================================================
    // 4. RUN GONKA EVALUATION
    // ============================================================

    console.log(
      "[Gonka Submission Verification] Starting...",
    );

    console.log(
      "[Gonka Submission Verification] Milestone:",
      milestoneId,
    );

    console.log(
      "[Gonka Submission Verification] Repository:",
      repository,
    );

    console.log(
      "[Gonka Submission Verification] PR:",
      prNumber,
    );

    const verification =
      await verifyMilestoneSubmission({
        repository: repository.trim(),
        prNumber,
        milestoneRequirement,
        submissionDescription:
          submissionDescription?.trim() ?? "",
      });

    console.log(
      "[Gonka Submission Verification] Score:",
      verification.verificationScore,
    );

    console.log(
      "[Gonka Submission Verification] Gonka request ID:",
      verification.gonkaRequestId,
    );

    // ============================================================
    // 5. STORE VERIFICATION RESULT
    // ============================================================

    const {
      data: storedVerification,
      error: insertError,
    } = await supabase
      .from("milestone_verifications")
      .insert({
        milestone_id:
          milestone.milestone_id,

        score:
          verification.verificationScore,

        reasoning:
          verification.reasoning,

        suggestions:
          verification.suggestions,

        repository:
          verification.repository,

        pr_number:
          verification.prNumber,

        pr_title:
          verification.prTitle,

        gonka_request_id:
          verification.gonkaRequestId,

        status:
          "COMPLETED",
      })
      .select()
      .single();

    if (insertError) {
      console.error(
        "[Gonka Submission Verification] Database insert failed:",
        insertError,
      );

      /*
       * Gonka successfully evaluated the submission,
       * but the database failed to store the result.
       *
       * We return an error so the frontend does not
       * treat the submission as fully processed.
       */
      return NextResponse.json(
        {
          success: false,
          message:
            "Gonka verification succeeded, but the verification result could not be saved.",
          error:
            insertError.message,

          verification: {
            verificationScore:
              verification.verificationScore,

            reasoning:
              verification.reasoning,

            suggestions:
              verification.suggestions,

            gonkaRequestId:
              verification.gonkaRequestId,
          },
        },
        { status: 500 },
      );
    }

    // ============================================================
    // 6. RETURN RESULT
    // ============================================================

    return NextResponse.json({
      success: true,

      verification: {
        id:
          storedVerification?.verification_id,

        verificationScore:
          verification.verificationScore,

        reasoning:
          verification.reasoning,

        suggestions:
          verification.suggestions,

        gonkaRequestId:
          verification.gonkaRequestId,

        repository:
          verification.repository,

        prNumber:
          verification.prNumber,

        prTitle:
          verification.prTitle,

        prDescription:
          verification.prDescription,
      },
    });
  } catch (error) {
    console.error(
      "[Gonka Submission Verification] ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Milestone verification failed.",
      },
      { status: 500 },
    );
  }
}