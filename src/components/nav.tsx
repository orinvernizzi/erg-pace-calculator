"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import type { SessionUser } from "@/lib/auth-token";

const rowerLinks = [
  { href: "/", label: "Plan" },
  { href: "/logbook", label: "Logbook" },
  { href: "/log", label: "Log" },
];

const coachLinks = [
  { href: "/", label: "Plan" },
  { href: "/coach", label: "Roster" },
  { href: "/plans", label: "Plans" },
  { href: "/logbook", label: "Logbook" },
];

export function Nav({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const links = !user ? [] : user.activeRole === "coach" ? coachLinks : rowerLinks;

  async function switchRole(role: "rower" | "coach") {
    const res = await fetch("/api/auth/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      toast.error("Could not switch role");
      return;
    }
    router.push(role === "coach" ? "/coach" : "/");
    router.refresh();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/signin");
    router.refresh();
  }

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link className="brand" href={user ? "/" : "/signin"}>
          ErgCalc
        </Link>
        {links.map((link) => (
          <Link key={link.href} href={link.href} data-active={pathname === link.href}>
            {link.label}
          </Link>
        ))}
        <div className="nav-end">
          {user ? (
            <>
              <button className="btn-ghost btn" type="button" onClick={() => switchRole(user.activeRole === "coach" ? "rower" : "coach")}>
                {user.activeRole === "coach" ? "Rower" : "Coach"}
              </button>
              <button className="btn-ghost btn" type="button" onClick={logout}>
                Sign out
              </button>
            </>
          ) : pathname === "/signin" ? null : (
            <Link href="/signin">Sign in</Link>
          )}
        </div>
      </div>
    </header>
  );
}
