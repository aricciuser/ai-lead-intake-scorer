"use client";

import { useState } from "react";
import { PROVIDERS, type Lead, type Provider, type ScoreResponse } from "@/lib/scoringPrompt";

// ════════════════════════════════════════════════════════════════
//  CUSTOMIZE THIS FORM
// ════════════════════════════════════════════════════════════════
//  Add or remove fields to match what your intake form needs.
//  If you change field names here, also update the Lead type in
//  lib/scoringPrompt.ts and the buildUserPrompt() function there.
// ════════════════════════════════════════════════════════════════

const EMPTY_LEAD: Lead = {
  fullName: "",
  email: "",
  company: "",
  role: "",
  companySize: "",
  problem: "",
  budget: "",
  timeline: "",
  notes: "",
};

type Props = {
  onResult: (result: ScoreResponse) => void;
};

export function LeadForm({ onResult }: Props) {
  const [lead, setLead] = useState<Lead>(EMPTY_LEAD);
  const [provider, setProvider] = useState<Provider>("openai");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof Lead>(key: K, value: Lead[K]) {
    setLead((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/score-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...lead, provider }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }
      onResult(data as ScoreResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <span className="block text-sm font-medium text-gray-700 mb-2">
          Score with
        </span>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          {PROVIDERS.map((p) => {
            const selected = provider === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setProvider(p.value)}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                  selected
                    ? "bg-white shadow text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field
          label="Full name"
          required
          value={lead.fullName}
          onChange={(v) => update("fullName", v)}
        />
        <Field
          label="Email"
          type="email"
          required
          value={lead.email}
          onChange={(v) => update("email", v)}
        />
        <Field
          label="Company"
          required
          value={lead.company}
          onChange={(v) => update("company", v)}
        />
        <Field
          label="Role / title"
          required
          value={lead.role}
          onChange={(v) => update("role", v)}
        />
        <Field
          label="Company size"
          required
          placeholder="e.g. 25 employees"
          value={lead.companySize}
          onChange={(v) => update("companySize", v)}
        />
        <Field
          label="Timeline"
          placeholder="e.g. ASAP, next quarter"
          value={lead.timeline}
          onChange={(v) => update("timeline", v)}
        />
        <Field
          label="Budget"
          placeholder="e.g. $5k-$10k"
          value={lead.budget}
          onChange={(v) => update("budget", v)}
        />
      </div>

      <TextArea
        label="What problem are they trying to solve?"
        required
        value={lead.problem}
        onChange={(v) => update("problem", v)}
      />

      <TextArea
        label="Notes about the customer (optional)"
        placeholder="Anything else worth telling the AI: how they found you, what they tried before, who else is involved, red flags, gut feel..."
        value={lead.notes}
        onChange={(v) => update("notes", v)}
      />

      {error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white font-medium py-3 rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {/* Customize this button text */}
        {loading ? "Scoring..." : "Score this lead"}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
      />
    </label>
  );
}
