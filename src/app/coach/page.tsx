"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { formatMeters, secondsToSplit } from "@/lib/format";

type LinkRow = {
  id: string;
  token: string;
  label: string | null;
  acceptedAt: string | null;
  athlete: null | {
    id: string;
    name: string;
    email: string;
    workouts: Array<{
      id: string;
      sport: string;
      performedAt: string;
      totalMeters: number;
      avgSplitSeconds: number;
    }>;
  };
};

export default function CoachPage() {
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [orgs, setOrgs] = useState<Array<{ id: string; name: string; inviteCode: string; kind: string }>>([]);
  const [orgName, setOrgName] = useState("");
  const [orgKind, setOrgKind] = useState("club");

  async function load() {
    const [roster, org] = await Promise.all([fetch("/api/coach/roster"), fetch("/api/orgs")]);
    if (roster.ok) {
      const data = (await roster.json()) as { links: LinkRow[] };
      setLinks(data.links);
    }
    if (org.ok) {
      const data = (await org.json()) as { owned: Array<{ id: string; name: string; inviteCode: string; kind: string }> };
      setOrgs(data.owned);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function invite() {
    const res = await fetch("/api/coach/roster", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    if (!res.ok) {
      toast.error("Could not create invite.");
      return;
    }
    toast.success("Invite created.");
    await load();
  }

  async function createOrg(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/orgs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: orgName, kind: orgKind }),
    });
    if (!res.ok) {
      toast.error("Could not create organization.");
      return;
    }
    setOrgName("");
    await load();
  }

  return (
    <div className="stack">
      <div>
        <h1>Roster.</h1>
        <p className="lede">Athletes keep their own log. Linking shows it here. No copies.</p>
      </div>
      <button className="btn" type="button" onClick={invite}>
        New invite link
      </button>
      <section className="group">
        {links.length === 0 ? (
          <p className="empty">No athletes yet.</p>
        ) : (
          links.map((link) => (
            <div key={link.id} className="row" style={{ alignItems: "flex-start" }}>
              <div>
                <div>{link.athlete?.name ?? link.label ?? "Pending"}</div>
                <div className="caption">
                  {link.athlete ? link.athlete.email : `Join at /join/${link.token}`}
                </div>
                {link.athlete?.workouts.map((w) => (
                  <div className="caption" key={w.id}>
                    {new Date(w.performedAt).toLocaleDateString()} · {secondsToSplit(w.avgSplitSeconds)} · {formatMeters(w.totalMeters)}
                  </div>
                ))}
              </div>
              {link.athlete?.workouts[0] ? (
                <Link href={`/logbook/${link.athlete.workouts[0].id}`}>Latest</Link>
              ) : link.athlete ? (
                <span className="pill">No pieces yet</span>
              ) : (
                <span className="pill">Open</span>
              )}
            </div>
          ))
        )}
      </section>

      <h2>Club / university / federation</h2>
      <form className="group" onSubmit={createOrg}>
        <div className="field">
          <label>Name</label>
          <input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
        </div>
        <div className="field">
          <label>Kind</label>
          <select value={orgKind} onChange={(e) => setOrgKind(e.target.value)}>
            <option value="club">Club</option>
            <option value="university">University</option>
            <option value="federation">Federation</option>
          </select>
        </div>
        <div className="row">
          <button className="btn" type="submit">
            Create
          </button>
        </div>
      </form>
      <section className="group">
        {orgs.map((org) => (
          <div className="row" key={org.id}>
            <span>{org.name}</span>
            <span className="caption">{org.kind} · code {org.inviteCode}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
