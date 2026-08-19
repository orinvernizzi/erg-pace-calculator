import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fromAuthError, jsonError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const body = (await request.json()) as { code?: string };
    const code = body.code?.trim().toLowerCase();
    if (!code) return jsonError("Invite code required.");
    const org = await prisma.organization.findUnique({ where: { inviteCode: code } });
    if (!org) return jsonError("Organization not found.", 404);
    await prisma.membership.upsert({
      where: { organizationId_userId: { organizationId: org.id, userId: session.id } },
      update: {},
      create: { organizationId: org.id, userId: session.id, role: "athlete" },
    });
    const ownerCoach = await prisma.coachAthleteLink.findFirst({
      where: { coachId: org.ownerId, athleteId: session.id },
    });
    if (!ownerCoach && org.ownerId !== session.id) {
      await prisma.coachAthleteLink.create({
        data: {
          coachId: org.ownerId,
          athleteId: session.id,
          token: `org-${org.id}-${session.id}`,
          label: org.name,
          acceptedAt: new Date(),
        },
      });
    }
    return NextResponse.json({ organization: org });
  } catch (error) {
    return fromAuthError(error);
  }
}
