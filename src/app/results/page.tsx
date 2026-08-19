"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import NumberFlow from "@number-flow/react";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { estimateRaceTimes } from "@/lib/core";
import { secondsToClock } from "@/lib/format";
import { usePlannerStore } from "@/lib/planner-store";

export default function ResultsPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const plan = usePlannerStore((s) => s.plan);
  const draft = usePlannerStore((s) => s.draft);
  const [sport, setSport] = useState("erg");
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!plan) router.replace("/");
  }, [plan, router]);

  if (!plan) return null;

  const estimates = estimateRaceTimes(plan.avgSplitSeconds, plan.totalMeters);
  const chart = plan.segments.map((s) => ({
    name: `${s.index}`,
    watts: Math.round(s.watts),
    split: s.splitLabel,
  }));

  async function save() {
    if (!draft) return;
    setSaving(true);
    const payload =
      draft.mode === "distance"
        ? { sport, source: "planned", distance: { totalMeters: draft.totalMeters, segmentLength: draft.segmentLength, splits: draft.splits } }
        : { sport, source: "planned", time: draft.pieces };
    const res = await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.status === 401) {
      toast.error("Sign in to save to your logbook.");
      router.push("/signin");
      return;
    }
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      toast.error(data.error ?? "Could not save.");
      return;
    }
    const data = (await res.json()) as { workout: { id: string } };
    toast.success("Saved to logbook.");
    setDialogOpen(false);
    router.push(`/logbook/${data.workout.id}`);
  }

  return (
    <motion.div
      className="stack"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
    >
      <div>
        <h1>Results.</h1>
        <p className="lede">
          {plan.kind === "distance" ? "Distance piece" : "Time piece"}
          {plan.totalRestSeconds > 0 ? ` · ${secondsToClock(plan.totalRestSeconds)} rest` : ""}.
        </p>
      </div>

      <div className="grid-metrics">
        <div>
          <div className="caption">Distance</div>
          <div className="hero-metric">
            <NumberFlow value={Math.round(plan.totalMeters)} suffix=" m" />
          </div>
        </div>
        <div>
          <div className="caption">Work time</div>
          <div className="hero-metric">{secondsToClock(plan.totalWorkSeconds)}</div>
        </div>
        <div>
          <div className="caption">Avg split</div>
          <div className="hero-metric">{plan.avgSplitLabel}</div>
        </div>
        <div>
          <div className="caption">Avg watts</div>
          <div className="hero-metric">
            <NumberFlow value={Math.round(plan.avgWatts)} />
          </div>
        </div>
      </div>

      <section>
        <h2>Watts by fragment</h2>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart}>
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip formatter={(value) => [`${value} W`, "Watts"]} />
              <Bar dataKey="watts" fill="#0066cc" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="group">
        <table className="data">
          <thead>
            <tr>
              <th>#</th>
              <th>Meters</th>
              <th>Time</th>
              <th>Split</th>
              <th>W</th>
            </tr>
          </thead>
          <tbody>
            {plan.segments.map((s) => (
              <tr key={s.index}>
                <td>{s.index}</td>
                <td>{Math.round(s.meters)}</td>
                <td>{secondsToClock(s.workSeconds)}</td>
                <td>{s.splitLabel}</td>
                <td>{Math.round(s.watts)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Estimates</h2>
        <p className="hint">Not an official Concept2 formula. Aerobic fade only.</p>
        <div className="group" style={{ marginTop: 12 }}>
          {estimates.map((e) => (
            <div className="row" key={e.label}>
              <span>
                {e.label}{" "}
                <span className="pill">{e.isActual ? "This piece" : "Estimate"}</span>
              </span>
              <span className="caption">
                {e.timeLabel} · {e.splitLabel}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="actions">
        <button className="btn" type="button" onClick={() => setDialogOpen(true)}>
          Save to logbook
        </button>
        <Link className="btn btn-secondary" href="/" style={{ display: "inline-flex", alignItems: "center" }}>
          Back to Plan
        </Link>
      </div>

      <Dialog.Root open={dialogOpen} onOpenChange={(open) => setDialogOpen(open)}>
        <Dialog.Portal>
          <Dialog.Backdrop className="dialog-backdrop" />
          <Dialog.Popup className="dialog-popup">
            <Dialog.Title className="dialog-title">Save to logbook</Dialog.Title>
            <div className="field">
              <label htmlFor="sport">Sport</label>
              <select id="sport" value={sport} onChange={(e) => setSport(e.target.value)}>
                <option value="erg">Erg</option>
                <option value="water">Water</option>
                <option value="bike">Bike</option>
                <option value="ski">Ski</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="row">
              <Dialog.Close className="btn-ghost btn">Cancel</Dialog.Close>
              <button className="btn" type="button" disabled={saving} onClick={() => void save()}>
                Save
              </button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </motion.div>
  );
}
