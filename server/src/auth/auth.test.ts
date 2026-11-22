// Integration tests for the auth flow. They need the dev database running,
// and they create (then delete) their own test user.
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import type { Server } from "node:http";
import { app } from "../app.ts";
import { prisma } from "../db.ts";
import { env } from "../env.ts";
import { upsertUserWithPassword } from "./users.ts";

const EMAIL = "auth-test-user@example.test";
const PASSWORD = "correct-horse-battery";
const ORIGIN = env.TRUSTED_ORIGINS[0]!;

let server: Server;
let baseUrl: string;

function post(path: string, body: unknown, cookie?: string) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: ORIGIN,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

function getMe(cookie?: string) {
  return fetch(`${baseUrl}/api/me`, { headers: cookie ? { Cookie: cookie } : {} });
}

// Returns the session cookie from a response as "name=value".
function sessionCookie(res: Response): string {
  const cookie = res.headers.getSetCookie().find((c) => c.startsWith("better-auth.session_token="));
  expect(cookie).toBeDefined();
  return cookie!.split(";")[0]!;
}

async function signIn(email = EMAIL, password = PASSWORD) {
  return post("/api/auth/sign-in/email", { email, password });
}

async function deleteTestUser() {
  await prisma.user.deleteMany({ where: { email: EMAIL } }); // sessions and accounts cascade
}

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No server address");
  baseUrl = `http://localhost:${address.port}`;
});

beforeEach(async () => {
  await upsertUserWithPassword({ email: EMAIL, name: "Auth Test", password: PASSWORD, role: "AGENT" });
});

afterAll(async () => {
  await deleteTestUser();
  server.close();
  await prisma.$disconnect();
});

describe("auth flow", () => {
  test("protected route rejects requests without a session", async () => {
    const res = await getMe();
    expect(res.status).toBe(401);
  });

  test("public sign-up is disabled", async () => {
    const res = await post("/api/auth/sign-up/email", {
      email: "someone-new@example.test",
      password: "some-password-123",
      name: "New",
    });
    expect(res.status).toBe(400);
    expect(await prisma.user.count({ where: { email: "someone-new@example.test" } })).toBe(0);
  });

  test("wrong password is rejected", async () => {
    const res = await signIn(EMAIL, "wrong-password");
    expect(res.status).toBe(401);
    expect(res.headers.getSetCookie()).toHaveLength(0);
  });

  test("unknown email gets the same error as a wrong password", async () => {
    const unknown = await signIn("nobody@example.test", PASSWORD);
    const wrong = await signIn(EMAIL, "wrong-password");
    expect(unknown.status).toBe(401);
    expect(await unknown.json()).toEqual(await wrong.json());
  });

  test("sign in sets an HttpOnly session cookie and stores the session", async () => {
    const res = await signIn(EMAIL.toUpperCase()); // email is case-insensitive
    expect(res.status).toBe(200);

    const raw = res.headers.getSetCookie().find((c) => c.startsWith("better-auth.session_token="))!;
    expect(raw).toContain("HttpOnly");
    expect(raw).toContain("SameSite=Lax");

    const user = await prisma.user.findUniqueOrThrow({ where: { email: EMAIL } });
    expect(await prisma.session.count({ where: { userId: user.id } })).toBeGreaterThan(0);
  });

  test("session gives access to protected routes, without exposing the password", async () => {
    const cookie = sessionCookie(await signIn());
    const res = await getMe(cookie);
    expect(res.status).toBe(200);

    const { user } = (await res.json()) as { user: Record<string, unknown> };
    expect(user.email).toBe(EMAIL);
    expect(user.role).toBe("AGENT");
    expect(user.isActive).toBe(true);
    expect(JSON.stringify(user)).not.toContain("password");
  });

  test("sign out deletes the session", async () => {
    const cookie = sessionCookie(await signIn());
    const res = await post("/api/auth/sign-out", {}, cookie);
    expect(res.status).toBe(200);
    expect((await getMe(cookie)).status).toBe(401);
  });

  test("deactivated user cannot sign in", async () => {
    await prisma.user.update({ where: { email: EMAIL }, data: { isActive: false } });
    const res = await signIn();
    expect(res.status).toBe(401);
    expect(res.headers.getSetCookie()).toHaveLength(0);
  });

  test("deactivating a user ends their existing session immediately", async () => {
    const cookie = sessionCookie(await signIn());
    expect((await getMe(cookie)).status).toBe(200);

    await prisma.user.update({ where: { email: EMAIL }, data: { isActive: false } });
    expect((await getMe(cookie)).status).toBe(401);
  });

  test("forged session cookie is rejected", async () => {
    const res = await getMe("better-auth.session_token=not-a-real-token.fake-signature");
    expect(res.status).toBe(401);
  });
});
