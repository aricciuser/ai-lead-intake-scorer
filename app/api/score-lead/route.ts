import { NextResponse } from "next/server";
import { scoreLeadWithAnthropic } from "@/lib/providers/anthropic";
import { scoreLeadWithOpenAI } from "@/lib/providers/openai";
import type { Lead } from "@/lib/scoringPrompt";

export const runtime = "nodejs";

// ════════════════════════════════════════════════════════════════
//  AI PROVIDER TOGGLE — change this line to switch vendors
// ════════════════════════════════════════════════════════════════
//  Options:
//    "openai"     → ChatGPT (gpt-4o)
//    "anthropic"  → Claude (claude-opus-4-7)
//
//  After editing, save, commit, push. Vercel auto-redeploys with the
//  new provider. Make sure the matching API key is set in .env.local
//  (locally) and in Vercel → Settings → Environment Variables (prod).
// ════════════════════════════════════════════════════════════════
const AI_PROVIDER: "openai" | "anthropic" = "openai";

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

  const provider = AI_PROVIDER;

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
