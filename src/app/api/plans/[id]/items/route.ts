import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fromAuthError, jsonError } from "@/lib/http";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireUser();
    const { id } = await context.params;
    const plan = await prisma.trainingPlan.findUnique({ where: { id } });
    if (!plan || plan.coachId !== session.id) return jsonError("Plan not found.", 404);
    const body = (await request.json()) as {
      athleteId?: string | null;
      scheduledOn?: string;
      title?: string;
      sport?: string;
      kind?: string;
      meters?: number;
      seconds?: number;
      intensity?: string;
      notes?: string;
    };
    if (!body.title?.trim() || !body.scheduledOn) {
      return jsonError("Title and date required.");
    }
    const item = await prisma.planItem.create({
      data: {
        planId: plan.id,
        athleteId: body.athleteId || null,
        scheduledOn: new Date(body.scheduledOn),
        title: body.title.trim(),
        sport: body.sport ?? "erg",
        kind: body.kind ?? "time",
        meters: body.meters ?? null,
        seconds: body.seconds ?? null,
        intensity: body.intensity ?? "moderate",
        notes: body.notes ?? null,
      },
    });
    return NextResponse.json({ item });
  } catch (error) {
    return fromAuthError(error);
  }
}
