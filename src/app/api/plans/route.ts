import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fromAuthError, jsonError } from "@/lib/http";
import { suggestWeekTemplate } from "@/lib/core/volume";

export async function GET() {
  try {
    const session = await requireUser();
    const plans = await prisma.trainingPlan.findMany({
      where: session.activeRole === "coach" ? { coachId: session.id } : { items: { some: { athleteId: session.id } } },
      include: { items: { orderBy: { scheduledOn: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ plans });
  } catch (error) {
    return fromAuthError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const body = (await request.json()) as { title?: string; template?: string };
    const title = body.title?.trim();
    if (!title) return jsonError("Plan title required.");
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const items = await prisma.planItem.findMany({
      where: {
        plan: { coachId: session.id },
        scheduledOn: { gte: weekStart, lt: weekEnd },
      },
    });
    const weeklyMeters = items.reduce((sum, item) => sum + (item.meters ?? 0), 0);
    const hardPieces = items.filter((item) => item.intensity === "hard").length;
    const suggestion = suggestWeekTemplate(weeklyMeters, hardPieces);
    const plan = await prisma.trainingPlan.create({
      data: {
        coachId: session.id,
        title,
        template: body.template === "high-intensity" ? "high-intensity" : suggestion.template,
      },
    });
    return NextResponse.json({ plan, suggestion });
  } catch (error) {
    return fromAuthError(error);
  }
}
