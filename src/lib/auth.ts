import { cookies, headers } from "next/headers";
import { prisma } from "./db";
import {
  SESSION_COOKIE,
  signUserToken,
  verifyUserToken,
  asRole,
  type SessionUser,
} from "./auth-token";

export { SESSION_COOKIE, verifyUserToken, publicUser, asRole, type SessionUser } from "./auth-token";

export async function createSession(user: SessionUser): Promise<string> {
  const token = await signUserToken(user);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return token;
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const h = await headers();
  const auth = h.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return verifyUserToken(auth.slice(7).trim());
  }
  const jar = await cookies();
  const fromCookie = jar.get(SESSION_COOKIE)?.value;
  if (!fromCookie) return null;
  return verifyUserToken(fromCookie);
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}

export async function refreshSession(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  return createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    activeRole: asRole(user.activeRole),
  });
}
