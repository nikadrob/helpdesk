import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth, type AuthUser } from "./auth.ts";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session || !session.user.isActive) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.user = session.user;
  next();
}

// Use after requireAuth. The role comes from the database on every request,
// so demoting an admin takes effect at once.
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "ADMIN") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}
