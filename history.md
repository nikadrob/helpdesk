# Session History

A summary of the planning work so far, so it can continue on another machine. Last updated: 2026-11-18.

## Project Files

| File | Purpose | Status |
|------|---------|--------|
| `project-scope.md` | Problem, solution, features, SLA, non-functional requirements, risks | Done; reviewed and expanded with Claude |
| `CLAUDE.md` | Instructions for Claude Code: core rules, domain reference, conventions | Done |
| `tech-stack.md` | Chosen tech stack (written by the user) | Done; used as-is |
| `implementation-plan.md` | Work phases 1–8 with checkboxes (written by the user) | Not changed yet; gaps listed below |
| `history.md` | This file | — |

**2026-11-20:** Phase 1 scaffolding is done. It is a Bun monorepo: `client/` has React, Vite, Tailwind and React Router; `server/` has Express and Prisma 7. Typecheck and build pass. PostgreSQL 18 is installed as a Windows service (winget), and the first migration (`init`) is applied. `/api/health` returns ok. On a new machine, install PostgreSQL (or Docker), create the `helpdesk` role and database (see `CLAUDE.md`), then run `bun run db:migrate`. Commands are in `CLAUDE.md`.

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

### Tech Stack (from `tech-stack.md`)
React + TypeScript + Tailwind + React Router · Node.js + Express + TypeScript · database sessions for authentication · PostgreSQL + Prisma · Claude API · SendGrid or Mailgun · Docker

Claude also proposed an alternative stack (Vite, shadcn/ui, TanStack, pg-boss, Postmark, Better Auth). The user rejected it in favor of their own `tech-stack.md`.

## Open Items

1. **Email provider:** SendGrid or Mailgun. Choose one before phase 6.
2. **Background jobs:** the scope needs retries, automatic closing after 7 days, and anonymization. A job queue or scheduler is needed, for example pg-boss on the same Postgres database. Not decided yet, and any new library needs the user's approval.
3. **Cloud provider for deployment:** not chosen.
4. **Gaps in `implementation-plan.md`:** Claude proposed adding these tasks. Waiting for the user's answer.
   - **Mismatch with scope:**
     - Phase 3 says "delete user", but the scope says deactivate (to keep audit history).
     - Validation is only in phase 8; it should be part of every endpoint.
     - The knowledge base should come before the suggested-reply endpoint.
   - **Phase 1:** Prisma schema and migrations, `.env` setup, test setup (Vitest)
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

1. Decide whether the gaps above go into `implementation-plan.md`.
2. Start phase 1 (project setup), then add the build, run, and test commands to `CLAUDE.md`.

## Continuing on Another Machine

Copy or clone the project folder, open Claude Code in it, and say for example: "Read history.md and continue." Claude Code reads `CLAUDE.md` automatically. Conversation history and Claude's local memory stay on the original machine, so this file is the handoff.
