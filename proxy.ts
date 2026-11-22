import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SECURE_COOKIE_NAME = "__Secure-authjs.session-token";

async function hasValidAdminToken(req: NextRequest): Promise<boolean> {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) return false;

  const cookieHeader = req.headers.get("cookie") ?? "";
  const secureCookie =
    cookieHeader.includes(SECURE_COOKIE_NAME) ||
    req.nextUrl.protocol === "https:" ||
    req.headers.get("x-forwarded-proto") === "https";

  try {
    const token = await getToken({ req, secret, secureCookie });
    return token?.role === "admin";
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/videos")) {
    const authenticated = await hasValidAdminToken(req);
    if (!authenticated) {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ["/dashboard/:path*", "/videos/:path*"],
};
