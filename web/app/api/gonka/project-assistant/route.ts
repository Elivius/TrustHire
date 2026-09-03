import { NextResponse } from "next/server";
import { chatWithProjectAssistant } from "../../../../../gonka/integrations/projectAssistant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ProjectChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  messages?: ProjectChatMessage[];
}

function isValidMessage(value: unknown): value is ProjectChatMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const message = value as Record<string, unknown>;

  return (
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    message.content.trim().length > 0
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "At least one project chat message is required.",
        },
        { status: 400 }
      );
    }

    if (!body.messages.every(isValidMessage)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid project chat message format.",
        },
        { status: 400 }
      );
    }

    const result = await chatWithProjectAssistant(body.messages);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Project Assistant API error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Project Assistant request failed.",
      },
      { status: 500 }
    );
  }
}