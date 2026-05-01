import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import {
  buildSystemPrompt,
  buildUserPrompt,
  SCORE_RESULT_SCHEMA,
  type Lead,
  type ScoreResult,
} from "@/lib/scoringPrompt";

export const runtime = "nodejs";

const client = new Anthropic();

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

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Server is missing ANTHROPIC_API_KEY. Add it to .env.local." },
      { status: 500 },
    );
  }

  try {
    // We force the model to call this single tool. Its arguments ARE the
    // structured result — this gives us reliable JSON shaped to our schema
    // without any prompt-engineering for output format.
    const response = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 2048,
      system: [
        {
          type: "text",
          text: buildSystemPrompt(),
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: buildUserPrompt(lead) }],
      tools: [
        {
          name: "submit_score",
          description: "Submit the scoring result for this lead.",
          input_schema: SCORE_RESULT_SCHEMA as Anthropic.Tool.InputSchema,
        },
      ],
      tool_choice: { type: "tool", name: "submit_score" },
    });

    const toolUse = response.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return NextResponse.json(
        { error: "AI did not return a structured score" },
        { status: 502 },
      );
    }

    return NextResponse.json(toolUse.input as ScoreResult);
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `AI error: ${error.message}` },
        { status: error.status ?? 500 },
      );
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
