import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "../db.ts";
import { env } from "../env.ts";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: env.TRUSTED_ORIGINS,
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    // No public sign-up: admins create users (Phase 3); the first admin comes from the seed script.
    disableSignUp: true,
  },

  user: {
    additionalFields: {
      role: { type: ["ADMIN", "AGENT"], required: false, defaultValue: "AGENT", input: false },
      isActive: { type: "boolean", required: false, defaultValue: true, input: false },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // extend the session at most once a day
    // No cookie cache: every request checks the database, so deactivation takes effect at once.
  },

  databaseHooks: {
    session: {
      create: {
        // Deactivated users can't sign in.
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { isActive: true },
          });
          return user?.isActive ? true : false;
        },
      },
    },
  },
});

export type AuthSession = typeof auth.$Infer.Session;
export type AuthUser = AuthSession["user"];
