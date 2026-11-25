import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { prisma } from "../db.ts";
import { env } from "../env.ts";
import { CLIENT_IP_HEADER } from "./requestGuards.ts";
import { SignInLimiter } from "./signInLimiter.ts";

// Per email: 10 attempts in 15 minutes, cleared by a successful sign-in.
const signInLimiter = new SignInLimiter(10, 15 * 60 * 1000);

// The email of a sign-in request, or null for any other request.
function signInEmail(path: string, body: unknown): string | null {
  if (path !== "/sign-in/email") return null;
  const email = (body as { email?: unknown } | undefined)?.email;
  return typeof email === "string" ? email : null;
}

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: env.TRUSTED_ORIGINS,
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  // No public sign-up route at all (404). disableSignUp below is a second safeguard.
  disabledPaths: ["/sign-up/email"],

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

  // Per IP: 3 sign-ins per 10 seconds, 100 requests per 10 seconds for other endpoints (Better Auth defaults).
  // Better Auth enables this only in production, so turn it on explicitly. Off in tests, which sign in repeatedly.
  rateLimit: { enabled: env.NODE_ENV !== "test" },
  advanced: {
    // Set by setClientIp. Don't trust X-Forwarded-For here: clients can fake it.
    ipAddress: { ipAddressHeaders: [CLIENT_IP_HEADER] },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const email = signInEmail(ctx.path, ctx.body);
      if (email !== null && !signInLimiter.attempt(email)) {
        throw new APIError("TOO_MANY_REQUESTS", { message: "Too many sign-in attempts. Please try again later." });
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      const email = signInEmail(ctx.path, ctx.body);
      if (email !== null && ctx.context.newSession) signInLimiter.reset(email);
    }),
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
