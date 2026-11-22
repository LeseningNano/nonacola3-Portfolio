import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAMES = [
  "__Secure-authjs.session-token",
  "__Secure-authjs.session-token.0",
  "authjs.session-token",
  "authjs.session-token.0",
] as const;

function hasSessionCookie(req: NextRequest): boolean {
  return SESSION_COOKIE_NAMES.some((name) => Boolean(req.cookies.get(name)?.value));
}

// 边缘中间件只做快速乐观拦截（无会话 cookie 直接跳 /login）：
// 1. 避免 next-auth 的 auth() 中间件包装器在 EdgeOne 运行时触发 RequestInit.eo 报错；
// 2. 避免边缘运行时缺少 NEXTAUTH_SECRET 或 WebCrypto 差异导致合法会话被误拦。
// 真正的 JWT 解密与 role === "admin" 校验由 Node.js 端的 DashboardLayout（auth()）
// 以及所有写接口的 requireAdmin() 完成。
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/videos")) {
    if (!hasSessionCookie(req)) {
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
