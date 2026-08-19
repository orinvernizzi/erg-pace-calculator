import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";

export const SESSION_COOKIE = "ergcalc_session";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  activeRole: "rower" | "coach";
};

function secret() {
  const value = process.env.AUTH_SECRET ?? "ergcalc-dev-secret-change-me";
  return new TextEncoder().encode(value);
}

export async function signUserToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    activeRole: user.activeRole,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function verifyUserToken(token: string): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const id = String(payload.id ?? "");
    const email = String(payload.email ?? "");
    const name = String(payload.name ?? "");
    const activeRole = payload.activeRole === "coach" ? "coach" : "rower";
    if (!id || !email) return null;
    return { id, email, name, activeRole };
  } catch {
    return null;
  }
}

export function asRole(value: string): SessionUser["activeRole"] {
  return value === "coach" ? "coach" : "rower";
}

export function publicUser(user: SessionUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    activeRole: user.activeRole,
  };
}
