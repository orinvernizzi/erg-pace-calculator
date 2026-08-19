"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type Plan = {
  id: string;
  title: string;
  template: string;
  items: Array<{ id: string; title: string; scheduledOn: string; intensity: string }>;
};

type Athlete = { id: string; name: string };

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [title, setTitle] = useState("This week");
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [itemTitle, setItemTitle] = useState("4 x 8' / 2'");
  const [itemDate, setItemDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [intensity, setIntensity] = useState("hard");
  const [athleteId, setAthleteId] = useState("");
  const [planId, setPlanId] = useState("");

  async function load() {
    const [planRes, rosterRes] = await Promise.all([fetch("/api/plans"), fetch("/api/coach/roster")]);
    if (planRes.ok) {
      const data = (await planRes.json()) as { plans: Plan[] };
      setPlans(data.plans);
      if (!planId && data.plans[0]) setPlanId(data.plans[0].id);
    }
    if (rosterRes.ok) {
      const data = (await rosterRes.json()) as { links: Array<{ athlete: Athlete | null }> };
      setAthletes(data.links.map((l) => l.athlete).filter((a): a is Athlete => Boolean(a)));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createPlan(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const data = (await res.json()) as { plan?: Plan; suggestion?: { note: string; template: string }; error?: string };
    if (!res.ok) {
      toast.error(data.error ?? "Could not create plan.");
      return;
    }
    setSuggestion(`${data.suggestion?.template}: ${data.suggestion?.note}`);
    await load();
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!planId) {
      toast.error("Create a plan first.");
      return;
    }
    const res = await fetch(`/api/plans/${planId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: itemTitle,
        scheduledOn: itemDate,
        intensity,
        athleteId: athleteId || null,
        kind: "time",
        sport: "erg",
      }),
    });
    if (!res.ok) {
      toast.error("Could not add session.");
      return;
    }
    toast.success("On the calendar.");
    await load();
  }

  return (
    <div className="stack">
      <div>
        <h1>Plans.</h1>
        <p className="lede">Build the week in the app. Excel and PDF import come later.</p>
      </div>
      <form className="group" onSubmit={createPlan}>
        <div className="field">
          <label>New plan</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="row">
          <button className="btn" type="submit">
            Create plan
          </button>
        </div>
      </form>
      {suggestion ? <p className="hint">{suggestion}</p> : null}

      <form className="group" onSubmit={addItem}>
        <div className="field">
          <label>Plan</label>
          <select value={planId} onChange={(e) => setPlanId(e.target.value)}>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.template})
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Session</label>
          <input value={itemTitle} onChange={(e) => setItemTitle(e.target.value)} />
        </div>
        <div className="field">
          <label>Date</label>
          <input type="date" value={itemDate} onChange={(e) => setItemDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Intensity</label>
          <select value={intensity} onChange={(e) => setIntensity(e.target.value)}>
            <option value="easy">Easy / volume</option>
            <option value="moderate">Moderate</option>
            <option value="hard">Hard / intensity</option>
          </select>
        </div>
        <div className="field">
          <label>Athlete (optional)</label>
          <select value={athleteId} onChange={(e) => setAthleteId(e.target.value)}>
            <option value="">Everyone linked</option>
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div className="row">
          <button className="btn" type="submit">
            Add session
          </button>
        </div>
      </form>

      {plans.map((plan) => (
        <section className="group" key={plan.id}>
          <div className="row">
            <strong>{plan.title}</strong>
            <span className="pill">{plan.template}</span>
          </div>
          {plan.items.map((item) => (
            <div className="row" key={item.id}>
              <span>{item.title}</span>
              <span className="caption">
                {new Date(item.scheduledOn).toLocaleDateString()} · {item.intensity}
              </span>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
