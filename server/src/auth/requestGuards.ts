import type { NextFunction, Request, Response } from "express";

const MAX_AUTH_BODY_BYTES = 64 * 1024;

// Carries the client IP to Better Auth, which only reads it from a header.
export const CLIENT_IP_HEADER = "x-helpdesk-client-ip";

// Always overwrites the header, so a client can't choose its own IP and avoid rate limiting.
// `req.ip` is the socket address, or the forwarded address when TRUST_PROXY is set.
export function setClientIp(req: Request, _res: Response, next: NextFunction) {
  if (req.ip) req.headers[CLIENT_IP_HEADER] = req.ip;
  else delete req.headers[CLIENT_IP_HEADER];
  next();
}

// Better Auth reads the raw body without a size limit, and it must run before express.json().
// This checks only the headers, so the body stream stays unread. A body without a declared
// length (chunked) can't be checked up front, so it is refused.
export function limitAuthBody(req: Request, res: Response, next: NextFunction) {
  if (req.headers["transfer-encoding"] !== undefined) {
    res.status(411).set("Connection", "close").json({ error: "Length Required" });
    return;
  }
  if (Number(req.headers["content-length"] ?? 0) > MAX_AUTH_BODY_BYTES) {
    res.status(413).set("Connection", "close").json({ error: "Payload Too Large" });
    return;
  }
  next();
}
