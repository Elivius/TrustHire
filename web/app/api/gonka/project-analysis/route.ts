import { NextResponse } from "next/server";
import { analyzeProject } from "../../../../../gonka/integrations/projectAnalysis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ProjectAssistantRequirements {
  projectTitle: string;
  description: string;
  coreFeatures: string[];
  targetUsers?: string[];
  platform?: string;
  budget: { amount: number; currency: string };
  timeline: { days: number };
}

interface RequestBody { requirements?: ProjectAssistantRequirements; }

function isValidRequirements(value: unknown): value is ProjectAssistantRequirements {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  if (typeof r.projectTitle !== "string" || !r.projectTitle.trim()) return false;
  if (typeof r.description !== "string" || !r.description.trim()) return false;
  if (!Array.isArray(r.coreFeatures) || !r.coreFeatures.every((x) => typeof x === "string")) return false;
  if (!r.budget || typeof r.budget !== "object") return false;
  const b = r.budget as Record<string, unknown>;
  if (typeof b.amount !== "number" || !Number.isFinite(b.amount) || b.amount <= 0) return false;
  if (typeof b.currency !== "string" || !b.currency.trim()) return false;
  if (!r.timeline || typeof r.timeline !== "object") return false;
  const t = r.timeline as Record<string, unknown>;
  if (typeof t.days !== "number" || !Number.isInteger(t.days) || t.days <= 0) return false;
  if (r.targetUsers !== undefined && (!Array.isArray(r.targetUsers) || !r.targetUsers.every((x) => typeof x === "string"))) return false;
  if (r.platform !== undefined && typeof r.platform !== "string") return false;
  return true;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    if (!isValidRequirements(body.requirements)) {
      return NextResponse.json({ success: false, message: "Invalid Project Assistant requirements." }, { status: 400 });
    }
    console.log("Starting Gonka Project Analysis:", body.requirements.projectTitle);
    const result = await analyzeProject(body.requirements);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Project Analysis API error:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Project Analysis request failed.",
    }, { status: 500 });
  }
}
