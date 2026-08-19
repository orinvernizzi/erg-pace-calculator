import { NextResponse } from "next/server";
import { getSession, publicUser, requireUser } from "@/lib/auth";
import { fromAuthError } from "@/lib/http";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user: publicUser(session) });
}

export async function POST() {
  try {
    const session = await requireUser();
    return NextResponse.json({ user: publicUser(session) });
  } catch (error) {
    return fromAuthError(error);
  }
}
