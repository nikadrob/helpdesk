import express from "express";
import { toNodeHandler } from "better-auth/node";
import { prisma } from "./db.ts";
import { auth } from "./auth/auth.ts";
import { requireAuth } from "./auth/middleware.ts";
import { limitAuthBody, setClientIp } from "./auth/requestGuards.ts";
import { env } from "./env.ts";

export const app = express();

// Which proxies may set X-Forwarded-For. Off by default: req.ip is the socket address.
app.set("trust proxy", env.TRUST_PROXY);

// Better Auth reads the raw request body, so it must be mounted before express.json().
app.all("/api/auth/*splat", limitAuthBody, setClientIp, toNodeHandler(auth));

app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "ok" });
  } catch {
    res.status(503).json({ status: "degraded", database: "unreachable" });
  }
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
