"use client";

import { useEffect, useState } from "react";

type TodayItem = { id: string; title: string; intensity: string; plan: { title: string } };

export function TodayStrip() {
  const [items, setItems] = useState<TodayItem[] | null>(null);

  useEffect(() => {
    fetch("/api/plans/today")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data: { items: TodayItem[] }) => setItems(data.items ?? []))
      .catch(() => setItems([]));
  }, []);

  if (!items?.length) return null;

  return (
    <section className="group">
      <div className="row">
        <strong>Today</strong>
        <span className="caption">From your coach</span>
      </div>
      {items.map((item) => (
        <div className="row" key={item.id}>
          <span>{item.title}</span>
          <span className="pill">{item.intensity}</span>
        </div>
      ))}
    </section>
  );
}
