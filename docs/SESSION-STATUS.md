# Session Status

## Session — 2026-07-01

### Focus
Review and accept the latest dependency update from GitHub.

### What we did

**Merged the quarterly dependency bump (PR #7).**
- PR #7 "Quarterly dependency bump (2026-07-01)" was open, not yet on `main`.
  Vercel preview check passed; diff was deps + framework-generated config only
  (no app code). Reviewed and approved.
- Version changes:
  | Package | Old | New | |
  |---|---|---|---|
  | `next` | 15.5.15 | 16.2.9 | **major** |
  | `@anthropic-ai/sdk` | 0.65.0 | 0.109.0 | minor |
  | `openai` | 6.35.0 | 6.45.0 | minor |
- Plus Next 16 auto-edits: `tsconfig.json` (`jsx: preserve → react-jsx`,
  added `.next/dev/types/**/*.ts` to include) and `next-env.d.ts` (reference
  style). Both framework-managed.
- Merged via `gh pr merge 7 --merge --delete-branch` (merge commit `ee45306`).
  Pushing/merging to `main` auto-deploys to production.
- Pulled `main` down locally. Fast-forward failed (local WIP snapshot had
  diverged from same base), so rebased the WIP commit onto the new `main` —
  clean, WIP only touches `.gitignore`/`SESSION-STATUS.md`.
- Ran `npm ci` to sync `node_modules` to the new lockfile.
- Verified `npm run build` green locally on Next 16.2.9 — all 6 routes
  resolved, 7 static pages generated.

### Open items / known issues
- **2 moderate npm audit vulns**, both transitive `postcss <8.5.10` via Next
  (XSS in CSS stringify output). `npm audit fix --force` would downgrade next
  to 9.3.3 — **do NOT run it.** Real fix floats up in a future Next 16 patch;
  low risk here. Leave for next quarterly bump.
- **Local WIP snapshot (`dcce764`) is unpushed** — origin/main does not have it.
- **Stale dep PRs still open:** #2 (typescript 6), #3 (tailwind 4),
  #6 (minor-and-patch group). #4 (next 16.2.4) is now superseded by #7 and can
  be closed.

### Files touched
- `package.json`, `package-lock.json` — new dep versions (via merge)
- `tsconfig.json`, `next-env.d.ts` — Next 16 auto-migration (via merge)

### Next steps / to revert
- Optionally push local `main` so the WIP snapshot lands on origin.
- Optionally confirm the production deploy went green and close stale dep PRs.
- **To revert the bump:** `git revert ee45306` (the merge commit) and push,
  or reset `main` to `941e3df` before the merge.

---

## Session — 2026-05-28

### Focus
Get the lead scorer running locally, then update it to reflect SIFTR's real
offering and deploy to production.

### What we did

**1. Fixed the OpenAI 401 error**
- The demo failed with `openai: 401 Incorrect API key`.
- Confirmed via the OpenAI dashboard that the key in use (ending `X2oA`) was
  no longer among the account's active keys — it had been deleted/revoked.
- Created a fresh project key in OpenAI.

**2. Set up local env**
- Created `.env.local` (gitignored, confirmed safe) from the `.env.example`
  template with `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, and `PAGE_PASSWORD`.
- User pasted the new OpenAI key. Validated it directly against the OpenAI
  API — HTTP 200, key is good.
- Started `next dev`; server loads `.env.local` correctly.

**3. Updated scoring prompt for SIFTR** (`lib/scoringPrompt.ts`)
- Replaced the placeholder "Acme Consulting" / B2B-SaaS-onboarding identity
  with SIFTR's actual positioning: "We build software. We automate everything.
  From concept to launch." (AI workflows, full-stack apps, automated pipelines).
- Realigned `TARGET_CUSTOMER`, `BUYING_SIGNALS`, and `POOR_FIT_SIGNALS` so
  leads are scored against what SIFTR really sells (custom software +
  automation) instead of the old onboarding-consultancy criteria.
- Committed (`941e3df`) and pushed to `main`.

**4. Deployed to production**
- Repo is connected to the Vercel project `ai-lead-intake-scorer`
  (team `siftrsoftrsolutions`); pushing to `main` auto-deploys.
- Production build `9e7p2whpu` went Ready in 23s.
- https://ai-lead-intake-scorer.vercel.app/ returns 200. SIFTR scoring is live.

### Open item / known issue
- **Live ChatGPT path likely still 401s.** Production has its own
  `OPENAI_API_KEY` (28 days old), separate from `.env.local`. It's almost
  certainly the same dead key. User chose to deploy code only and NOT update
  the prod key this session.
- **To fix when ready:** update the prod var with `vercel env rm OPENAI_API_KEY production`
  then `vercel env add OPENAI_API_KEY production` (paste the new key), and
  redeploy. The live Claude path works if its prod key is valid.

### Files touched
- `lib/scoringPrompt.ts` — SIFTR positioning (committed + deployed)
- `.env.local` — created locally (gitignored, not committed)
- `.vercel/` — created by `vercel link` (gitignored)

### Next steps
- Update production `OPENAI_API_KEY` to the new working key so the live
  ChatGPT toggle works.
- Optionally fill a real `ANTHROPIC_API_KEY` locally so the Claude toggle
  works in dev.
