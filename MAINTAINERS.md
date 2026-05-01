# Maintainer notes

This file is for the person maintaining this capstone repo (Anthony / course
operator). Students do not need to read this — they only need `README.md`.

---

## What this repo is

A Next.js 15 + Claude API capstone. Students clone it, customize the business
logic in `lib/scoringPrompt.ts`, push to their own GitHub, and deploy on Vercel.

**Stack**
- Next.js 15.1, React 19, TypeScript, Tailwind CSS
- `@anthropic-ai/sdk` (claude-opus-4-7)
- Vercel for hosting

**Structured output strategy:** the API route uses **forced tool use**
(`tool_choice: { type: "tool", name: "submit_score" }`) instead of `output_config`.
Reason: at the time the repo was scaffolded, `output_config` wasn't typed in the
SDK version we pinned. Forced tool use gives the same JSON-shape guarantee and
is supported on every SDK version. If you ever upgrade the SDK and want to
switch to `messages.parse()` with Zod, that's fine — both work.

**Prompt caching:** the system prompt is wrapped in a text block with
`cache_control: { type: "ephemeral" }` so repeat scoring calls (same student
session, same business config) hit the cache. Saves cost and latency once
students run more than one lead through.

---

## How students use it

1. `git clone https://github.com/aricciuser/ai-lead-intake-scorer.git`
2. `cd ai-lead-intake-scorer && npm install`
3. Copy `.env.example` to `.env.local` and add their Claude API key
4. `npm run dev` and test in the browser
5. Edit `lib/scoringPrompt.ts` to customize for their business
6. Push to their own GitHub repo, deploy on Vercel

The full step-by-step is in `README.md` — including Mac, Windows PowerShell,
and CMD command variants for the env-file copy step.

---

## Deploying to Vercel

This is the path you (or a student) follow to put a customized version online.

1. Sign in to [vercel.com](https://vercel.com) with GitHub.
2. **Add New → Project**, pick the GitHub repo (yours or the student's fork).
3. Vercel auto-detects Next.js. Don't change framework, root, or build command.
4. **Critical step before deploy:** expand **Environment Variables** and add:
   - **Key:** `ANTHROPIC_API_KEY`
   - **Value:** the `sk-ant-...` key from
     [console.anthropic.com](https://console.anthropic.com)
   - **Environment:** check all three (Production, Preview, Development)
5. Click **Deploy**. First build takes 1-2 minutes.
6. You get a public URL like `your-project.vercel.app`.

**Subsequent deploys are automatic.** Every `git push` to the connected branch
triggers a redeploy. No CLI, no manual step.

**If a deploy fails with "Server is missing ANTHROPIC_API_KEY":** the env var
wasn't added or wasn't applied to the right environment. Go to **Project →
Settings → Environment Variables**, add it (or fix the environments it applies
to), and redeploy from the **Deployments** tab.

**Cost note:** Vercel Hobby tier is free and works fine for student traffic.
Each lead scoring call costs a few cents on the Anthropic side — Anthropic
gives free credits on signup, but watch usage in the console.

---

## Scheduled maintenance

A remote Claude Code agent runs **quarterly** to keep dependencies fresh so
the repo doesn't rot for future student cohorts.

- **Routine name:** `ai-lead-intake-scorer: quarterly dependency check`
- **Routine ID:** `trig_016oBENATmG11cyDsSLsRJbU`
- **Schedule:** First day of January, April, July, October at 17:00 UTC
  (10am Pacific). Cron: `0 17 1 1,4,7,10 *`
- **Manage at:** https://claude.ai/code/routines/trig_016oBENATmG11cyDsSLsRJbU
- **What it does:**
  1. Clones this repo
  2. Reads `package.json`, checks npm for latest `next` and `@anthropic-ai/sdk`
  3. If both are current → exits silently, no PR
  4. If either is newer → creates a `deps/quarterly-bump-YYYY-MM-DD` branch,
     bumps the version, runs `npm install` and `npx next build` to verify,
     then opens a PR
  5. If the build fails after the bump → does NOT open a PR, exits with the
     error so it can be reviewed manually
- **What it does NOT touch:** any other dependency, the source code, the
  `main` branch directly, or the production deploy. The agent's worst-case
  output is a PR you can close without merging.

To pause it (e.g. during a course freeze), open the routine in the link above
and toggle it off. To delete, use the same URL — there is no API for delete.

---

## Updating the repo for a new cohort

When you want to refresh the repo before a new student cohort:

1. Pull the latest:
   ```bash
   git pull origin main
   ```
2. Check if any open dependency-bump PRs are waiting (from the routine above).
   Merge or close them.
3. Run a smoke test:
   ```bash
   rm -rf .next node_modules
   npm install
   npx next build
   ```
4. Optionally verify a live scoring call by adding your key to `.env.local` and
   running `npm run dev`.
5. If you changed anything, commit and push.

---

## Things to leave alone

- **Don't add a database, auth, or user accounts.** This is intentionally a
  one-page tool. The course's framing is "this is your first working tool, not
  the final one" — adding complexity here would defeat that.
- **Don't change the model from `claude-opus-4-7`** unless a course-cost issue
  forces it. Opus is the strongest, follow-up message quality is what makes
  the demo feel real to students.
- **Don't unify the env-copy step in the README** to a single command. Mac
  uses `cp`, Windows PowerShell uses `Copy-Item`, Windows CMD uses `copy`.
  Showing all three prevents the most common day-one student failure.

---

## Repo metadata

- Public GitHub repo: https://github.com/aricciuser/ai-lead-intake-scorer
- License: not currently set (consider adding MIT before broad student release
  if you want students to legally remix and republish)
- Maintainer: aricciuser
