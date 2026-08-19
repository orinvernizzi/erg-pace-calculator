import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fromAuthError, jsonError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const body = (await request.json()) as { token?: string };
    const token = body.token?.trim();
    if (!token) return jsonError("Invite token required.");
    const link = await prisma.coachAthleteLink.findUnique({ where: { token } });
    if (!link) return jsonError("Invite not found.", 404);
    if (link.coachId === session.id) return jsonError("You cannot join your own invite.");
    if (link.athleteId && link.athleteId !== session.id) {
      return jsonError("This invite is already used.");
    }
    const already = await prisma.coachAthleteLink.findFirst({
      where: { coachId: link.coachId, athleteId: session.id },
    });
    if (already) {
      return NextResponse.json({ link: already });
    }
    const updated = await prisma.coachAthleteLink.update({
      where: { id: link.id },
      data: { athleteId: session.id, acceptedAt: new Date() },
    });
    return NextResponse.json({ link: updated });
  } catch (error) {
    return fromAuthError(error);
  }
}
