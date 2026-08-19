import { NextResponse } from "next/server";
import { requireUser, refreshSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fromAuthError, jsonError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const body = (await request.json()) as { role?: string };
    if (body.role !== "coach" && body.role !== "rower") {
      return jsonError("Role must be rower or coach.");
    }
    await prisma.user.update({
      where: { id: session.id },
      data: { activeRole: body.role },
    });
    const token = await refreshSession(session.id);
    return NextResponse.json({ ok: true, role: body.role, token });
  } catch (error) {
    return fromAuthError(error);
  }
}
