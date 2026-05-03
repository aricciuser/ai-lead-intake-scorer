/**
 * Cheap in-memory rate limit + daily cap. Resets across cold starts (each
 * Vercel function instance has its own memory) — that's an acceptable
 * downside for a low-traffic demo. Worst case a determined attacker on
 * one IP gets a few extra calls when a cold function spins up; the daily
 * cap is a hard ceiling regardless.
 */

const PER_IP_WINDOW_MS = 15 * 60 * 1000; // 15 min
const PER_IP_MAX = parseInt(process.env.RATE_LIMIT_PER_IP || "10", 10) || 10;
const DAILY_CAP = parseInt(process.env.DAILY_CALL_CAP || "100", 10) || 100;

const ipWindow = new Map<string, number[]>();
let dailyState: { date: string; calls: number } = { date: dayKey(), calls: 0 };

function dayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10); // YYYY-MM-DD UTC
}

export interface CheckResult {
  ok: boolean;
  status?: number;
  reason?: string;
  retryAfterSec?: number;
}

export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

export function checkRateLimit(ip: string): CheckResult {
  const now = Date.now();
  const cutoff = now - PER_IP_WINDOW_MS;
  const arr = (ipWindow.get(ip) ?? []).filter((t) => t > cutoff);

  if (arr.length >= PER_IP_MAX) {
    const oldest = arr[0];
    const retryAfterSec = Math.max(1, Math.ceil((oldest + PER_IP_WINDOW_MS - now) / 1000));
    return {
      ok: false,
      status: 429,
      reason: `Rate limit: max ${PER_IP_MAX} requests per 15 min from your IP. Try again in ~${retryAfterSec}s.`,
      retryAfterSec,
    };
  }

  arr.push(now);
  ipWindow.set(ip, arr);

  // Opportunistic cleanup of old entries to keep the map small
  if (ipWindow.size > 500) {
    for (const [k, v] of ipWindow) {
      const fresh = v.filter((t) => t > cutoff);
      if (fresh.length === 0) ipWindow.delete(k);
      else ipWindow.set(k, fresh);
    }
  }

  return { ok: true };
}

export function checkDailyCap(): CheckResult {
  const today = dayKey();
  if (dailyState.date !== today) {
    dailyState = { date: today, calls: 0 };
  }
  if (dailyState.calls >= DAILY_CAP) {
    return {
      ok: false,
      status: 503,
      reason: `Demo at capacity for today (${DAILY_CAP} runs). Comes back tomorrow at 00:00 UTC.`,
    };
  }
  dailyState.calls += 1;
  return { ok: true };
}

export function dailyStats(): { date: string; calls: number; cap: number } {
  return { date: dailyState.date, calls: dailyState.calls, cap: DAILY_CAP };
}
