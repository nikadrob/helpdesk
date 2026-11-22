# CLAUDE.md

This file guides Claude Code when working in this repository.

## Project

HelpDesk is an AI-assisted support ticket system for student support emails. It turns emails into tickets, uses AI to classify, prioritize, summarize, and route them, and drafts replies from a knowledge base. An agent approves every reply before it is sent.

The full scope, features, SLA, and decisions are in [project-scope.md](project-scope.md). Read it before planning or building a feature. If a request conflicts with the scope, point out the conflict instead of quietly deviating from it.

## Status

Phases 1 (project setup) and 2 (authentication) are done. Phase 3 (user management) is next.

Work follows the phases in [implementation-plan.md](implementation-plan.md), in order. Work on one phase at a time. When a task is done, mark its checkbox (`- [x]`). Do not start work from a later phase unless asked.

## Project Structure

Bun workspaces monorepo:

- `client/`: React 19 + TypeScript (Vite 8), Tailwind CSS v4 (through the `@tailwindcss/vite` plugin, no config file), React Router (declarative mode with `BrowserRouter`)
  - `src/main.tsx`: wraps the app in `BrowserRouter`
  - `src/App.tsx`: defines the routes and shows an API health banner on every page. It calls `/api/health` on load and handles four states: loading, ok, database down (503), and server unreachable.
  - `src/lib/auth-client.ts`: the Better Auth React client (`useSession`, `signIn`, `signOut`). It uses the default `/api/auth` path on the current origin.
  - `src/components/ProtectedRoute.tsx`: layout route that redirects to `/login` when there is no session (passing the original path in `state.from`). Put routes that need a signed-in user inside it.
  - `src/components/Navbar.tsx`: shows the signed-in user's name and a Sign out button.
  - `src/pages/`: page components (`LoginPage`, `HomePage`, `NotFoundPage`). After sign-in, `LoginPage` redirects to `state.from` or `/`; a signed-in user who opens `/login` is redirected too.
- `server/`: Express 5 + TypeScript, running on Bun
  - `src/index.ts`: starts the server
  - `src/app.ts`: the Express app and routes. `GET /api/health` returns `{ status, database }`: 200 when the database responds, 503 when it doesn't.
  - `src/env.ts`: reads environment variables and fails at startup if a required one is missing. Use `env` from this file instead of reading `process.env` directly.
  - `src/db.ts`: the shared Prisma client (`prisma`), using the `@prisma/adapter-pg` driver adapter
  - `src/auth/auth.ts`: the Better Auth instance (email/password, database sessions through the Prisma adapter, no cookie cache). Public sign-up is disabled (`/api/auth/sign-up/email` returns 404 through `disabledPaths`), `role` and `isActive` are server-only user fields, and a session hook blocks sign-in for deactivated users. Its handler is mounted at `/api/auth/*` in `app.ts`, **before** `express.json()`. Endpoints: `POST /api/auth/sign-in/email`, `POST /api/auth/sign-out`, `GET /api/auth/get-session`.
  - `src/auth/middleware.ts`: `requireAuth` checks the session with `auth.api.getSession` and sets `req.user`. `GET /api/me` is an example protected route.
  - `src/auth/users.ts`: `upsertUserWithPassword` creates or updates a user with a credential account (public sign-up is disabled). Used by the seed and the tests.
  - `src/auth/auth.test.ts`: integration tests for the auth flow. They need the database running and clean up their own test user.
- `server/prisma/`:
  - `schema.prisma`: the database schema (`User`, `Session`, `Account`, `Verification`, `Ticket`). `Session`, `Account`, and `Verification` follow Better Auth's core schema. After changing auth config or plugins, check that the schema still matches what Better Auth expects.
  - `migrations/`: migration history. Commit it, and never edit an applied migration.
  - The Prisma 7 config is in `server/prisma.config.ts`, and the generated client goes to `server/src/generated/prisma` (git-ignored). Import it from `./generated/prisma/client.ts`, not from `@prisma/client`.
- `docker-compose.yml`: optional PostgreSQL in Docker

In development, Vite proxies `/api/*` to the server on port 3000, so the client calls the API with relative URLs (`fetch('/api/...')`).

Schema notes:
- Enum values are uppercase (`OPEN`, `IN_PROGRESS`, `COURSE_CONTENT`, `URGENT`, ...). They map to the domain names in the Domain Reference below.
- Users are deactivated (`isActive = false`), never deleted, so audit history stays intact.
- `Ticket.category` is null until AI classification runs or an agent sets it.
- `Session.token` is the random token in the session cookie (`better-auth.session_token`). Passwords are not on `User`; they are in an `Account` row with `providerId = "credential"`.

## Commands

Run these from the repo root:

