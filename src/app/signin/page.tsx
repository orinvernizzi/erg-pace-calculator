import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SignInForm } from "./form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSession();
  const { next } = await searchParams;
  if (session) {
    redirect(next && next.startsWith("/") ? next : "/");
  }
  return (
    <Suspense fallback={<p className="lede">Sign in.</p>}>
      <SignInForm />
    </Suspense>
  );
}
