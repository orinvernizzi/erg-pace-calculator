import { NextResponse } from "next/server";
import { planDistance, planTime } from "@/lib/core";

/** Dev helper: same math the UI uses, so the old Flask /calculate is unused. */
export async function POST(request: Request) {
  const body = (await request.json()) as {
    distance?: { totalMeters: number; segmentLength: number; splits: string[] };
    time?: Array<{ workSeconds: number; restSeconds?: number; split: string }>;
  };
  if (body.distance) {
    return NextResponse.json(planDistance(body.distance));
  }
  if (body.time) {
    return NextResponse.json(planTime(body.time));
  }
  return NextResponse.json({ ok: false, error: "Provide distance or time." }, { status: 400 });
}
