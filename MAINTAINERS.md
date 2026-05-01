# Maintainer notes

This file is for the person running the course (Anthony) and anyone helping
operate this capstone repo. Students do not need to read this — they only
need `README.md`.

---

## What this repo is

A Next.js 15 + TypeScript capstone where students:

1. Clone the repo
2. Customize the business logic in `lib/scoringPrompt.ts`
3. Pick an AI provider (OpenAI or Anthropic) by editing one line of code
4. Add an API key locally and on Vercel
5. Deploy and watch their tool score real-looking leads

The **intention** is to teach the full ship-a-real-thing loop — form,
prompt, AI response, business logic, env vars, GitHub, Vercel, browser
testing — using the smallest viable surface area. No database, no auth,
no dashboard, no CRM integration. One page, one form, one prompt.

---

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15.5 (App Router) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS |
| AI providers | OpenAI (`gpt-4o`) and Anthropic (`claude-opus-4-7`) |
| Hosting | Vercel |
| CI / dependency updates | Dependabot + quarterly remote Claude Code routine |

---

## Architecture

### Provider abstraction

Both AI vendors live behind a small interface so the rest of the app stays
provider-agnostic:

```
components/LeadForm.tsx              ← user picks provider via UI toggle
app/api/score-lead/route.ts          ← reads provider from request body
└── lib/providers/
    ├── openai.ts                    ← scoreLeadWithOpenAI(lead)
    ├── anthropic.ts                 ← scoreLeadWithAnthropic(lead)
    └── types.ts                     ← shared ScoreLeadFn signature
```

The toggle is a segmented control at the top of the form (ChatGPT /
Claude). The form sends `provider` in the JSON body; the route validates
it against the `Provider` union type in `lib/scoringPrompt.ts` and
dispatches to the matching `lib/providers/*.ts` module.

The route also has a `DEFAULT_PROVIDER` constant used as a fallback if a
direct API call omits the `provider` field. The UI always sends one, so
the default only kicks in for raw API consumers.

**Adding a new provider** (e.g. OpenRouter, Gemini): add the value to the
`Provider` type in `lib/scoringPrompt.ts`, add a label to the `PROVIDERS`
array in the same file, create a new file in `lib/providers/`, and add a
case in the route's switch. The toggle UI auto-renders the new option from
the `PROVIDERS` array — no form changes needed.

### Structured output

Both providers use **forced single-function tool use** against the same
JSON schema (`SCORE_RESULT_SCHEMA` in `lib/scoringPrompt.ts`). The function's
input arguments are the result shape, so the API returns reliable JSON
without any prompt-engineering for output format. Single source of truth
for the schema; both providers consume it.

### Prompt caching

The Anthropic path wraps the system prompt in a text block with
`cache_control: { type: "ephemeral" }`. OpenAI's automatic prompt caching
covers the same case server-side (no client-side flag needed).

### Customization surface

Students are intended to edit only one file for basic customization:
`lib/scoringPrompt.ts`. It contains a clearly-marked CUSTOMIZE banner and
exports business-specific constants (`COMPANY`, `TARGET_CUSTOMER`,
`BUYING_SIGNALS`, etc.). The prompt builder consumes these, so editing
the constants is enough to retarget the scorer for any business.

The form (`components/LeadForm.tsx`) and result UI
(`components/LeadResult.tsx`) are also customization-friendly but require
matching changes to the `Lead` type and `buildUserPrompt()` if fields are
added or renamed.

---

## Deploying to Vercel

