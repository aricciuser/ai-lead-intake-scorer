// ════════════════════════════════════════════════════════════════
//  CUSTOMIZE THIS FILE FOR YOUR BUSINESS
// ════════════════════════════════════════════════════════════════
//  Everything in this file describes WHO you sell to and HOW you
//  decide if a lead is a good fit. The AI reads this to score and
//  follow up on each lead. Edit the values below to match your
//  business — no other files need to change for basic customization.
// ════════════════════════════════════════════════════════════════

export const COMPANY = {
  name: "Acme Consulting",
  whatYouDo: "We help small B2B SaaS companies fix their onboarding flow.",
};

export const TARGET_CUSTOMER = `
Our ideal customer is:
- A B2B SaaS company with 10 to 100 employees
- $1M to $20M in annual revenue
- Has at least 100 paying customers
- Is losing customers in the first 30 days after signup
`.trim();

export const BUYING_SIGNALS = [
  "Mentions a specific drop-off problem (trial, onboarding, activation)",
  "Has a budget range or timeline in mind",
  "Decision maker (Founder, CEO, Head of Growth, VP Product)",
  "Says they have tried something already and it did not work",
  "Has a real company email (not gmail/yahoo/hotmail)",
];

export const POOR_FIT_SIGNALS = [
  "Pre-revenue or fewer than 50 customers",
  "Just looking, no specific problem",
  "Asks for free work or a discount before scoping",
  "B2C company",
  "Wants something we do not do (web design, ads, SEO)",
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

export type Lead = {
  fullName: string;
  email: string;
  company: string;
  role: string;
  companySize: string;
  problem: string;
  budget: string;
  timeline: string;
};

export type ScoreResult = {
  summary: string;
  fitScore: number;
  priority: "HOT" | "WARM" | "NURTURE" | "PASS";
  nextStep: string;
  followUpMessage: string;
};

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
Timeline: ${lead.timeline || "(not provided)"}`;
}
