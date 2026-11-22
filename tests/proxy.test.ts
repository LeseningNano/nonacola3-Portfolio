import assert from "node:assert/strict";
import test from "node:test";
import { encode } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";

const TEST_SECRET = "test-nextauth-secret-for-proxy-unit-tests";

async function withSecret<T>(fn: () => Promise<T>): Promise<T> {
  const prevAuth = process.env.AUTH_SECRET;
  const prevNextAuth = process.env.NEXTAUTH_SECRET;
  process.env.NEXTAUTH_SECRET = TEST_SECRET;
  delete process.env.AUTH_SECRET;
  try {
    return await fn();
  } finally {
    if (prevAuth === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = prevAuth;
    if (prevNextAuth === undefined) delete process.env.NEXTAUTH_SECRET;
    else process.env.NEXTAUTH_SECRET = prevNextAuth;
  }
}

test("proxy redirects unauthenticated /dashboard requests to /login even when EdgeOne attaches eo", async () => {
  await withSecret(async () => {
    const req = new NextRequest("https://www.nonacola3.com/dashboard");
    Object.defineProperty(req, "eo", { value: null, enumerable: true });

    const res = await proxy(req);
    assert.equal(res.status, 307);
    assert.equal(res.headers.get("location"), "https://www.nonacola3.com/login");
  });
});

test("proxy allows requests with a valid encrypted admin session cookie", async () => {
  await withSecret(async () => {
    const cookieName = "__Secure-authjs.session-token";
    const jwt = await encode({
      token: { sub: "1", name: "Admin", role: "admin" },
      secret: TEST_SECRET,
      salt: cookieName,
    });

    const req = new NextRequest("https://www.nonacola3.com/dashboard/works", {
      headers: { cookie: `${cookieName}=${jwt}` },
    });

    const res = await proxy(req);
    assert.equal(res.headers.get("location"), null);
    assert.equal(res.headers.get("x-middleware-next"), "1");
  });
});

test("proxy rejects non-admin or tampered session cookies", async () => {
  await withSecret(async () => {
    const cookieName = "authjs.session-token";
    const nonAdminJwt = await encode({
      token: { sub: "2", name: "Guest", role: "guest" },
      secret: TEST_SECRET,
      salt: cookieName,
    });

    const nonAdminReq = new NextRequest("http://localhost:3000/videos/new", {
      headers: { cookie: `${cookieName}=${nonAdminJwt}` },
    });
    const nonAdminRes = await proxy(nonAdminReq);
    assert.equal(nonAdminRes.status, 307);
    assert.equal(nonAdminRes.headers.get("location"), "http://localhost:3000/login");

    const badReq = new NextRequest("https://www.nonacola3.com/dashboard", {
      headers: { cookie: "__Secure-authjs.session-token=not-a-valid-jwe" },
    });
    const badRes = await proxy(badReq);
    assert.equal(badRes.status, 307);
    assert.equal(badRes.headers.get("location"), "https://www.nonacola3.com/login");
  });
});
