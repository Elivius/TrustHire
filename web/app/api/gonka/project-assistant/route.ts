import { NextResponse } from "next/server";
import { chatWithProjectAssistant, type ProjectChatMessage } from "../../../../../gonka/integrations/projectAssistant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RequestBody { messages?: unknown; }

function isValidMessages(value: unknown): value is ProjectChatMessage[] {
  if (!Array.isArray(value) || value.length === 0) return false;
  return value.every((message) => {
    if (!message || typeof message !== "object") return false;
    const m = message as Record<string, unknown>;
    return (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim().length > 0;
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    if (!isValidMessages(body.messages)) {
      return NextResponse.json({ success: false, message: "Invalid Project Assistant messages." }, { status: 400 });
    }
    const result = await chatWithProjectAssistant(body.messages);
    return NextResponse.json({
      success: true,
      ...result,
      confirmed: result.status === "COMPLETED" && !!result.proposal,
    });
  } catch (error) {
    console.error("Project Assistant API error:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Project Assistant request failed.",
    }, { status: 500 });
  }
}
