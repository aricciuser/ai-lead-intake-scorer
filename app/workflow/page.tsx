import Link from "next/link";
import type { Metadata } from "next";
import { COMPANY, PROVIDERS } from "@/lib/scoringPrompt";

export const metadata: Metadata = {
  title: "How it works — AI Lead Intake Scorer",
  description:
    "A visual walkthrough of how a lead flows from the browser form, through the API guards and AI provider, to a structured score and follow-up.",
};

// This page is intentionally public — it has no <UnlockGate> and makes no
// API calls, so it renders for anyone without the page password. It is a
// static diagram of the architecture, kept in sync with the real code by
// importing COMPANY and PROVIDERS from lib/scoringPrompt.ts.

// ── The nine fields the form collects (from the Lead type) ──
const LEAD_FIELDS = [
  "fullName",
  "email",
  "company",
  "role",
  "companySize",
  "problem",
  "budget",
  "timeline",
  "notes",
];

// ── The guards POST /api/score-lead runs before any LLM call ──
const GUARDS = [
  {
    name: "Password gate",
    detail: "Needs the unlock cookie when PAGE_PASSWORD is set",
    file: "lib/auth.ts",
  },
  {
    name: "Per-IP rate limit",
    detail: "Max 10 requests / 15 min from one IP",
    file: "lib/rateLimit.ts",
  },
  {
    name: "Daily cost cap",
    detail: "Hard ceiling of 100 calls / day across everyone",
    file: "lib/rateLimit.ts",
  },
  {
    name: "Lead validation",
    detail: "Required fields present, valid JSON body",
    file: "app/api/score-lead/route.ts",
  },
];

// ── What the AI returns (from SCORE_RESULT_SCHEMA) ──
const RESULT_FIELDS = [
  { name: "summary", detail: "2–3 sentences on who this lead is" },
  { name: "fitScore", detail: "Integer 0–100" },
  { name: "priority", detail: "HOT · WARM · NURTURE · PASS" },
  { name: "nextStep", detail: "Concrete action for the rep" },
  { name: "followUpMessage", detail: "Draft message, ready to send" },
];

// ── The business logic the prompt is built from (scoringPrompt.ts) ──
const PROMPT_PIECES = [
  "COMPANY",
  "TARGET_CUSTOMER",
  "BUYING_SIGNALS",
  "POOR_FIT_SIGNALS",
  "PRIORITY_BANDS",
  "FOLLOW_UP_TONE",
];

const PROVIDER_MODELS: Record<string, string> = {
  openai: "gpt-4o",
  anthropic: "claude-opus-4-7",
};

function Arrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center py-1.5" aria-hidden="true">
      {label ? (
        <span className="mb-1 font-mono text-[11px] text-gray-400">{label}</span>
      ) : null}
      <svg width="20" height="22" viewBox="0 0 20 22" className="text-gray-300">
        <line x1="10" y1="0" x2="10" y2="15" stroke="currentColor" strokeWidth="2" />
        <path d="M4 13 L10 21 L16 13" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    </div>
  );
}

