import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fromAuthError, jsonError } from "@/lib/http";
import { planDistance, planTime, type TimePiece } from "@/lib/core";

const SPORTS = new Set(["erg", "water", "bike", "ski", "other"]);
const SOURCES = new Set(["planned", "manual", "pm5"]);

type SplitIn = {
  index: number;
  meters: number;
  workSeconds: number;
  restSeconds?: number;
  splitSeconds: number;
  watts: number;
  spm?: number | null;
  hr?: number | null;
  lengthMeters?: number | null;
  forceNewtons?: number | null;
};

export async function GET() {
  try {
    const session = await requireUser();
    const workouts = await prisma.workout.findMany({
      where: { userId: session.id },
      orderBy: { performedAt: "desc" },
      include: { splits: { orderBy: { index: "asc" } } },
    });
    return NextResponse.json({ workouts });
  } catch (error) {
    return fromAuthError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const body = (await request.json()) as {
      sport?: string;
      source?: string;
      performedAt?: string;
      notes?: string;
      planItemId?: string | null;
      distance?: { totalMeters: number; segmentLength: number; splits: string[] };
      time?: TimePiece[];
      manual?: {
        kind: "distance" | "time";
        totalMeters: number;
        totalWorkSeconds: number;
        totalRestSeconds?: number;
        avgSplitSeconds: number;
        avgWatts: number;
        splits?: SplitIn[];
        dragFactor?: number | null;
      };
    };

    const sport = body.sport ?? "erg";
    const source = body.source ?? "planned";
    if (!SPORTS.has(sport)) return jsonError("Unknown sport.");
    if (!SOURCES.has(source)) return jsonError("Unknown source.");

    let kind: "distance" | "time";
    let totalMeters: number;
    let totalWorkSeconds: number;
    let totalRestSeconds = 0;
    let avgSplitSeconds: number;
    let avgWatts: number;
    let splits: SplitIn[] = [];
    let dragFactor: number | null = null;

    if (body.distance) {
      const plan = planDistance(body.distance);
      if (!plan.ok) return jsonError(plan.error);
      kind = plan.kind;
      totalMeters = plan.totalMeters;
      totalWorkSeconds = plan.totalWorkSeconds;
      totalRestSeconds = plan.totalRestSeconds;
      avgSplitSeconds = plan.avgSplitSeconds;
      avgWatts = plan.avgWatts;
      splits = plan.segments.map((s) => ({
        index: s.index,
        meters: s.meters,
        workSeconds: s.workSeconds,
        restSeconds: s.restSeconds,
        splitSeconds: s.splitSeconds,
        watts: s.watts,
      }));
    } else if (body.time) {
      const plan = planTime(body.time);
      if (!plan.ok) return jsonError(plan.error);
      kind = plan.kind;
      totalMeters = plan.totalMeters;
      totalWorkSeconds = plan.totalWorkSeconds;
      totalRestSeconds = plan.totalRestSeconds;
      avgSplitSeconds = plan.avgSplitSeconds;
      avgWatts = plan.avgWatts;
      splits = plan.segments.map((s) => ({
        index: s.index,
        meters: s.meters,
        workSeconds: s.workSeconds,
        restSeconds: s.restSeconds,
        splitSeconds: s.splitSeconds,
        watts: s.watts,
      }));
    } else if (body.manual) {
      kind = body.manual.kind;
      totalMeters = body.manual.totalMeters;
      totalWorkSeconds = body.manual.totalWorkSeconds;
      totalRestSeconds = body.manual.totalRestSeconds ?? 0;
      avgSplitSeconds = body.manual.avgSplitSeconds;
      avgWatts = body.manual.avgWatts;
      splits = body.manual.splits ?? [];
      dragFactor = body.manual.dragFactor ?? null;
    } else {
      return jsonError("Provide a distance plan, time plan, or manual entry.");
    }

    const workout = await prisma.workout.create({
      data: {
        userId: session.id,
        sport,
        source,
        performedAt: body.performedAt ? new Date(body.performedAt) : new Date(),
        kind,
        totalMeters,
        totalWorkSeconds,
        totalRestSeconds,
        avgSplitSeconds,
        avgWatts,
        notes: body.notes,
        dragFactor,
        planItemId: body.planItemId ?? null,
        splits: {
          create: splits.map((s) => ({
            index: s.index,
            meters: s.meters,
            workSeconds: s.workSeconds,
            restSeconds: s.restSeconds ?? 0,
            splitSeconds: s.splitSeconds,
            watts: s.watts,
            spm: s.spm ?? null,
            hr: s.hr ?? null,
            lengthMeters: s.lengthMeters ?? null,
            forceNewtons: s.forceNewtons ?? null,
          })),
        },
      },
      include: { splits: { orderBy: { index: "asc" } } },
    });

    return NextResponse.json({ workout });
  } catch (error) {
    return fromAuthError(error);
  }
}
