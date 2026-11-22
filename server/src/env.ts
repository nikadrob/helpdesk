// Bun loads .env automatically. Fail fast if a required variable is missing.
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
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
};
