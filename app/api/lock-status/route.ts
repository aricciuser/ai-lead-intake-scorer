import { NextResponse } from "next/server";
import { isUnlocked, isPasswordConfigured } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * GET /api/lock-status — does the visitor's cookie unlock the demo?
 *
 * Returns { unlocked, configured }. The page uses this on mount to decide
 * whether to show the password prompt or the form.
 */
export async function GET() {
  return NextResponse.json({
    unlocked: await isUnlocked(),
    configured: isPasswordConfigured(),
  });
}
