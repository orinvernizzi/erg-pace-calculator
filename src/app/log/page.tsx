"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { parseSplit, wattsFromPace, distanceFromTime, timeFromDistance } from "@/lib/core";

export default function LogManuallyPage() {
  const router = useRouter();
  const [sport, setSport] = useState("erg");
  const [kind, setKind] = useState<"distance" | "time">("time");
  const [meters, setMeters] = useState("10000");
  const [minutes, setMinutes] = useState("40");
  const [split, setSplit] = useState("2:00.0");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const splitSeconds = parseSplit(split);
    if (splitSeconds === null) {
      toast.error("Split must look like 1:45 or 1:45.0");
      return;
    }
    const workSeconds = kind === "time" ? Number(minutes) * 60 : timeFromDistance(Number(meters), splitSeconds);
    const totalMeters = kind === "distance" ? Number(meters) : distanceFromTime(workSeconds, splitSeconds);
    const res = await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sport,
        source: "manual",
        performedAt: new Date(date).toISOString(),
        notes,
        manual: {
          kind,
          totalMeters,
          totalWorkSeconds: workSeconds,
          avgSplitSeconds: splitSeconds,
          avgWatts: wattsFromPace(splitSeconds),
          splits: [
            {
              index: 1,
              meters: totalMeters,
              workSeconds,
              splitSeconds,
              watts: wattsFromPace(splitSeconds),
            },
          ],
        },
      }),
    });
    if (res.status === 401) {
      router.push("/signin");
      return;
    }
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      toast.error(data.error ?? "Could not save.");
      return;
    }
    const data = (await res.json()) as { workout: { id: string } };
    toast.success("Logged.");
    router.push(`/logbook/${data.workout.id}`);
  }

  return (
    <form className="stack" onSubmit={submit}>
      <div>
        <h1>Log.</h1>
        <p className="lede">When you already did the work.</p>
      </div>
      <section className="group">
        <div className="field">
          <label>Sport</label>
          <select value={sport} onChange={(e) => setSport(e.target.value)}>
            <option value="erg">Erg</option>
            <option value="water">Water</option>
            <option value="bike">Bike</option>
            <option value="ski">Ski</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="field">
          <label>Entry</label>
          <select value={kind} onChange={(e) => setKind(e.target.value as "distance" | "time")}>
            <option value="time">By time</option>
            <option value="distance">By distance</option>
          </select>
        </div>
        {kind === "time" ? (
          <div className="field">
            <label>Minutes</label>
            <input inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
          </div>
        ) : (
          <div className="field">
            <label>Meters</label>
            <input inputMode="numeric" value={meters} onChange={(e) => setMeters(e.target.value)} />
          </div>
        )}
        <div className="field">
          <label>Avg split /500m</label>
          <input value={split} onChange={(e) => setSplit(e.target.value)} />
        </div>
        <div className="field">
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>
      </section>
      <button className="btn" type="submit">
        Save to logbook
      </button>
    </form>
  );
}
