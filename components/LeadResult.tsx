"use client";

import { useState } from "react";
import type { ScoreResult } from "@/lib/scoringPrompt";

const PRIORITY_STYLES: Record<ScoreResult["priority"], string> = {
  HOT: "bg-red-100 text-red-800 border-red-200",
  WARM: "bg-orange-100 text-orange-800 border-orange-200",
  NURTURE: "bg-yellow-100 text-yellow-800 border-yellow-200",
  PASS: "bg-gray-100 text-gray-700 border-gray-200",
};

type Props = {
  result: ScoreResult;
  onReset: () => void;
};

export function LeadResult({ result, onReset }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyMessage() {
    await navigator.clipboard.writeText(result.followUpMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 p-6 rounded-lg border bg-white">
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide">
            Fit score
          </p>
          <p className="text-5xl font-bold">{result.fitScore}</p>
        </div>
        <span
          className={`px-4 py-2 rounded-full border text-sm font-semibold ${PRIORITY_STYLES[result.priority]}`}
        >
          {result.priority}
        </span>
      </div>

      <Section title="Summary">
        <p className="text-gray-800 leading-relaxed">{result.summary}</p>
      </Section>

      <Section title="Recommended next step">
        <p className="text-gray-800 leading-relaxed">{result.nextStep}</p>
      </Section>

      <Section title="Draft follow up message">
        <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed bg-gray-50 border border-gray-200 rounded p-4">
          {result.followUpMessage}
        </pre>
        <button
          onClick={copyMessage}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {copied ? "Copied!" : "Copy to clipboard"}
        </button>
      </Section>

      <button
        onClick={onReset}
        className="w-full bg-white border border-gray-300 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-50 transition"
      >
        Score another lead
      </button>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-6 rounded-lg border bg-white">
      <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-2">
        {title}
      </h2>
      {children}
    </div>
  );
}
