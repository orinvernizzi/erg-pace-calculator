import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fromAuthError, jsonError } from "@/lib/http";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireUser();
    const { id } = await context.params;
    const workout = await prisma.workout.findUnique({
      where: { id },
      include: { splits: { orderBy: { index: "asc" } }, insights: true },
    });
    if (!workout) return jsonError("Workout not found.", 404);
    if (workout.userId !== session.id) {
      const asCoach = await prisma.coachAthleteLink.findFirst({
        where: { coachId: session.id, athleteId: workout.userId, acceptedAt: { not: null } },
      });
      if (!asCoach) return jsonError("Workout not found.", 404);
    }
    return NextResponse.json({ workout });
  } catch (error) {
    return fromAuthError(error);
  }
}
