import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMeters, formatSport, secondsToClock, secondsToSplit } from "@/lib/format";
import { TodayStrip } from "@/components/today-strip";

export const dynamic = "force-dynamic";

export default async function LogbookPage() {
  const session = await getSession();
  if (!session) redirect("/signin?next=/logbook");

  const workouts = await prisma.workout.findMany({
    where: { userId: session.id },
    orderBy: { performedAt: "desc" },
  });

  return (
    <div className="stack">
      <div>
        <h1>Logbook.</h1>
        <p className="lede">{workouts.length} session{workouts.length === 1 ? "" : "s"}</p>
      </div>
      <TodayStrip />
      <section className="group">
        {workouts.length === 0 ? (
          <p className="empty">Nothing logged yet. Plan a piece or add one manually.</p>
        ) : (
          workouts.map((w) => (
            <Link className="row" key={w.id} href={`/logbook/${w.id}`}>
              <div>
                <div>{formatSport(w.sport)}</div>
                <div className="caption">
                  {w.performedAt.toLocaleDateString()} · {w.source === "pm5" ? "PM5" : w.source}
                </div>
              </div>
              <div className="metric">
                {secondsToSplit(w.avgSplitSeconds)} · {formatMeters(w.totalMeters)}
                <div className="caption">{secondsToClock(w.totalWorkSeconds)}</div>
              </div>
            </Link>
          ))
        )}
      </section>
      <Link className="btn" href="/log" style={{ display: "inline-flex", justifyContent: "center" }}>
        Log manually
      </Link>
    </div>
  );
}
