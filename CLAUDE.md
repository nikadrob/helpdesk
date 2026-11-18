# CLAUDE.md

This file guides Claude Code when working in this repository.

## Project

HelpDesk is an AI-assisted support ticket system for student support emails. It turns emails into tickets, uses AI to classify, prioritize, summarize, and route them, and drafts replies from a knowledge base. An agent approves every reply before it is sent.

The full scope, features, SLA, and decisions are in [project-scope.md](project-scope.md). Read it before planning or building a feature. If a request conflicts with the scope, point out the conflict instead of quietly deviating from it.

## Status

Planning stage. There is no code yet. Once the project is set up, add the build, run, test, and lint commands to this file.

Work follows the phases in [implementation-plan.md](implementation-plan.md), in order. Work on one phase at a time. When a task is done, mark its checkbox (`- [x]`). Do not start work from a later phase unless asked.

## Tech Stack

The stack is defined in [tech-stack.md](tech-stack.md). Stick to it, and ask before adding a new framework or major library.

- **Frontend:** React + TypeScript, Tailwind CSS, React Router
- **Backend:** Node.js + Express + TypeScript, with authentication through database sessions (not JWT)
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
