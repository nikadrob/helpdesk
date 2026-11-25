// Bun loads .env automatically. Fail fast if a required variable is missing.
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Express "trust proxy" value: a number of proxy hops, or a comma-separated list of IPs/CIDRs.
function trustProxy(value: string | undefined): false | number | string {
  if (!value) return false;
  if (/^\d+$/.test(value)) return Number(value);
  // Express accepts "true" as "trust everyone", which would let clients fake their IP.
  if (/^(true|false)$/i.test(value)) throw new Error("TRUST_PROXY must be a hop count or a list of IPs/CIDRs");
  return value;
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  PORT: Number(process.env.PORT ?? 3000),
  NODE_ENV: process.env.NODE_ENV ?? "development",
  // Better Auth: secret signs cookies (min 32 chars), URL is the server's public base URL.
  BETTER_AUTH_SECRET: required("BETTER_AUTH_SECRET"),
  BETTER_AUTH_URL: required("BETTER_AUTH_URL"),
  // Comma-separated origins allowed to call the auth API (the client app).
  TRUSTED_ORIGINS: (process.env.TRUSTED_ORIGINS ?? "http://localhost:5173").split(",").map((o) => o.trim()),
  TRUST_PROXY: trustProxy(process.env.TRUST_PROXY),
};
