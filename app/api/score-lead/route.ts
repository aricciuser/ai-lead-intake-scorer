import { NextResponse } from "next/server";
import { scoreLeadWithAnthropic } from "@/lib/providers/anthropic";
import { scoreLeadWithOpenAI } from "@/lib/providers/openai";
import type { Lead, Provider } from "@/lib/scoringPrompt";

export const runtime = "nodejs";

// ════════════════════════════════════════════════════════════════
//  DEFAULT AI PROVIDER
// ════════════════════════════════════════════════════════════════
//  Used when the form does not specify which provider to use
//  (e.g. if you call this API directly without a UI). Students can
//  override per-request via the toggle in the browser.
//
//  Options:
//    "openai"     → ChatGPT (gpt-4o)
//    "anthropic"  → Claude (claude-opus-4-7)
//
//  To add a new provider (e.g. OpenRouter) later, add it to the
//  Provider type in lib/scoringPrompt.ts, create a new file in
//  lib/providers/, and add a case in the switch below.
// ════════════════════════════════════════════════════════════════
const DEFAULT_PROVIDER: Provider = "openai";

const VALID_PROVIDERS: Provider[] = ["openai", "anthropic"];

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
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isValidLead(body)) {
    return NextResponse.json(
      { error: "Missing required lead fields" },
      { status: 400 },
    );
  }

  // Pick provider from the request, fall back to the default.
  const requested = (body as { provider?: unknown }).provider;
  const provider: Provider =
    typeof requested === "string" && VALID_PROVIDERS.includes(requested as Provider)
      ? (requested as Provider)
      : DEFAULT_PROVIDER;

  // Ensure full lead with optional fields defaulted to empty strings
  const fullLead: Lead = {
    ...body,
    budget: (body as Lead).budget ?? "",
    timeline: (body as Lead).timeline ?? "",
    notes: (body as Lead).notes ?? "",
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
