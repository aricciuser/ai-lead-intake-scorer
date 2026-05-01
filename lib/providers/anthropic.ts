import Anthropic from "@anthropic-ai/sdk";
import {
  buildSystemPrompt,
  buildUserPrompt,
  SCORE_RESULT_SCHEMA,
  type Lead,
  type ScoreResult,
} from "@/lib/scoringPrompt";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        "Missing ANTHROPIC_API_KEY. Add it to .env.local (local) or your Vercel project's environment variables (production).",
      );
    }
    client = new Anthropic();
  }
  return client;
}

export async function scoreLeadWithAnthropic(lead: Lead): Promise<ScoreResult> {
  // We force a single tool call. The tool's input arguments ARE the
  // structured result. This gives reliable JSON without prompting tricks.
  const response = await getClient().messages.create({
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
    throw new Error("Anthropic returned no structured score");
  }
  return toolUse.input as ScoreResult;
}
