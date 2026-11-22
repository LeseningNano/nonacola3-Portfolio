import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";

test("proxy redirects unauthenticated /dashboard requests to /login even when EdgeOne attaches eo", () => {
  const req = new NextRequest("https://www.nonacola3.com/dashboard");
  Object.defineProperty(req, "eo", { value: null, enumerable: true });

  const res = proxy(req);
  assert.equal(res.status, 307);
  assert.equal(res.headers.get("location"), "https://www.nonacola3.com/login");
});

test("proxy allows requests carrying an Auth.js session cookie to reach DashboardLayout verification", () => {
  for (const cookieName of [
    "__Secure-authjs.session-token",
    "__Secure-authjs.session-token.0",
    "authjs.session-token",
    "authjs.session-token.0",
  ]) {
    const req = new NextRequest("https://www.nonacola3.com/dashboard/works", {
      headers: { cookie: `${cookieName}=encrypted-session-value` },
    });

    const res = proxy(req);
    assert.equal(res.headers.get("location"), null);
    assert.equal(res.headers.get("x-middleware-next"), "1");
  }
});

test("proxy rejects empty session cookie values", () => {
  const req = new NextRequest("http://localhost:3000/videos/new", {
    headers: { cookie: "authjs.session-token=" },
  });

  const res = proxy(req);
  assert.equal(res.status, 307);
  assert.equal(res.headers.get("location"), "http://localhost:3000/login");
});
