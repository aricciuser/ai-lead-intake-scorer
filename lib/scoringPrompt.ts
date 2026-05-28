// ════════════════════════════════════════════════════════════════
//  CUSTOMIZE THIS FILE FOR YOUR BUSINESS
// ════════════════════════════════════════════════════════════════
//  Everything in this file describes WHO you sell to and HOW you
//  decide if a lead is a good fit. The AI reads this to score and
//  follow up on each lead. Edit the values below to match your
//  business — no other files need to change for basic customization.
// ════════════════════════════════════════════════════════════════

export const COMPANY = {
  name: "SIFTR",
  whatYouDo: `We build software. We automate everything. From concept to launch.
We build AI-powered workflows, full-stack applications, and automated pipelines
that eliminate busywork and multiply your team's output.`,
};

export const TARGET_CUSTOMER = `
Our ideal customer is:
- A business drowning in manual, repetitive work that should be automated
- Has a specific process, workflow, or app they want built or streamlined
- Decision maker or operator who feels the pain directly (Founder, COO, Ops lead)
- Has budget to invest in custom software or automation (not looking for free)
- Wants to ship something real, from concept to launch, not just talk
`.trim();

export const BUYING_SIGNALS = [
  "Names a specific manual process, workflow, or app they want built or automated",
  "Describes busywork, repetitive tasks, or tools that don't talk to each other",
  "Has a budget range or timeline in mind",
  "Decision maker or operator who owns the problem (Founder, CEO, COO, Ops lead)",
  "Has tried to fix it before (spreadsheets, Zapier, hiring) and hit a wall",
  "Has a real company email (not gmail/yahoo/hotmail)",
];

export const POOR_FIT_SIGNALS = [
  "Just browsing, no specific process or project in mind",
  "Asks for free work or a discount before scoping",
  "Wants something we do not do (ads, SEO, paid media, pure design work)",
  "No budget and no authority to spend",
  "Wants a quick template or DIY tool, not a built solution",
];

// Score buckets and what they mean. The AI will pick a label based on
// the score it returns.
export const PRIORITY_BANDS = `
- 80-100: HOT — call within 1 hour, this is a strong fit
- 60-79: WARM — reach out today, has potential
- 40-59: NURTURE — not ready now, add to long-term follow up
- 0-39: PASS — politely decline or send to a free resource
`.trim();

// The tone of the follow up message. Be specific. The AI will copy this voice.
export const FOLLOW_UP_TONE = `
Friendly, direct, no fluff. Sound like a real person, not marketing.
Use short sentences. Use the lead's first name. Reference one specific
thing they said. Always end with one clear question or next step.
Never use the words "synergy", "leverage", or "circle back".
`.trim();

// ════════════════════════════════════════════════════════════════
//  END CUSTOMIZATION ZONE — you usually do not need to edit below
// ════════════════════════════════════════════════════════════════

// AI providers the app currently supports. Add more here (e.g. "openrouter")
// when wiring in a new provider — the toggle UI and the API route both read
// from this union.
export type Provider = "openai" | "anthropic";

export const PROVIDERS: { value: Provider; label: string }[] = [
  { value: "openai", label: "ChatGPT" },
  { value: "anthropic", label: "Claude" },
];

export type Lead = {
  fullName: string;
  email: string;
  company: string;
  role: string;
  companySize: string;
  problem: string;
  budget: string;
  timeline: string;
  notes: string;
};

export type ScoreResult = {
  summary: string;
  fitScore: number;
  priority: "HOT" | "WARM" | "NURTURE" | "PASS";
  nextStep: string;
  followUpMessage: string;
};

// What the API returns: the AI's scoring output plus which provider produced
// it. The provider is added by the route, not by the AI.
export type ScoreResponse = ScoreResult & { provider: Provider };

export const SCORE_RESULT_SCHEMA = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description:
        "Two to three sentence summary of who this lead is and what they need.",
    },
    fitScore: {
      type: "integer",
      minimum: 0,
      maximum: 100,
      description: "Fit score from 0 to 100. Higher = better fit.",
    },
    priority: {
      type: "string",
      enum: ["HOT", "WARM", "NURTURE", "PASS"],
      description: "Priority label based on the fit score and signals.",
    },
    nextStep: {
      type: "string",
      description:
        "One specific recommended next action for the sales rep, in plain language.",
    },
    followUpMessage: {
      type: "string",
      description:
        "Draft follow up message addressed to the lead, ready to send.",
    },
  },
  required: ["summary", "fitScore", "priority", "nextStep", "followUpMessage"],
  additionalProperties: false,
};

export function buildSystemPrompt(): string {
  return `You score sales leads for ${COMPANY.name}.

WHAT THE COMPANY DOES
${COMPANY.whatYouDo}

WHO THEY SELL TO
${TARGET_CUSTOMER}

BUYING SIGNALS (raise the score)
${BUYING_SIGNALS.map((s, i) => `${i + 1}. ${s}`).join("\n")}

POOR FIT SIGNALS (lower the score)
${POOR_FIT_SIGNALS.map((s, i) => `${i + 1}. ${s}`).join("\n")}

PRIORITY BANDS
${PRIORITY_BANDS}

FOLLOW UP MESSAGE TONE
${FOLLOW_UP_TONE}

INSTRUCTIONS
- Read the lead carefully. Be honest. Do not inflate scores to be nice.
- The fitScore is a single integer from 0 to 100.
- Pick the priority label that matches the score band.
- The nextStep is for the sales rep, not the lead. Be concrete.
- The followUpMessage is addressed to the lead. Use their first name.
  Reference one specific thing they said. End with one clear question.
- If the lead is missing info, say so in the summary and score what you have.`;
}

export function buildUserPrompt(lead: Lead): string {
  return `Here is a new lead. Score it.

Full name: ${lead.fullName}
Email: ${lead.email}
Company: ${lead.company}
Role: ${lead.role}
Company size: ${lead.companySize}
Problem they described: ${lead.problem}
Budget: ${lead.budget || "(not provided)"}
Timeline: ${lead.timeline || "(not provided)"}
Additional notes: ${lead.notes || "(none)"}`;
}
