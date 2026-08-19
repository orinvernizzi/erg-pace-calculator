import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMeters, formatSource, formatSport, secondsToClock, secondsToSplit } from "@/lib/format";

function Missing({ label }: { label: string }) {
  return (
    <div>
      <div className="caption">{label}</div>
      <div className="muted">Needs PM5</div>
    </div>
  );
}

export default async function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) notFound();
  const { id } = await params;
  const workout = await prisma.workout.findUnique({
    where: { id },
    include: { splits: { orderBy: { index: "asc" } } },
  });
  if (!workout) notFound();
  if (workout.userId !== session.id) {
    const asCoach = await prisma.coachAthleteLink.findFirst({
      where: { coachId: session.id, athleteId: workout.userId, acceptedAt: { not: null } },
    });
    if (!asCoach) notFound();
  }

  const hasPm5 = workout.splits.some((s) => s.spm != null || s.hr != null);

  return (
    <div className="stack">
      <div>
        <p className="caption">
          <Link href="/logbook">Logbook</Link>
        </p>
        <h1>{formatSport(workout.sport)}</h1>
        <p className="hint">
          {workout.performedAt.toLocaleString()} · {formatSource(workout.source)}
        </p>
      </div>

      <div className="grid-metrics">
        <div>
          <div className="caption">Avg split</div>
          <div className="hero-metric">{secondsToSplit(workout.avgSplitSeconds)}</div>
        </div>
        <div>
          <div className="caption">Distance</div>
          <div className="hero-metric">{formatMeters(workout.totalMeters)}</div>
        </div>
        <div>
          <div className="caption">Time</div>
          <div className="hero-metric">{secondsToClock(workout.totalWorkSeconds)}</div>
        </div>
        <div>
          <div className="caption">Watts</div>
          <div className="hero-metric">{Math.round(workout.avgWatts)} W</div>
        </div>
        <Missing label="Stroke rate" />
        <Missing label="Heart rate" />
        <Missing label="Stroke length" />
        <Missing label="Force" />
      </div>

      {!hasPm5 ? (
        <p className="hint">SPM, HR, length and force stay empty until a PM5 session is saved from the iOS app.</p>
      ) : null}

      <section className="group">
        <table className="data">
          <thead>
            <tr>
              <th>#</th>
              <th>m</th>
              <th>Time</th>
              <th>Split</th>
              <th>SPM</th>
              <th>HR</th>
            </tr>
          </thead>
          <tbody>
            {workout.splits.map((s) => (
              <tr key={s.id}>
                <td>{s.index}</td>
                <td>{Math.round(s.meters)}</td>
                <td>{secondsToClock(s.workSeconds)}</td>
                <td>{secondsToSplit(s.splitSeconds)}</td>
                <td>{s.spm ?? "—"}</td>
                <td>{s.hr ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
