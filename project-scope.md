# HelpDesk — Project Scope

## Problem

We receive hundreds of support emails from students every day. Agents read, classify, and answer each ticket by hand. This is slow, response times are long, and replies often sound impersonal and canned. There is also no central place to track who is working on what, so tickets get missed or handled twice.

## Solution

Build a ticket management system that uses AI to classify, summarize, and route support tickets automatically, and to draft replies that agents approve with one click. Students get faster, more personal responses, and agents have more time for complex issues.

## Goals & Success Metrics

- Average first-response time under 2 business hours
- At least 60% of AI drafts are sent unchanged or with only minor edits
- AI classification accuracy of at least 90% (measured by how often agents change the category)
- At least 95% of tickets meet their SLA (see [SLA](#sla))

## Users & Roles

- **Student (customer):** sends emails and receives replies. Does not log into the system (in MVP).
- **Agent:** sees and works on tickets, reviews and edits AI replies, sends responses, and changes ticket status.
- **Admin:** has everything an agent has, plus user management, knowledge base management, categories, and system settings.

## Features

### Ticket intake
- Receive support emails (inbound email webhook or mailbox polling) and create tickets automatically
- Thread replies: a reply from a student on an existing conversation is added to the same ticket instead of creating a new one
- Store the sender, subject, body, and attachments (max 10 MB per email)
- Ignore auto-replies (out-of-office, bounces) and filter spam

### Ticket management
- Ticket list with filtering (status, category, priority, assignee, date) and sorting, paginated
- Search by subject, body, or sender email
- Ticket detail view with the full conversation history
- Ticket statuses: `Open` → `In Progress` → `Resolved` → `Closed`
  - A `Resolved` ticket closes automatically after 7 days without a reply from the student
  - A student reply on a `Resolved` or `Closed` ticket reopens it (`Open`)
- Assign tickets to agents. Agents can take a ticket from the queue, and admins can assign or reassign tickets.
- Internal notes on a ticket (visible only to agents)

### AI features
- **Classification:** assign one of these categories: Technical, Billing, Course Content, Account, Refund, Other
- **Priority:** assign a priority (Low, Normal, High, Urgent). Agents can change it.
- **Summaries:** a short summary of the ticket and conversation on the detail view
- **Suggested replies:** AI writes a draft reply from the knowledge base; the agent can edit, accept, or reject it
- **No auto-send in MVP:** every AI reply is a draft that an agent must approve before it is sent. Automatic sending for high-confidence cases may be added after launch, once accuracy is proven.
- **Languages:** students may write in English or Croatian/Serbian. The AI writes the draft in the student's language, based on the English knowledge base. The detail view shows the summary in English, so any agent can handle the ticket.
- **Routing:** each category is mapped to a team (set by an admin). A new ticket lands in that team's queue, unassigned.
- Agents can override the AI category and priority; corrections are logged so accuracy can be measured

### Knowledge base
- Admins can create, edit, and delete knowledge base articles (FAQ, policies, course info)
- Articles are written in English only
- The AI uses only the knowledge base when it writes replies, so it does not invent answers
- When the knowledge base does not contain an answer, the AI flags the ticket for an agent instead of guessing
- Existing FAQ content is imported once at launch to seed the knowledge base

### Outbound email
- Send replies to the student by email from the system, keeping the original email thread (`In-Reply-To` / `References` headers)

### User management (admin only)
- Create, edit, and deactivate agent and admin accounts
- Assign roles and teams

### Authentication
- Login for agents and admins
- Role-based access control

### Dashboard
- Ticket counts by status, category, and priority
- Average first-response and resolution times
- AI draft acceptance rate (sent unchanged, edited, or rejected)
- Unassigned tickets and tickets at risk of missing their SLA

## SLA

Measured in business hours (Mon–Fri, 09:00–17:00), from when the ticket is created until the agent sends the first reply.

| Priority | First response |
|----------|----------------|
| Urgent   | 2 hours        |
| High     | 4 hours        |
| Normal   | 1 business day |
| Low      | 2 business days |

Tickets that are close to missing their SLA are highlighted in the ticket list and on the dashboard.

## Non-Functional Requirements

- **Localization:** the agent and admin UI is in English only
- **Security:** secure authentication, password hashing, HTTPS, and protection of students' personal data (GDPR)
- **Data retention:** closed tickets are kept for 2 years, then anonymized (the student's email and name are removed). A student's data is deleted on request.
- **Reliability:** no email may be lost; failed AI or email calls must be retried, with a fallback to manual handling
- **Performance:** the ticket list loads quickly even with tens of thousands of tickets (pagination)
- **Auditability:** log who sent what and when, and which replies were AI-generated
- **Cost control:** monitor AI API usage and cost per ticket

## Out of Scope (MVP)

- Student self-service portal and login
- Channels other than email (live chat, social media, phone)
- Knowledge base and UI in languages other than English
- Ticket languages other than English and Croatian/Serbian
- Automatic sending of AI replies without agent approval
- Importing historical tickets from the current inbox
- Mobile app
- Integrations with external CRM systems

## Tech Stack

See [tech-stack.md](tech-stack.md).

## Risks

- The AI writes an incorrect or inappropriate answer. **Mitigation:** an agent approves every reply before it is sent, and replies are based only on the knowledge base.
- Croatian/Serbian replies built from the English knowledge base are worded poorly or translated inaccurately. **Mitigation:** the agent reviews every draft; track edit rates by language.
- Spam and automated emails (out-of-office, bounces) create junk tickets. **Mitigation:** spam filtering and ignoring auto-replies.
- Knowledge base content goes stale, so AI replies become outdated. **Mitigation:** show the last-updated date on each article and review articles regularly.
