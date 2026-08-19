import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fromAuthError } from "@/lib/http";

export async function GET() {
  try {
    const session = await requireUser();
    const links = await prisma.coachAthleteLink.findMany({
      where: { coachId: session.id },
      include: {
        athlete: {
          select: {
            id: true,
            name: true,
            email: true,
            workouts: {
              orderBy: { performedAt: "desc" },
              take: 8,
              select: {
                id: true,
                sport: true,
                performedAt: true,
                totalMeters: true,
                totalWorkSeconds: true,
                avgSplitSeconds: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ links });
  } catch (error) {
    return fromAuthError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const body = (await request.json().catch(() => ({}))) as { label?: string };
    const token = randomBytes(8).toString("hex");
    const link = await prisma.coachAthleteLink.create({
      data: {
        coachId: session.id,
        token,
        label: body.label?.trim() || "Invite",
      },
    });
    await prisma.user.update({
      where: { id: session.id },
      data: { activeRole: "coach" },
    });
    return NextResponse.json({ link });
  } catch (error) {
    return fromAuthError(error);
  }
}
