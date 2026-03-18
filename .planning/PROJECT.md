# PotPlanner v2

## What This Is

PotPlanner is a pot-based personal budgeting web app for household use. Users allocate income across named "pots" (categories), track bills, forecast finances, and manage debt — all from a single shared household login. Built as a self-hosted Docker application for a solo developer.

## Core Value

Household finances are always visible and under control: income flows into pots, bills are tracked, and the financial engine tells you exactly where you stand.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Scaffolding & DevOps**
- [ ] Rock-solid CLAUDE.md with project conventions, architecture decisions, and Claude Code workflow
- [ ] Project scaffolding: Next.js App Router + TypeScript, PostgreSQL, Redis, Docker Compose
- [ ] MCP integrations: Context7 (live docs), GitHub MCP (fix auth error), Playwright (E2E)
- [ ] CI/CD via GitHub Actions: lint, type-check, test, build on every PR
- [ ] Production deployment: Docker Compose with Nginx reverse proxy, self-hosted

**Auth**
- [ ] Shared household login (single JWT session, no per-user registration flow)
- [ ] JWT auth with Redis blacklist for logout/invalidation

**Core CRUD**
- [ ] Accounts management (bank accounts, balances)
- [ ] Pots (budget categories) — create, edit, delete, assign income
- [ ] Bills CRUD — amounts, due dates, associated pot, mark-as-paid
- [ ] Potless bills (bills not assigned to a pot)
- [ ] Joint bill percentage splits between household members

**Financial Engine**
- [ ] Income tracking and disposable income calculation
- [ ] Pot allocation engine — distribute income across pots
- [ ] Bill forecasting — upcoming bills projected forward
- [ ] Transfer history — log of all pot/account movements

**Debt & Savings**
- [ ] Debt tracking with avalanche and snowball payoff strategies
- [ ] Savings goals — target amounts, progress tracking

**Reporting & UX**
- [ ] Spending donut chart by pot/category
- [ ] Clearbit logo suggestions for bill payees
- [ ] Financial calculation engine with full unit test coverage (rebuild from original 48 tests)

### Out of Scope

- Per-person logins and individual views — shared session only for v1
- Mobile app — web-first
- OAuth / social login — household shared password is sufficient
- Real-time sync / websockets — not needed for personal use
- Multi-household / multi-tenant — personal self-hosted only

## Context

**Rebuild context:** Original PotPlanner was React + FastAPI + PostgreSQL + Redis with Docker Compose and Nginx. The financial engine had 48 unit tests. All features are being rebuilt from scratch in TypeScript.

**Stack decision:** Next.js full-stack (App Router) chosen over React+FastAPI to consolidate into one language, one codebase, one Docker container. PostgreSQL and Redis stay.

**Deployment:** Self-hosted via Docker Compose. Nginx reverse proxy in front. GitHub Actions for CI/CD from day one.

**Plugin ecosystem:** All Claude Code plugins and MCPs (superpowers, get-shit-done, pr-review-toolkit, playwright, context7, frontend-design, code-review, etc.) should be leveraged fully during development.

**Branding:** Primary colour `#7c3aed` (violet), triadic colour system carried over from v1.

## Constraints

- **Tech stack**: Next.js (App Router) + TypeScript — no Python, no separate backend container
- **Database**: PostgreSQL (stays) + Redis (stays) — no substitutions
- **Deployment**: Docker Compose, self-hosted — no managed cloud services
- **Auth**: Single shared household session — no multi-user registration for v1
- **Security**: JWT + Redis blacklist, proper input validation, no shortcuts — security is non-negotiable

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js full-stack over React+FastAPI | One language, one container, simpler solo maintenance | — Pending |
| Shared household session (no per-user auth) | Household use case doesn't need individual logins | — Pending |
| PostgreSQL + Redis retained | Proven in v1, Redis blacklist pattern works well | — Pending |
| TypeScript financial engine | Rebuilding 48-test engine in TS — type safety for calculations | — Pending |
| CI/CD from day one | Learned from v1 — quality gates before features | — Pending |

---
*Last updated: 2026-03-18 after initialization*
