# Session Status

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
