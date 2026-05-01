import OpenAI from "openai";
import {
  buildSystemPrompt,
  buildUserPrompt,
  SCORE_RESULT_SCHEMA,
  type Lead,
  type ScoreResult,
} from "@/lib/scoringPrompt";

let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "Missing OPENAI_API_KEY. Add it to .env.local (local) or your Vercel project's environment variables (production).",
      );
    }
    client = new OpenAI();
  }
  return client;
}

export async function scoreLeadWithOpenAI(lead: Lead): Promise<ScoreResult> {
  // Same forced-tool approach as the Anthropic path: define one function and
  // require the model to call it. Its arguments are the structured result.
  const response = await getClient().chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: buildUserPrompt(lead) },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "submit_score",
          description: "Submit the scoring result for this lead.",
          parameters: SCORE_RESULT_SCHEMA,
          strict: true,
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "submit_score" } },
  });

  const toolCall = response.choices[0]?.message?.tool_calls?.[0];
  if (!toolCall || toolCall.type !== "function") {
    throw new Error("OpenAI returned no structured score");
  }
  return JSON.parse(toolCall.function.arguments) as ScoreResult;
}
