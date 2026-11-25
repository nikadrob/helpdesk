// Integration tests for the users API. They need the dev database running,
// and they create (then delete) their own test users.
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import type { Server } from "node:http";
import { app } from "../app.ts";
import { upsertUserWithPassword } from "../auth/users.ts";
import { prisma } from "../db.ts";
import { env } from "../env.ts";

const ADMIN = "users-test-admin@example.test";
const AGENT = "users-test-agent@example.test";
const PASSWORD = "correct-horse-battery";

type ListedUser = Record<string, unknown> & { email: string };

let server: Server;
let baseUrl: string;

function getUsers(cookie?: string) {
  return fetch(`${baseUrl}/api/users`, { headers: cookie ? { Cookie: cookie } : {} });
}

// Signs in and returns the session cookie as "name=value".
async function signIn(email: string): Promise<string> {
  const res = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: env.TRUSTED_ORIGINS[0]! },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  expect(res.status).toBe(200);
  const cookie = res.headers.getSetCookie().find((c) => c.startsWith("better-auth.session_token="));
  return cookie!.split(";")[0]!;
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
  await upsertUserWithPassword({ email: ADMIN, name: "Users Test Admin", password: PASSWORD, role: "ADMIN" });
  await upsertUserWithPassword({ email: AGENT, name: "Users Test Agent", password: PASSWORD, role: "AGENT" });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: [ADMIN, AGENT] } } }); // sessions and accounts cascade
  server.close();
  await prisma.$disconnect();
});

describe("GET /api/users", () => {
  test("rejects requests without a session", async () => {
    const res = await getUsers();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  test("rejects agents", async () => {
    const res = await getUsers(await signIn(AGENT));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Forbidden" });
  });

  test("rejects an admin who was demoted after signing in", async () => {
    const cookie = await signIn(ADMIN);
    await prisma.user.update({ where: { email: ADMIN }, data: { role: "AGENT" } });
    expect((await getUsers(cookie)).status).toBe(403);
  });

  test("rejects an admin who was deactivated after signing in", async () => {
    const cookie = await signIn(ADMIN);
    await prisma.user.update({ where: { email: ADMIN }, data: { isActive: false } });
    expect((await getUsers(cookie)).status).toBe(401);
  });

  test("gives admins the list, including deactivated users, with only the allowed fields", async () => {
    await prisma.user.update({ where: { email: AGENT }, data: { isActive: false } });

    const res = await getUsers(await signIn(ADMIN));
    expect(res.status).toBe(200);

    const { users } = (await res.json()) as { users: ListedUser[] };
    expect(users.find((u) => u.email === ADMIN)).toMatchObject({
      name: "Users Test Admin",
      role: "ADMIN",
      isActive: true,
    });
    expect(users.find((u) => u.email === AGENT)).toMatchObject({ role: "AGENT", isActive: false });
    for (const user of users) {
      expect(Object.keys(user).sort()).toEqual(["createdAt", "email", "id", "isActive", "name", "role"]);
    }
  });
});
