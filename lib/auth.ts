/**
 * Tiny HMAC-cookie auth for the demo's "Enter the password" gate.
 *
 * Why cookie-based: a password has to live on the SERVER side (env), but we
 * don't want students to retype it on every form submission. A signed cookie
 * lets the browser remember the unlock for 7 days without ever sending the
 * password back across the wire after the first verify.
 *
 * Secret is the PAGE_PASSWORD itself — rotating the password invalidates
 * every existing unlock cookie automatically (no separate session secret to
 * manage).
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const COOKIE_NAME = "ailis_unlock";
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function getPagePassword(): string {
  return process.env.PAGE_PASSWORD || "";
}

export function isPasswordConfigured(): boolean {
  return getPagePassword().length > 0;
}

function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

export function passwordMatches(submitted: string): boolean {
  const real = getPagePassword();
  if (!real || !submitted) return false;
  return constantTimeEqual(submitted, real);
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function buildCookieValue(): string {
  const secret = getPagePassword();
  if (!secret) throw new Error("PAGE_PASSWORD not set");
  const expiresAt = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const payload = `unlock|${expiresAt}`;
  const signature = sign(payload, secret);
  return Buffer.from(`${payload}|${signature}`).toString("base64url");
}

export function verifyCookieValue(raw: string | undefined | null): boolean {
  if (!raw) return false;
  const secret = getPagePassword();
  if (!secret) return false;
  try {
    const decoded = Buffer.from(raw, "base64url").toString("utf8");
    const parts = decoded.split("|");
    if (parts.length !== 3) return false;
    const [kind, expiresStr, signature] = parts;
    if (kind !== "unlock") return false;
    const expected = sign(`${kind}|${expiresStr}`, secret);
    if (!constantTimeEqual(signature, expected)) return false;
    const expiresAt = Number(expiresStr);
    if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function isUnlocked(): Promise<boolean> {
  const jar = await cookies();
  const c = jar.get(COOKIE_NAME);
  return verifyCookieValue(c?.value);
}

export function cookieSetOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: TTL_SECONDS,
  };
}
