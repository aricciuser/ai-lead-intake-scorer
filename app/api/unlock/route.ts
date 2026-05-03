import { NextResponse } from "next/server";
import { COOKIE_NAME, buildCookieValue, cookieSetOptions, isPasswordConfigured, passwordMatches } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * POST /api/unlock — verify password, set unlock cookie if it matches.
 *
 * Body: { password: string }
 *
 * 200 → { ok: true } + Set-Cookie  (good for 7 days)
 * 401 → { ok: false, error: "Incorrect password." }
 * 500 → { ok: false, error: "Demo not configured." } (env missing)
 */
export async function POST(request: Request) {
  if (!isPasswordConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Demo not configured." },
      { status: 500 },
    );
  }

  let body: { password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const submitted = typeof body?.password === "string" ? body.password : "";

  if (!passwordMatches(submitted)) {
    // Slow down brute-force a bit
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json(
      { ok: false, error: "Incorrect password." },
      { status: 401 },
    );
  }

  const value = buildCookieValue();
  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.cookies.set(COOKIE_NAME, value, cookieSetOptions());
  return res;
}
