import { prisma } from "../db.ts";
import type { Role } from "../generated/prisma/client.ts";
import { auth } from "./auth.ts";

type UpsertUserInput = {
  email: string;
  name: string;
  password: string;
  role: Role;
};

// Creates or updates a user with an email/password login.
// Public sign-up is disabled, so this is how users get created (seed now, admin UI in Phase 3).
export async function upsertUserWithPassword({ email, name, password, role }: UpsertUserInput) {
  const normalizedEmail = email.trim().toLowerCase();

  // Hash with Better Auth's own hasher so sign-in can verify it.
  const ctx = await auth.$context;
  const passwordHash = await ctx.password.hash(password);

  const user = await prisma.user.upsert({
    where: { email: normalizedEmail },
    create: { email: normalizedEmail, name, role },
    update: { name, role, isActive: true },
  });

  // Email/password logins live in a "credential" account.
  const account = await prisma.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
  });
  if (account) {
    await prisma.account.update({ where: { id: account.id }, data: { password: passwordHash } });
  } else {
    await prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: passwordHash,
      },
    });
  }

  return user;
}
