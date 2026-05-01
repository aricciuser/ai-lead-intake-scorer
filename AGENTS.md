# AGENTS.md — guide for AI coding assistants

If you are an AI assistant (Cursor, Claude Code, Copilot, Codex, etc.)
working in this repo on behalf of a student, **read this file first**.
It tells you what the project is, which files are safe to edit, and how
to make the most common student-requested changes without breaking
anything.

If you are a human, this file is a quick map of the codebase. The full
narrative is in `README.md` (for students) and `MAINTAINERS.md` (for the
course operator).

---

## What this is

A Next.js 15 single-page browser tool that scores a sales lead with an
LLM and returns: a summary, a 0-100 fit score, a HOT/WARM/NURTURE/PASS
priority, a recommended next step, and a draft follow-up message.

It is a **teaching capstone**. The whole codebase fits in your head: one
form, one API route, one prompt file, two provider modules. There is no
database, no auth, no dashboard, no CRM. Don't add any of those.

**Stack:** Next.js 15.5 App Router · React 19 · TypeScript · Tailwind ·
Anthropic SDK · OpenAI SDK · Vercel.

**Two AI providers** behind a small abstraction:
- OpenAI (`gpt-4o`) — default
- Anthropic (`claude-opus-4-7`)

The user picks per-request via a toggle in the form (ChatGPT / Claude).

---

## File map

| Path | Intent | Edit freely? |
|------|--------|--------------|
| `lib/scoringPrompt.ts` | Business logic + prompt + schema | ✅ **Yes — primary customization file** |
| `components/LeadForm.tsx` | Form UI | ✅ Yes (sync with `Lead` type) |
| `components/LeadResult.tsx` | Result UI | ✅ Yes |
| `app/page.tsx` | Page shell, headline | ✅ Yes |
| `app/globals.css`, `tailwind.config.ts` | Styling | ✅ Yes |
| `app/api/score-lead/route.ts` | API route, provider dispatch | ⚠️ Edit with care |
| `lib/providers/openai.ts` | OpenAI call | ⚠️ Edit with care |
| `lib/providers/anthropic.ts` | Anthropic call | ⚠️ Edit with care |
| `lib/providers/types.ts` | Provider interface | ⚠️ Edit with care |
| `app/layout.tsx` | HTML shell | Rarely needed |
| `package.json`, `tsconfig.json`, `next.config.mjs` | Build config | ❌ Don't touch unless explicitly asked |
| `.env.example` | Env var template | ✅ Update when adding new env vars |
| `.github/dependabot.yml` | Dependency update bot | ❌ Don't touch |

---

## Rules of the road

These are **synchronized-change rules**. If you change one of these,
you must change the others in the same edit.

### 1. Lead form fields

Adding, removing, or renaming a form field requires changes in **four**
places:

| File | What to change |
|------|----------------|
| `lib/scoringPrompt.ts` | Add/remove/rename in the `Lead` type |
| `lib/scoringPrompt.ts` | Add/remove/rename in `buildUserPrompt()` so the AI sees it |
| `components/LeadForm.tsx` | Add/remove in `EMPTY_LEAD` |
| `components/LeadForm.tsx` | Add/remove the JSX `<Field>` or `<TextArea>` |

If the field affects scoring, also consider updating `BUYING_SIGNALS`
or `POOR_FIT_SIGNALS` in `lib/scoringPrompt.ts` so the AI knows what
the field means for fit.

### 2. AI provider list

Adding a new provider (e.g. OpenRouter, Gemini) requires changes in
**five** places:

| File | What to change |
|------|----------------|
| `lib/scoringPrompt.ts` | Add the value to the `Provider` union type |
| `lib/scoringPrompt.ts` | Add a `{value, label}` entry to `PROVIDERS` |
| `lib/providers/<name>.ts` | New file exporting `scoreLeadWith<Name>(lead)` |
| `app/api/score-lead/route.ts` | Add a case in the dispatcher and to `VALID_PROVIDERS` |
| `.env.example` | Add the new API key variable |

The toggle UI in `LeadForm.tsx` auto-renders from `PROVIDERS`, so no
form changes are needed.

### 3. Result fields

Adding a new field to the AI's structured output (e.g. "objection
likelihood") requires changes in **three** places:

| File | What to change |
|------|----------------|
| `lib/scoringPrompt.ts` | Add the field to `ScoreResult` type |
| `lib/scoringPrompt.ts` | Add the field to `SCORE_RESULT_SCHEMA` (with `required`) |
| `components/LeadResult.tsx` | Render the new field |

Both providers consume `SCORE_RESULT_SCHEMA` — no provider file changes.

