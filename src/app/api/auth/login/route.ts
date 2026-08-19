import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession, publicUser } from "@/lib/auth";
import { asRole, type SessionUser } from "@/lib/auth-token";
import { jsonError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";
    if (!email || !password) return jsonError("Email and password required.");
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return jsonError("Invalid email or password.", 401);
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return jsonError("Invalid email or password.", 401);
    const session: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      activeRole: asRole(user.activeRole),
    };
    const token = await createSession(session);
    return NextResponse.json({ ok: true, token, user: publicUser(session) });
  } catch (error) {
    return fromUnknownError(error);
  }
}
