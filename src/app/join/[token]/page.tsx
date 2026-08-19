"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [code, setCode] = useState(token === "org" ? "" : token);

  async function joinCoach(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/coach/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: code }),
    });
    if (res.status === 401) {
      router.push(`/signin?next=/join/${encodeURIComponent(token)}`);
      return;
    }
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      toast.error(data.error ?? "Could not join.");
      return;
    }
    toast.success("Linked to your coach.");
    router.push("/logbook");
  }

  async function joinOrg(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/orgs/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      toast.error(data.error ?? "Could not join.");
      return;
    }
    toast.success("Joined the organization. Your log is visible to the coach.");
    router.push("/logbook");
  }

  return (
    <div className="stack">
      <div>
        <h1>Join.</h1>
        <p className="lede">Use a coach invite token or an organization code.</p>
      </div>
      <form className="group" onSubmit={joinCoach}>
        <div className="field">
          <label>Coach invite</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
        <div className="row">
          <button className="btn" type="submit">
            Link coach
          </button>
        </div>
      </form>
      <form className="group" onSubmit={joinOrg}>
        <div className="field">
          <label>Club / university / federation code</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
        <div className="row">
          <button className="btn" type="submit">
            Join organization
          </button>
        </div>
      </form>
    </div>
  );
}
