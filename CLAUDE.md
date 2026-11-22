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
  - `src/App.tsx`: defines the routes and shows an API health banner on every page. It calls `/api/health` on load and handles four states: loading, ok, database down (503), and server unreachable. The banner uses theme colors and an icon per state (muted while loading, primary when ok, destructive when the database or server is down).
  - shadcn/ui (`components.json`: `base-nova` style on Base UI, neutral base color, lucide icons). Add components with `bunx --bun shadcn@latest add <name>`; they land in `src/components/ui/` and can be edited. The theme is the CSS variables in `src/index.css` (`:root` for light, `.dark` for dark): neutral grays with a blue primary (`blue-600` in light, `blue-500` in dark). Use theme colors (`bg-background`, `text-muted-foreground`, `text-destructive`, ...) instead of fixed Tailwind colors.
  - Import alias: `@/` maps to `src/` (in `tsconfig.json`, `tsconfig.app.json`, and `vite.config.ts`).
  - `src/lib/auth-client.ts`: the Better Auth React client (`useSession`, `signIn`, `signOut`). It uses the default `/api/auth` path on the current origin.
  - `src/components/ProtectedRoute.tsx`: layout route that redirects to `/login` when there is no session (passing the original path in `state.from`). Put routes that need a signed-in user inside it.
  - `src/components/Navbar.tsx`: the top bar on every page: the HelpDesk label on the left; on the right the signed-in user's name, a Sign out button, and the theme switch (the switch also shows when signed out).
  - Light/dark theme: light by default. `src/lib/theme.ts` (`getTheme`, `setTheme`) toggles the `dark` class on `<html>` and saves the choice in `localStorage` (`theme`). `src/components/ThemeToggle.tsx` is the sun/moon button. An inline script in `client/index.html` applies the saved theme before React renders, so there is no flash.
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

## Authentication

Better Auth (1.7.27) with email/password and database sessions (no JWT). The server and the React client both use the `better-auth` package, at the same pinned version.

How it works:
- **Sign-in:** `LoginPage` validates the form with Zod, then calls `signIn.email({ email, password })` → `POST /api/auth/sign-in/email`. On success, Better Auth creates a `Session` row and sets the `better-auth.session_token` cookie (HTTP-only). The page then navigates to `state.from` or `/`.
- **Sessions:** valid for 7 days, extended at most once a day while in use. There is no cookie cache, so every session check reads the database. Signing out (`signOut()` → `POST /api/auth/sign-out`) deletes the session row.
- **Same origin:** the client calls `/api/auth/*` on its own origin. Vite proxies it to the server in development, so the cookie is first-party and no CORS setup is needed. `TRUSTED_ORIGINS` (default `http://localhost:5173`) lists the origins Better Auth accepts requests from; set it for each deployed client URL. `BETTER_AUTH_URL` is the server's public base URL.
- **Who can sign in:** there is no public sign-up. Users are created with `upsertUserWithPassword` (`src/auth/users.ts`): the seed creates the first admin now, and the admin UI will in Phase 3. It normalizes the email (trim, lowercase), hashes the password with Better Auth's own hasher, and stores it in the `credential` `Account`. Upserting reactivates a user and resets their password.
- **Deactivation:** a deactivated user (`isActive = false`) can't sign in, because the session-create hook refuses it. `requireAuth` also rejects existing sessions of deactivated users, so it takes effect on their next request. When deactivating a user (Phase 3), also delete their sessions.
- **Roles:** `role` (`ADMIN` | `AGENT`, default `AGENT`) and `isActive` are Better Auth additional fields with `input: false`, so clients can't set them through auth endpoints. Role checks (admin-only routes) are Phase 3 and must be done on the server.

How to use it:
- **Protect an API route:** add the `requireAuth` middleware, then read `req.user` (`id`, `email`, `name`, `role`, `isActive`). It responds `401 { error: "Unauthorized" }` when there is no valid session.
- **Protect a page:** put its `<Route>` inside the `<Route element={<ProtectedRoute />}>` group in `App.tsx`. This only affects the UI; the API must still use `requireAuth`.
- **Current user in the UI:** `const { data: session, isPending } = useSession()` from `@/lib/auth-client`; `session.user.name` etc. It updates automatically after sign-in and sign-out.
- **Error messages:** the login form shows the same "Invalid email or password." for a wrong password, an unknown email, and a deactivated account, so it doesn't reveal which accounts exist. Keep it that way.

Gotchas:
- Mount the Better Auth handler **before** `express.json()`; it reads the raw body.
- `/api/auth/sign-up/email` is disabled on purpose (404). Don't re-enable it to create users.
- Changing auth config or adding plugins can change the tables Better Auth expects; check `schema.prisma` and migrate.
- To test sign-in without the browser, send requests through the Vite proxy (`http://localhost:5173/api/auth/...`) with an `Origin: http://localhost:5173` header on `POST` requests; Better Auth's origin check can reject them otherwise.

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
- `cd client && bunx --bun shadcn@latest add <component>`: add a shadcn/ui component
- `cd server && bun test`: run server tests (the auth tests need the database running)

Setup: copy `server/.env.example` to `server/.env` and set `BETTER_AUTH_SECRET` (`openssl rand -base64 32`). Bun loads `.env` automatically.

Database: PostgreSQL 18 runs either as a local Windows service (`postgresql-x64-18`, installed with winget) or in Docker (`bun run db:up`). Both use the same connection string: user `helpdesk`, password `helpdesk`, database `helpdesk`, on `localhost:5432`. The `helpdesk` role has `CREATEDB`, which `prisma migrate dev` needs for its shadow database.

Database admin (local development only, for pgAdmin and administrative tasks): user `postgres`, password `postgres`. The app itself always connects as `helpdesk`.

**Windows note:** call CLIs in package scripts through Bun (`bun --bun tsc`, `bun --bun vite`, `bunx prisma`), not directly. Bun's Windows `.exe` shims fail with `bun: unknown error` for TypeScript 7 and Vite.

**Prisma version:** keep `prisma` and `@prisma/client` on the same version (currently 7.10.1). `bun add prisma` without a version installs an 8.0 release candidate. Ignore the Prisma CLI notice that suggests upgrading to it.

## Tech Stack

The stack is defined in [tech-stack.md](tech-stack.md). Stick to it, and ask before adding a new framework or major library.

- **Frontend:** React + TypeScript, Tailwind CSS, React Router, shadcn/ui, React Hook Form + Zod (forms and validation, through `@hookform/resolvers`)
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