- `bun install`: install all workspaces
- `bun run dev`: start client (http://localhost:5173) and server (http://localhost:3000) together
- `bun run dev:client` / `bun run dev:server`: start one of them
- `bun run build`: build both
- `bun run typecheck`: type-check both
- `bun run db:up`: start PostgreSQL in Docker
- `bun run db:migrate`: create and apply a migration (`prisma migrate dev`)
- `bun run db:generate`: regenerate the Prisma client after a schema change
- `bun run db:studio`: open Prisma Studio
- `bun run db:seed`: create or update the first admin from `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME` in `server/.env`
- `cd server && bun test`: run server tests (the auth tests need the database running)

Setup: copy `server/.env.example` to `server/.env` and set `BETTER_AUTH_SECRET` (`openssl rand -base64 32`). Bun loads `.env` automatically.

Database: PostgreSQL 18 runs either as a local Windows service (`postgresql-x64-18`, installed with winget) or in Docker (`bun run db:up`). Both use the same connection string: user `helpdesk`, password `helpdesk`, database `helpdesk`, on `localhost:5432`. The `helpdesk` role has `CREATEDB`, which `prisma migrate dev` needs for its shadow database.

Database admin (local development only, for pgAdmin and administrative tasks): user `postgres`, password `postgres`. The app itself always connects as `helpdesk`.

**Windows note:** call CLIs in package scripts through Bun (`bun --bun tsc`, `bun --bun vite`, `bunx prisma`), not directly. Bun's Windows `.exe` shims fail with `bun: unknown error` for TypeScript 7 and Vite.

**Prisma version:** keep `prisma` and `@prisma/client` on the same version (currently 7.10.1). `bun add prisma` without a version installs an 8.0 release candidate. Ignore the Prisma CLI notice that suggests upgrading to it.

## Tech Stack

The stack is defined in [tech-stack.md](tech-stack.md). Stick to it, and ask before adding a new framework or major library.

- **Frontend:** React + TypeScript, Tailwind CSS, React Router, React Hook Form + Zod (forms and validation, through `@hookform/resolvers`)
- **Backend:** Express + TypeScript on the Bun runtime (Bun is also the package manager and test runner), with authentication through Better Auth (`better-auth`, pinned to 1.7.27) using database sessions (not JWT)
- **Database:** PostgreSQL with Prisma
- **AI:** Claude API (Anthropic SDK, `@anthropic-ai/sdk`)
- **Email:** SendGrid or Mailgun, for outbound replies and inbound webhooks
- **Deployment:** Docker + a cloud provider

## Core Rules (do not break these)

- **No auto-send:** AI replies are always drafts. Nothing reaches a student without an agent's explicit approval.
- **Grounded answers only:** AI replies must be based only on the knowledge base. If the knowledge base has no answer, flag the ticket for an agent instead of generating one.
- **Languages:** the UI and the knowledge base are in English only. Students may write in English or Croatian/Serbian, and the AI drafts the reply in the student's language. Ticket summaries are always in English.
- **No lost emails:** inbound email handling must be idempotent and must retry on failure. If an AI call fails, the ticket is still created, and an agent handles it manually.
- **Audit:** record who sent each reply and when, and whether it was AI-drafted (sent unchanged, edited, or rejected).
- **Personal data (GDPR):** treat student emails and names as personal data. Never log email bodies or personal data in plain-text application logs. Closed tickets are anonymized after 2 years.
- **Roles:** enforce permissions on the server, not only in the UI. User management, knowledge base management, categories, and settings are admin-only.

## Domain Reference

- **Statuses:** `Open` → `In Progress` → `Resolved` → `Closed`. `Resolved` closes automatically after 7 days without a reply. A student reply reopens the ticket (`Open`).
- **Categories:** Technical, Billing, Course Content, Account, Refund, Other
- **Priorities:** Low, Normal, High, Urgent. AI sets the priority, and agents can change it.
- **SLA (first response, business hours Mon–Fri 09:00–17:00):** Urgent 2h, High 4h, Normal 1 business day, Low 2 business days
- **Routing:** each category maps to a team, and a new ticket lands unassigned in that team's queue
- **Email threading:** match replies to existing tickets using the `Message-ID`, `In-Reply-To`, and `References` headers. Set these headers on outbound replies.

## Conventions

- Code, comments, commit messages, and documentation are in English.
- Keep AI prompts in separate, versioned files, not inline strings, so they can be reviewed and tested.
- Put every call to the AI provider behind a single service or module, so the model or provider can be changed and its usage and cost can be tracked.
- Keep secrets (API keys, email provider credentials) in environment variables, and never commit them.
- Write tests for ticket status transitions, SLA calculations, and email threading. These are the parts most likely to break quietly.
