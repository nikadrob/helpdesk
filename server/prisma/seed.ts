// Creates (or updates) the first admin user. Run with `bun run db:seed`.
import { upsertUserWithPassword } from "../src/auth/users.ts";
import { prisma } from "../src/db.ts";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

await upsertUserWithPassword({
  email: required("SEED_ADMIN_EMAIL"),
  password: required("SEED_ADMIN_PASSWORD"),
  name: required("SEED_ADMIN_NAME"),
  role: "ADMIN",
});

console.log("Admin user seeded.");
await prisma.$disconnect();
