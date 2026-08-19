import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifyUserToken } from "@/lib/auth-token";

const PUBLIC_PREFIXES = ["/signin", "/api/auth/login", "/api/auth/register", "/api/auth/logout"];

function isPublic(pathname: string) {
  return PUBLIC_PREFIXES.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function corsHeaders(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Credentials": "true",
  };
}

export async function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
  }

  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (isPublic(pathname)) {
    const res = NextResponse.next();
    Object.entries(corsHeaders(request)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  const header = request.headers.get("authorization");
  const bearer = header?.startsWith("Bearer ") ? header.slice(7).trim() : null;
  const cookie = request.cookies.get(SESSION_COOKIE)?.value ?? null;
  const session = await verifyUserToken(bearer || cookie || "");

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Sign in required." },
        { status: 401, headers: corsHeaders(request) },
      );
    }
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  Object.entries(corsHeaders(request)).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
