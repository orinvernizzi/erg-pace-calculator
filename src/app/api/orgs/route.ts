import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fromAuthError, jsonError } from "@/lib/http";

const KINDS = new Set(["club", "university", "federation"]);

export async function GET() {
  try {
    const session = await requireUser();
    const memberships = await prisma.membership.findMany({
      where: { userId: session.id },
      include: { organization: true },
    });
    const owned = await prisma.organization.findMany({ where: { ownerId: session.id } });
    return NextResponse.json({ memberships, owned });
  } catch (error) {
    return fromAuthError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const body = (await request.json()) as { name?: string; kind?: string };
    const name = body.name?.trim();
    const kind = body.kind ?? "club";
    if (!name) return jsonError("Organization name required.");
    if (!KINDS.has(kind)) return jsonError("Kind must be club, university, or federation.");
    const org = await prisma.organization.create({
      data: {
        name,
        kind,
        inviteCode: randomBytes(4).toString("hex"),
        ownerId: session.id,
        memberships: { create: { userId: session.id, role: "coach" } },
      },
    });
    return NextResponse.json({ organization: org });
  } catch (error) {
    return fromAuthError(error);
  }
}
