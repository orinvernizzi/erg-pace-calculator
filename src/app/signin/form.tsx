"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";

export function SignInForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const path = mode === "in" ? "/api/auth/login" : "/api/auth/register";
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    const raw = await res.text();
    let data: { error?: string } = {};
    try {
      data = raw ? (JSON.parse(raw) as { error?: string }) : {};
    } catch {
      toast.error("Could not sign in.");
      return;
    }
    if (!res.ok) {
      toast.error(data.error ?? "Could not sign in.");
      return;
    }
    const next = search.get("next");
    router.push(next && next.startsWith("/") ? next : "/");
    router.refresh();
  }

  return (
    <form className="stack" onSubmit={submit}>
      <div>
        <h1>{mode === "in" ? "Sign in." : "Create account."}</h1>
        <p className="lede">Plan first. The logbook stays with this account on web and iPhone.</p>
      </div>
      <section className="group">
        {mode === "up" ? (
          <div className="field">
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </div>
        ) : null}
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            required
          />
        </div>
      </section>
      <motion.button className="btn" type="submit" whileTap={{ scale: 0.97 }} transition={{ duration: 0.14 }}>
        Continue
      </motion.button>
      <button className="btn-ghost btn" type="button" onClick={() => setMode(mode === "in" ? "up" : "in")}>
        {mode === "in" ? "Create an account" : "I already have an account"}
      </button>
    </form>
  );
}