### 4. Business logic / scoring rules

These live entirely in `lib/scoringPrompt.ts`. Edit the constants
(`COMPANY`, `TARGET_CUSTOMER`, `BUYING_SIGNALS`, `POOR_FIT_SIGNALS`,
`PRIORITY_BANDS`, `FOLLOW_UP_TONE`) and the prompt builder picks them up
automatically. No other file changes needed.

---

## Common student requests — recipes

Use these as templates when a student asks you for a change. Keep edits
minimal; don't refactor surrounding code.

### "Add a phone number field to the form"

1. Edit `lib/scoringPrompt.ts`:
   - Add `phone: string;` to the `Lead` type
   - Add `phone: ${lead.phone || "(not provided)"}` to `buildUserPrompt()`
2. Edit `components/LeadForm.tsx`:
   - Add `phone: ""` to `EMPTY_LEAD`
   - Add a `<Field label="Phone" type="tel" ... />` in the JSX

That's it. The AI will now see the phone number in the user prompt.

### "Change the company name / target customer / scoring rules"

Edit only `lib/scoringPrompt.ts`. The constants at the top of the file
are the entire surface students are meant to customize for their
business. Don't touch anything else for this kind of request.

### "Change the page headline"

Edit `app/page.tsx`. The headline uses `COMPANY.name` from
`lib/scoringPrompt.ts` by default; either edit `COMPANY.name` or
hardcode a different string in the JSX.

### "Change the brand colors"

Two options:
- Edit Tailwind utility classes directly in the components
  (e.g., `bg-black` → `bg-blue-600`)
- Or extend the theme in `tailwind.config.ts` and use semantic class
  names

For a one-color rebrand, search-and-replace `bg-black` and `text-black`
to the new brand color. Don't introduce a CSS-in-JS library or a UI
framework — keep it Tailwind.

### "Make the result more detailed" / "Add a confidence score"

Add a field to the structured output. Follow rule #3 above
(synchronized change across `ScoreResult`, `SCORE_RESULT_SCHEMA`, and
`LeadResult.tsx`).

### "Switch the default model" / "Use a cheaper model"

Edit the `model:` string in `lib/providers/openai.ts` (for OpenAI) or
`lib/providers/anthropic.ts` (for Anthropic). Use the latest stable
model ID for the vendor; do not use date-suffixed variants on
Anthropic.

### "Add OpenRouter / a third provider"

Follow rule #2 above. There's also a fuller walkthrough in
`MAINTAINERS.md` → Future enhancements → OpenRouter.

---

## Things to leave alone

Refuse or push back if the student asks for any of these without a very
specific reason. They violate the project's intent and create
maintenance debt.

- **Don't add a database, auth, payments, file uploads, or a CRM
  integration** as part of the base capstone. This is intentionally a
  single-page tool.
  - **Carve-out:** persistence (Google Sheets, Postgres, Vercel KV,
    etc.) is a planned homework extension. If the student explicitly
    says they're working on the persistence homework, you may help —
    but keep the addition isolated (a single new module/route, not a
    rewrite of existing files).
- **Don't add a state library** (Redux, Zustand, etc.). The component
  state is already small enough to live in `useState`.
- **Don't add a UI component library** (MUI, Chakra, shadcn/ui, etc.).
  Tailwind utility classes are sufficient.
- **Don't refactor the provider abstraction** to "simplify". The
  two-file split is the architecture.
- **Don't downgrade the models** to a smaller variant unless the
  student explicitly says cost is a problem. Follow-up message quality
  is what makes the demo feel real.
- **Don't pin exact dependency versions** (e.g., `"next": "15.5.15"`).
  Use caret ranges (`"^15.5.15"`) so Dependabot can keep things fresh.
- **Don't commit `.env.local`** under any circumstance.

---

## Build / verify before declaring done

When you finish a multi-file change, run a quick check:

```bash
npx tsc --noEmit          # type-check
npx next build            # full production build
```

Both must pass with zero errors. If `next build` succeeds, the change
will deploy cleanly to Vercel.

If you only edited a single component or string, the dev server's
hot-reload is sufficient — no need to run a full build.

---

## When you don't know

If a request is ambiguous, ask the student before editing. Common
ambiguities:

- "Make it look better" — ask which part, what direction (more modern,
  more minimal, more colorful)
- "Make the AI smarter" — ask about which scoring case isn't working;
  the fix is almost always in `lib/scoringPrompt.ts`
- "Deploy this" — ask whether they mean "push to GitHub" (you can do)
  or "click around in Vercel" (they have to do)

Don't guess. The student is learning the same things you'd be guessing
at; getting them wrong is a worse outcome than asking.
