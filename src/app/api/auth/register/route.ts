import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession, publicUser } from "@/lib/auth";
import { fromUnknownError, jsonError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string; name?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";
    const name = body.name?.trim() || "Rower";
    if (!email || !email.includes("@") || password.length < 6) {
      return jsonError("Use a valid email and a password of at least 6 characters.");
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return jsonError("That email is already registered.");
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: await bcrypt.hash(password, 10),
        profile: { create: {} },
      },
    });
    const session = {
      id: user.id,
      email: user.email,
      name: user.name,
      activeRole: "rower" as const,
    };
    const token = await createSession(session);
    return NextResponse.json({ ok: true, token, user: publicUser(session) });
  } catch (error) {
    return fromUnknownError(error);
  }
}
