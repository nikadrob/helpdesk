import { Router } from "express";
import { requireAdmin, requireAuth } from "../auth/middleware.ts";
import { prisma } from "../db.ts";

export const usersRouter = Router();

// User management is admin-only, so every route in this router is protected.
usersRouter.use(requireAuth, requireAdmin);

usersRouter.get("/", async (_req, res) => {
  const users = await prisma.user.findMany({
    // List the fields explicitly, so new columns are never exposed by accident.
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    orderBy: [{ name: "asc" }, { email: "asc" }],
  });
  res.json({ users });
});
