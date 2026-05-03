"use client";

import { useState } from "react";
import { LeadForm } from "@/components/LeadForm";
import { LeadResult } from "@/components/LeadResult";
import { UnlockGate } from "@/components/UnlockGate";
import { COMPANY } from "@/lib/scoringPrompt";
import type { ScoreResponse } from "@/lib/scoringPrompt";

export default function Home() {
  const [result, setResult] = useState<ScoreResponse | null>(null);

  return (
    <main className="min-h-screen px-4 py-12 sm:py-16">
      <div className="max-w-2xl mx-auto">
        <header className="mb-10 text-center">
          {/* Customize the headline and subhead */}
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {COMPANY.name} Lead Scorer
          </h1>
          <p className="mt-3 text-gray-600">
            Paste a new lead in. Get a fit score, priority, next step, and
            ready-to-send follow up.
          </p>
        </header>

        <UnlockGate />

        {result ? (
          <LeadResult result={result} onReset={() => setResult(null)} />
        ) : (
          <div className="bg-white rounded-lg border p-6 sm:p-8 shadow-sm">
            <LeadForm onResult={setResult} />
          </div>
        )}
      </div>
    </main>
  );
}
