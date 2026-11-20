# Session History

A summary of the work so far, so it can continue on another machine. Last updated: 2026-11-20.

Repository: https://github.com/nikadrob/helpdesk (branch `master`)

## Current Status

- **Planning:** done (`project-scope.md`, `tech-stack.md`, `implementation-plan.md`, `CLAUDE.md`)
- **Phase 1 (project setup):** done and pushed
  - Bun workspaces monorepo: `client/` (React 19, Vite 8, Tailwind v4, React Router) and `server/` (Express 5, Prisma 7.10.1, running on Bun)
  - PostgreSQL 18 with the first migration (`init`): tables `User`, `Session`, `Ticket`
  - `GET /api/health` checks the database. The client shows the result as a colored banner on every page (in `App.tsx`).
  - Typecheck and build pass for both apps.
- **Next:** Phase 2 (authentication). Login page, login and logout endpoints, session middleware, and route protection in the client.

## Setting Up on a New PC (Windows)

1. **Clone:**
   ```
   git clone https://github.com/nikadrob/helpdesk.git
   cd helpdesk
   ```
2. **Install Bun:**
   ```
   powershell -c "irm bun.sh/install.ps1 | iex"
   ```
   Restart the terminal afterwards so `bun` is on the PATH.
3. **Install PostgreSQL 18:**
   ```
   winget install PostgreSQL.PostgreSQL.18
   ```
   Set the `postgres` superuser password to `postgres` (local development only, see `CLAUDE.md`). Docker Desktop with `bun run db:up` also works.
4. **Create the app user and database.** In pgAdmin or psql, logged in as `postgres`:
   ```sql
   CREATE ROLE helpdesk LOGIN PASSWORD 'helpdesk' CREATEDB;
   CREATE DATABASE helpdesk OWNER helpdesk;
   ```
   `CREATEDB` is required, because `prisma migrate dev` needs it for its shadow database.
5. **Environment:** copy `server/.env.example` to `server/.env`. The defaults already match step 4.
6. **Install and migrate:**
   ```
   bun install
   bun run db:migrate
   ```
   `db:migrate` applies the existing migrations and regenerates the Prisma client.
7. **Run:** `bun run dev`, then open http://localhost:5173. The banner should be green: *API is running and the database is connected.*
8. **Claude Code + Context7** (current library docs). Run once in the project folder:
   ```
   claude mcp add context7 -- npx -y @upstash/context7-mcp
   ```
   Then restart Claude Code and check with `/mcp`. This setting is per machine and is not in git.

Then start Claude Code in the project folder and say: "Read history.md and continue with Phase 2."

## Things to Know (Windows and Tooling)

- **Running CLIs:** call them through Bun in package scripts (`bun --bun tsc`, `bun --bun vite`, `bunx prisma`). Bun's `.exe` shims on Windows fail with `bun: unknown error` for TypeScript 7 and Vite.
- **Prisma version:** stay on 7.10.1 for both `prisma` and `@prisma/client`. `bun add prisma` without a version installs 8.0.0-rc. Ignore the CLI's upgrade notice.
- **Line endings:** Git warns `LF will be replaced by CRLF`. This is harmless. Adding a `.gitattributes` with `* text=auto eol=lf` was suggested but is not done yet.
- **Bash in Claude Code:** commands with the `!` prefix run in bash, so use `cat ~/file`, not `type %USERPROFILE%\file`.

## Decisions

### Scope
- **No auto-send in the MVP:** every AI reply is a draft that an agent approves. Auto-send may come after launch.
- **Categories:** Technical, Billing, Course Content, Account, Refund, Other
- **Priorities:** Low, Normal, High, Urgent. AI sets the priority, and agents can change it.
- **Statuses:** Open → In Progress → Resolved → Closed. Resolved closes automatically after 7 days without a reply. A student reply reopens the ticket.
- **Routing:** each category maps to a team, and new tickets land unassigned in the team queue. Agents take tickets themselves, and admins can assign them.
- **Languages:**
  - The knowledge base and the UI are in English only.
  - Students may write in English or Croatian/Serbian, and the AI drafts the reply in the student's language.
  - Ticket summaries are always in English.
- **SLA (first response, business hours Mon–Fri 09:00–17:00):** Urgent 2h, High 4h, Normal 1 business day, Low 2 business days
- **Goals:**
  - Average first response under 2 business hours
  - At least 60% of AI drafts sent with little or no editing
  - At least 90% classification accuracy
  - At least 95% of tickets within SLA
- **Data retention:** closed tickets are anonymized after 2 years, and a student's data is deleted on request (GDPR).
- **Import:** existing FAQ content is imported once into the knowledge base. Historical tickets are not imported.
- **Attachments:** up to 10 MB per email
- **Out of scope:** student portal, channels other than email, other languages, mobile app, CRM integrations

### Tech Stack
From `tech-stack.md`: React + TypeScript + Tailwind + React Router · Express + TypeScript on Bun · database sessions for authentication (not JWT) · PostgreSQL + Prisma · Claude API · SendGrid or Mailgun · Docker.

Claude also proposed an alternative stack (shadcn/ui, TanStack, pg-boss, Postmark, Better Auth). The user rejected it in favor of their own `tech-stack.md`.

### Schema (Phase 1)
- Users are deactivated (`isActive`), never deleted, so audit history stays intact.
- Enum values are uppercase (`OPEN`, `IN_PROGRESS`, `COURSE_CONTENT`...).
- `Ticket.category` is null until AI classification runs or an agent sets it.
- `Session.id` is the random token that goes in the session cookie.

## Open Items

1. **Email provider:** SendGrid or Mailgun. Choose one before Phase 6.
2. **Background jobs:** the scope needs retries, automatic closing after 7 days, and anonymization. A job queue or scheduler is needed, for example pg-boss on the same Postgres database. Not decided yet, and any new library needs the user's approval.
3. **Cloud provider for deployment:** not chosen.
4. **Gaps in `implementation-plan.md`:** Claude proposed adding these tasks. Waiting for the user's answer. The Phase 1 gaps are already covered (Prisma schema, migrations, `.env`), and tests use `bun test`.
   - **Mismatch with scope:**
     - Phase 3 says "delete user", but the scope says deactivate (to keep audit history).
     - Validation is only in Phase 8; it should be part of every endpoint.
     - The knowledge base should come before the suggested-reply endpoint.
   - **Phase 2:** password hashing, and a seeded first admin user
   - **Phase 4:**
     - priority
     - search
     - internal notes
     - pagination
     - filters by assignee and priority
     - agents taking tickets from the queue
   - **Phase 5:**
     - admin UI for the knowledge base
     - FAQ import
     - replies in the student's language
     - flagging tickets when the knowledge base has no answer
     - routing to teams
     - logging category overrides and whether drafts are accepted, edited, or rejected
   - **Phase 6:**
     - ignoring auto-replies and spam
     - attachments
     - retrying failed AI and email calls
     - running AI classification when an email arrives
   - **Phase 7:** response times, SLA metrics, AI draft acceptance rate, unassigned tickets
   - **Missing everywhere:**
     - SLA calculation and highlighting of overdue tickets
     - background jobs for automatic closing and anonymization
     - audit log
     - GDPR data deletion

## Next Steps

1. Set up the new PC (see above) and confirm the green banner.
2. Optionally, decide whether the gaps above go into `implementation-plan.md`.
3. Start Phase 2 (authentication).
