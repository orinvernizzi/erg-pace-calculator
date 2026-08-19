import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fromAuthError } from "@/lib/http";

export async function GET() {
  try {
    const session = await requireUser();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const items = await prisma.planItem.findMany({
      where: {
        scheduledOn: { gte: start, lt: end },
        OR: [{ athleteId: session.id }, { athleteId: null, plan: { coachId: session.id } }],
      },
      include: { plan: { select: { title: true, template: true, coachId: true } } },
      orderBy: { scheduledOn: "asc" },
    });
    const forRower = items.filter(
      (item) => item.athleteId === session.id || item.plan.coachId !== session.id,
    );
    const linked = await prisma.coachAthleteLink.findMany({
      where: { athleteId: session.id, acceptedAt: { not: null } },
      select: { coachId: true },
    });
    const coachIds = new Set(linked.map((l) => l.coachId));
    const visible = forRower.length
      ? forRower
      : items.filter((item) => coachIds.has(item.plan.coachId) && !item.athleteId);
    return NextResponse.json({ items: visible.length ? visible : items.filter((i) => i.athleteId === session.id) });
  } catch (error) {
    return fromAuthError(error);
  }
}
