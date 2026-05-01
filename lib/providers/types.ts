import type { Lead, ScoreResult } from "@/lib/scoringPrompt";

// Common shape every provider implementation must satisfy. Keeps the API
// route provider-agnostic.
export type ScoreLeadFn = (lead: Lead) => Promise<ScoreResult>;
