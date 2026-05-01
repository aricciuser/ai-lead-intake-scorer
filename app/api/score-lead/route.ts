import { NextResponse } from "next/server";
import { scoreLeadWithAnthropic } from "@/lib/providers/anthropic";
import { scoreLeadWithOpenAI } from "@/lib/providers/openai";
import type { Lead } from "@/lib/scoringPrompt";

export const runtime = "nodejs";

function isValidLead(body: unknown): body is Lead {
  if (!body || typeof body !== "object") return false;
  const required = ["fullName", "email", "company", "role", "companySize", "problem"];
  for (const key of required) {
    const value = (body as Record<string, unknown>)[key];
    if (typeof value !== "string" || value.trim() === "") return false;
  }
  return true;
}

export async function POST(request: Request) {
  let lead: unknown;
  try {
    lead = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isValidLead(lead)) {
    return NextResponse.json(
      { error: "Missing required lead fields" },
      { status: 400 },
    );
  }

  // AI_PROVIDER picks which model service runs the scoring.
  //   - "openai"    (default) → OpenAI / ChatGPT
  //   - "anthropic"           → Claude
  // Set this in .env.local for development and in Vercel env vars for prod.
  const provider =
    process.env.AI_PROVIDER === "anthropic" ? "anthropic" : "openai";

  // Ensure full lead with optional fields defaulted to empty strings
  const fullLead: Lead = {
    ...lead,
    budget: (lead as Lead).budget ?? "",
    timeline: (lead as Lead).timeline ?? "",
    notes: (lead as Lead).notes ?? "",
  };

  try {
    const result =
      provider === "anthropic"
        ? await scoreLeadWithAnthropic(fullLead)
        : await scoreLeadWithOpenAI(fullLead);
    return NextResponse.json({ ...result, provider });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `${provider}: ${message}` },
      { status: 500 },
    );
  }
}