1. Sign in to [vercel.com](https://vercel.com) with GitHub.
2. **Add New → Project**, pick the GitHub repo.
3. Vercel auto-detects Next.js. Don't change framework, root, or build command.
4. Expand **Environment Variables** and add the API key for whichever
   provider `AI_PROVIDER` is set to in `app/api/score-lead/route.ts`:
   - `OPENAI_API_KEY` (default — value starts with `sk-...`)
   - `ANTHROPIC_API_KEY` (if `AI_PROVIDER` is `"anthropic"` — value starts
     with `sk-ant-...`)
   - Apply to **Production**, **Preview**, AND **Development**
5. Click **Deploy**. First build takes 1-2 minutes.

Subsequent deploys are automatic on every `git push` to the connected branch.

**If the live site says "Missing OPENAI_API_KEY" or "Missing
ANTHROPIC_API_KEY":**
1. Project → **Settings → Environment Variables**
2. Add (or edit) the missing key, applied to all three environments
3. **Deployments → most recent → ⋯ → Redeploy** (Vercel does NOT
   auto-redeploy on env var changes — students will hit this)

The student-facing version of these steps is in `README.md`.

---

## Dependency hygiene

Two layers protect the repo from rotting between cohorts:

### Layer 1 — Dependabot (immediate, security-focused)

`.github/dependabot.yml` is configured so GitHub:
- Opens a PR within hours of any **security advisory** affecting our deps
- Opens a weekly grouped PR for routine minor/patch bumps (capped at 5
  open PRs at a time)

Verify both **Dependabot alerts** and **Dependabot security updates** are
enabled at: repo → **Settings → Code security**. Both default to on for
public repos.

### Layer 2 — Quarterly Claude Code routine

A remote Claude Code agent runs on the first day of January, April, July,
and October at 17:00 UTC (10am Pacific) to keep dependencies fresh.

- **Routine name:** `ai-lead-intake-scorer: quarterly dependency check`
- **Routine ID:** `trig_016oBENATmG11cyDsSLsRJbU`
- **Cron:** `0 17 1 1,4,7,10 *`
- **Manage at:** https://claude.ai/code/routines/trig_016oBENATmG11cyDsSLsRJbU

The routine clones the repo, checks npm for newer `next`,
`@anthropic-ai/sdk`, and `openai`, and only opens a PR if the production
build still passes after the bump. Worst case: a PR you can close without
merging. The agent cannot touch `main` directly or modify other dependencies.

To pause (e.g. during a course freeze), open the routine link and toggle
it off. To delete, use the same URL — there is no API for delete.

---

## Updating the repo for a new cohort

Before each cohort:

1. Pull the latest:
   ```bash
   git pull origin main
   ```
2. Merge or close any open Dependabot or quarterly-routine PRs.
3. Smoke-test:
   ```bash
   rm -rf .next node_modules
   npm install
   npx next build
   ```
4. Optionally verify a live scoring call by adding a key to `.env.local`,
   running `npm run dev`, and submitting a test lead through the UI.
5. Commit any updates and push.

---

## Things to leave alone

- **Don't add a database, auth, or user accounts.** This is intentionally
  a one-page tool. The course's framing is "this is your first working
  tool, not the final one" — adding complexity here would defeat that.
- **Don't downgrade the models** (`gpt-4o` and `claude-opus-4-7`) unless a
  course-cost issue forces it. Follow-up message quality is what makes the
  demo feel real to students; weaker models produce visibly worse output.
- **Don't drop the provider abstraction** to "simplify". The two-file
  `lib/providers/` layer is the whole point of the dual-provider design —
  collapsing it back into the route ties the project to one vendor again.
- **Don't unify the env-copy step in the README** to a single command. Mac
  uses `cp`, Windows PowerShell uses `Copy-Item`, Windows CMD uses `copy`.
  Showing all three prevents the most common day-one student failure.

---

## Future enhancements

Backlog of intentional next steps for future course iterations. None of
these are needed for the current capstone to work — they're upgrades for
later cohorts or follow-on lessons.

### OpenRouter (third provider)

Add OpenRouter as a third option alongside ChatGPT and Claude. OpenRouter
fronts dozens of models behind one API, so this is the natural step into
"one app, many models" territory. The provider-abstraction work is already
done — adding it is mechanical:

1. Add `"openrouter"` to the `Provider` union in `lib/scoringPrompt.ts`
2. Add a label to the `PROVIDERS` array (the form toggle reads from this)
3. Create `lib/providers/openrouter.ts` (OpenRouter has an OpenAI-compatible
   API, so this can largely mirror `openai.ts` with a different `baseURL`)
4. Add a case in the route's dispatcher
5. Add `OPENROUTER_API_KEY` to `.env.example` and Vercel

### Side-by-side comparison mode

A "Score with both" button that fires parallel requests to ChatGPT and
Claude (and OpenRouter, once added) and shows the results next to each
other. Useful for course demos where the contrast between vendors is the
whole point.

### Workflow-determined provider switching

Beyond a manual toggle: the app picks the provider automatically based on
rules (cost cap, time of day, lead source, customer tier, etc.) using a
separate routing layer. The progression for the course is:

1. Hardcoded in code (early scaffold)
2. UI toggle *(current)*
3. Add OpenRouter for many-models access
4. Rule-based switch in code
5. External orchestration (AI gateway / model router)

Each step earns the next one.

### Other ideas

- Save scored leads to a persistent store (Vercel KV or Postgres) and
  show a history page — this is the natural intro to "your first
  database" lesson.
- Add a Resend integration so the draft follow-up message can be sent
  directly from the result screen.
- A `compare-prompts` mode where the student edits their prompt and the
  app re-scores the same lead with the old vs. new prompt side by side,
  to teach prompt iteration.

---

## Repo metadata

- Public GitHub repo: https://github.com/aricciuser/ai-lead-intake-scorer
- License: not currently set (consider adding MIT before broad student
  release if you want students to legally remix and republish)
- Maintainer: aricciuser
