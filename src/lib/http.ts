import { NextResponse } from "next/server";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function fromAuthError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHENTICATED") {
    return jsonError("Sign in required.", 401);
  }
  return fromUnknownError(error);
}

export function fromUnknownError(error: unknown) {
  const text = error instanceof Error ? error.message : String(error);
  if (text.includes("Can't reach database") || text.includes("P1001")) {
    return jsonError("Database is unavailable. Check DATABASE_URL on Vercel (Neon).", 503);
  }
  console.error(error);
  return jsonError("Something went wrong.", 500);
}
