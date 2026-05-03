"use client";

import { useEffect, useState } from "react";

/**
 * Demo gate — page renders for everyone, but actually running the scorer
 * requires entering the page password. The password verifies server-side
 * and a 7-day cookie is set on success. While locked, the form below this
 * gate still renders normally; submits will get a 401 from /api/score-lead
 * until the visitor unlocks here.
 */
export function UnlockGate({ onUnlock }: { onUnlock?: () => void }) {
  const [status, setStatus] = useState<"checking" | "locked" | "unlocked" | "no-password">("checking");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/lock-status")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (!data?.configured) {
          setStatus("no-password");
        } else if (data?.unlocked) {
          setStatus("unlocked");
        } else {
          setStatus("locked");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("locked");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "checking" || status === "unlocked" || status === "no-password") {
    return null;
  }

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setStatus("unlocked");
        setPassword("");
        if (onUnlock) onUnlock();
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data?.error || "Could not unlock.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">
      <div className="flex items-start gap-3">
        <span className="text-lg">🔒</span>
        <div className="flex-1">
          <div className="font-semibold text-amber-900">Demo locked</div>
          <p className="text-amber-800/80 mt-1">
            You can fill out the form to see how it works, but actually running the lead scorer
            requires the page password. (This is to keep token costs in check.)
          </p>
          <form onSubmit={handleUnlock} className="mt-3 flex flex-col sm:flex-row gap-2">
            <input
              type="password"
              autoComplete="off"
              placeholder="Enter the page password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              className="flex-1 rounded border border-amber-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              type="submit"
              disabled={!password.trim() || submitting}
              className="rounded bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Checking..." : "Unlock"}
            </button>
          </form>
          {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
        </div>
      </div>
    </div>
  );
}