function Stage({
  step,
  title,
  subtitle,
  file,
  accent,
  children,
}: {
  step: number;
  title: string;
  subtitle?: string;
  file?: string;
  accent: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative w-full rounded-lg border bg-white p-5 shadow-sm sm:p-6">
      <span
        className={`absolute -left-3 -top-3 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold text-white ${accent}`}
      >
        {step}
      </span>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {file ? (
          <code className="font-mono text-xs text-gray-400">{file}</code>
        ) : null}
      </div>
      {subtitle ? (
        <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded border bg-gray-50 px-2 py-1 font-mono text-xs text-gray-700">
      {children}
    </span>
  );
}

export default function WorkflowPage() {
  return (
    <main className="min-h-screen px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <header className="mb-10 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-gray-400">
            Architecture
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            How the {COMPANY.name} Lead Scorer works
          </h1>
          <p className="mt-3 text-gray-600">
            One form, one API route, one prompt, two AI providers. Here is the
            full path a lead takes from typed-in to scored.
          </p>
          <Link
            href="/"
            className="mt-5 inline-block rounded-md border bg-white px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-gray-50"
          >
            ← Back to the scorer
          </Link>
        </header>

        <div className="flex flex-col items-stretch">
          {/* 1 — Browser form */}
          <Stage
            step={1}
            title="Lead comes in"
            subtitle="A rep fills out the form in the browser and picks an AI provider."
            file="components/LeadForm.tsx"
            accent="bg-slate-700"
          >
            <div className="flex flex-wrap gap-2">
              {LEAD_FIELDS.map((f) => (
                <Chip key={f}>{f}</Chip>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-500">Provider toggle:</span>
              {PROVIDERS.map((p) => (
                <span
                  key={p.value}
                  className="rounded-full border border-gray-300 px-3 py-1 text-sm font-medium"
                >
                  {p.label}
                </span>
              ))}
            </div>
          </Stage>

          <Arrow label="POST { ...lead, provider }" />

          {/* 2 — API route */}
          <Stage
            step={2}
            title="API route"
            subtitle="Runs on a Node.js Vercel function. Every request passes the guards before any AI is called."
            file="app/api/score-lead/route.ts"
            accent="bg-black"
          >
            <ol className="space-y-2">
              {GUARDS.map((g, i) => (
                <li
                  key={g.name}
                  className="flex items-start gap-3 rounded-md border bg-gray-50 p-3"
                >
                  <span className="mt-0.5 font-mono text-xs text-gray-400">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{g.name}</p>
                    <p className="text-xs text-gray-500">{g.detail}</p>
                  </div>
                  <code className="ml-auto hidden font-mono text-[11px] text-gray-400 sm:block">
                    {g.file}
                  </code>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-gray-500">
              Any guard failing returns an error (401 / 429 / 400) and stops
              here — no AI call, no cost.
            </p>
          </Stage>

          <Arrow label="dispatch by provider" />

          {/* 3 — Provider split */}
          <Stage
            step={3}
            title="AI provider does the scoring"
            subtitle="The route sends the prompt to whichever provider the request asked for. Both return the same structured shape."
            accent="bg-indigo-600"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {PROVIDERS.map((p) => (
                <div
                  key={p.value}
                  className="rounded-md border bg-gray-50 p-4 text-center"
                >
                  <p className="text-sm font-semibold">{p.label}</p>
                  <code className="mt-1 block font-mono text-xs text-gray-500">
                    {PROVIDER_MODELS[p.value] ?? p.value}
                  </code>
                  <p className="mt-2 font-mono text-[11px] text-gray-400">
                    lib/providers/{p.value}.ts
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-md border border-dashed border-purple-300 bg-purple-50/60 p-4">
              <p className="text-sm font-medium text-purple-900">
                Both read the same prompt + schema
              </p>
              <p className="mt-1 text-xs text-purple-700">
                Your business logic lives in one file. Edit these constants to
                retune scoring — no other file changes.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {PROMPT_PIECES.map((piece) => (
                  <Chip key={piece}>{piece}</Chip>
                ))}
              </div>
              <code className="mt-3 block font-mono text-[11px] text-purple-400">
                lib/scoringPrompt.ts
              </code>
            </div>
          </Stage>

          <Arrow label="structured JSON" />

          {/* 4 — Result */}
          <Stage
            step={4}
            title="Structured result comes back"
            subtitle="The AI is constrained to this exact shape, so the UI can render it directly."
            file="components/LeadResult.tsx"
            accent="bg-emerald-600"
          >
            <ul className="space-y-2">
              {RESULT_FIELDS.map((r) => (
                <li
                  key={r.name}
                  className="flex items-baseline justify-between gap-3 border-b pb-2 last:border-0 last:pb-0"
                >
                  <code className="font-mono text-sm font-medium text-emerald-700">
                    {r.name}
                  </code>
                  <span className="text-right text-sm text-gray-600">
                    {r.detail}
                  </span>
                </li>
              ))}
            </ul>
          </Stage>
        </div>

        <footer className="mt-12 border-t pt-6 text-center text-sm text-gray-500">
          <p>
            No database, no CRM, no dashboard. The whole tool is{" "}
            <span className="font-medium text-gray-700">
              one form → one route → one prompt → two providers
            </span>
            .
          </p>
          <p className="mt-2">
            Stack: Next.js 15 App Router · React 19 · TypeScript · Tailwind ·
            deployed on Vercel.
          </p>
        </footer>
      </div>
    </main>
  );
}
