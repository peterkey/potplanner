# Project Research Summary

**Project:** PotPlanner v2
**Domain:** Personal finance / pot-based (envelope) budgeting web app — single household, self-hosted
**Researched:** 2026-03-18
**Confidence:** MEDIUM-HIGH

## Executive Summary

PotPlanner v2 is a household budgeting app built around the envelope/pot metaphor — the same model that powers YNAB and Monzo. The recommended approach is a Next.js 15 App Router full-stack application backed by PostgreSQL (Drizzle ORM), Redis (JWT session management), and deployed via Docker Compose. The core architecture separates concerns into a pure financial calculation engine (`lib/engine/`), a DAL (`lib/dal/`), and thin API Route Handlers — with all data access gated through a `verifySession()` call at the DAL layer. This is the well-documented, opinionated pattern from the Next.js authentication guide and is the correct choice for a self-hosted, single-household app.

The feature set is well-scoped against the competitive landscape. PotPlanner's table-stakes features (pots, bills, income, disposable income, history) are standard, but its genuine differentiators — joint bill percentage splits, debt payoff strategies (avalanche/snowball), bill forecasting, and potless bills — are rare enough in self-hosted tools to be meaningful. The research identified 10 gaps in the currently planned v1 feature set that should be considered during requirements definition: notably, recurring bill auto-reset, rollover pot balances, overspend warnings, and basic search on transaction history.

Two risks dominate. First, floating-point arithmetic for money is a correctness time-bomb: all monetary values must be stored as integers (pence) and computed with `decimal.js`. This is a foundational schema decision — getting it wrong is expensive to fix. Second, the JWT authentication pattern requires a Redis blacklist for logout to mean anything; the Next.js proxy/middleware is only a redirect layer, not a security gate. Both pitfalls are well-understood and straightforwardly prevented if addressed from Phase 1.

---

## Key Findings

### Recommended Stack

The stack centres on Next.js 15 with TypeScript 5 on Node.js 22 LTS — already decided and confirmed correct. Drizzle ORM (over Prisma) is recommended for its SQL-first, TypeScript-native approach with no code generation step, which simplifies Docker builds and CI. Authentication is custom JWT using `jose` + `bcryptjs` — Auth.js is deliberately avoided because it's over-engineered for a single shared household login and works against the Redis blacklist pattern. UI is shadcn/ui + Tailwind CSS, which maps directly to PotPlanner's violet branding with zero customisation. Testing is Vitest (unit + integration) + Playwright (E2E), with Vitest being significantly faster than Jest for the financial engine's pure-function test suite.

**Core technologies:**
- **Next.js 15 (App Router):** Full-stack framework — single container deployment, Server Actions reduce API boilerplate
- **Drizzle ORM + postgres driver:** Database access — SQL-first, TypeScript-native, no code generation, correct choice for complex financial queries
- **jose + bcryptjs:** Custom JWT auth — right-sized for a single household session with Redis blacklist logout
- **Zod + React Hook Form:** Forms + validation — single schema used client and server; strict runtime validation for financial inputs
- **shadcn/ui + Tailwind CSS:** UI — components owned in-repo, violet theme preset matches branding, dashboard-oriented component set
- **Recharts:** Charts — integrates with shadcn's Chart component; covers donut and bar charts needed
- **decimal.js:** Financial arithmetic — mandatory; native JS floats are incorrect for money
- **ioredis:** Redis client — JWT blacklist, optional query caching, login rate limiting
- **Vitest + Playwright:** Testing — Vitest for fast unit/integration tests, Playwright for E2E with MCP integration

See `.planning/research/STACK.md` for full rationale and alternatives considered.

### Expected Features

The personal budgeting space is mature. Users arriving from YNAB or Monzo will have clear expectations. The differentiators are real but must be visible in the UI — debt strategies and joint splits buried in settings are wasted.

**Must have (table stakes — product feels incomplete without these):**
- Pots with balances (create, edit, delete, reorder, colour/icon)
- Income entry and pot allocation engine with unallocated residual display
- Bills CRUD with due dates, mark-as-paid, recurring cadence (not just monthly)
- Disposable income display (free cash after pots + bills + debts)
- Upcoming bills panel (next 30 days)
- Spending breakdown by pot (donut or bar chart)
- Transfer / transaction history with basic search and filter
- Mobile-responsive layout

**Should have (differentiators that justify the rebuild):**
- Joint bill percentage splits — rare; genuine edge for couples
- Debt tracking with avalanche/snowball strategies — clearly labelled
- Savings goals linked directly to pots
- Bill forecasting / cash-flow projection horizon
- Clearbit logo enrichment for payees (verify API availability; plan fallback)
- Potless bills — flexibility most apps don't offer
- Per-pot spend progress bar
- Overspend warnings per pot

**Nice to have (high value, lower urgency — defer to v2 unless scope allows):**
- Rollover/carry-forward pot balances
- Monthly budget cycle view (planned vs actual)
- Notes/memo on bills
- Recurring bill auto-reset per period
- "Committed spend vs free cash" explicit UI panel

**Defer indefinitely (anti-features):**
- Bank sync / open banking
- AI categorisation
- Push/email notifications
- Multi-tenant / multi-household

See `.planning/research/FEATURES.md` for full feature dependency graph and v1 gap analysis.

### Architecture Approach

The recommended architecture is a layered Next.js App Router application: RSC pages fetch data via a DAL (which always calls `verifySession()` first), Client Components call Route Handlers for mutations, and all financial logic lives in pure TypeScript functions in `lib/engine/` (no I/O, no async, 100% unit-testable). Two separate auth checks operate in parallel: proxy.ts does a stateless JWT signature check (fast, no Redis) for redirect behaviour, while `verifySession()` in the DAL checks the Redis blacklist on every authenticated data access. This two-layer approach is the pattern documented in the Next.js authentication guide.

**Major components:**
1. **proxy.ts** — Stateless JWT signature check; redirects unauthenticated users to `/login`; not a security gate
2. **lib/dal/** — Data Access Layer; calls `verifySession()` (Redis blacklist check) before every query; returns DTOs not raw rows
3. **lib/engine/** — Pure TypeScript financial functions (pot allocation, bill scheduling, surplus/deficit, projections); zero I/O, zero async
4. **lib/db/** — Drizzle ORM schema + migration runner; all monetary columns as `NUMERIC(12,2)` (display) with pence in application layer
5. **lib/session/** — JWT sign/verify (jose), cookie helpers, Redis blacklist operations
6. **app/api/** — Thin Route Handlers: validate (Zod) → call DAL → call engine if needed → return response
7. **Docker Compose** — app (Next.js standalone) + postgres:16-alpine + redis:7-alpine + nginx; health checks required

**Build order (dependency chain):**
```
Docker/Infra → DB Schema → Auth → Engine → DAL → API Routes → UI → Dashboard
```
The financial engine (pure functions) can be built in parallel with the auth system — this is the main parallelisation opportunity.

See `.planning/research/ARCHITECTURE.md` for full schema, data flow diagrams, API route organisation, and Docker Compose configuration.

### Critical Pitfalls

1. **Floating-point money arithmetic** — Store all monetary values as integer pence in the database (`NUMERIC(12,2)` for storage, pence in application layer). Use `decimal.js` for any arithmetic that crosses currency boundaries. Never use native JS `number` arithmetic on monetary values. Establish and enforce this in Phase 1 schema design; it is expensive to correct retroactively.

2. **Proxy/middleware as sole auth gate** — Next.js proxy/middleware is only a UX redirect layer. Server Actions and Route Handlers bypass it entirely. `verifySession()` in the DAL must be called on every authenticated data access. Enforce this as a code review checklist item from Phase 2 onward.

3. **JWT logout without token invalidation** — Stateless JWTs remain valid after logout unless blacklisted server-side. The Redis blacklist pattern (store JWT `jti` with TTL = remaining token lifetime on logout, check on every DAL call) is the correct solution. Must be implemented in Phase 2 alongside JWT issuance — not retrofitted later.

4. **Mutable running balances in the database** — Store an append-only transaction ledger and calculate balances with `SUM` queries. Never maintain a `current_balance` column updated by application code. This is a foundational schema decision; drift from this model causes reconciliation failures.

5. **Environment variable handling in Docker** — Never pass secrets (DATABASE_URL, JWT secrets) as Docker build args. Use `output: 'standalone'` in `next.config.js` so the server reads `process.env` at runtime. Inject all secrets via `docker-compose.yml` `environment:` at container start.

See `.planning/research/PITFALLS.md` for the full list of 17 pitfalls with phase-specific warnings.

---

## Implications for Roadmap

Based on the dependency chain identified in ARCHITECTURE.md and the phase-specific warnings in PITFALLS.md, the following phase structure is recommended. This is opinionated — later phases depend directly on earlier ones.

### Phase 1: Foundation — Project Scaffold, Schema, and Infrastructure

**Rationale:** Everything else depends on working infrastructure, a correct database schema, and an enforced `server-only` boundary. Floating-point money and mutable running balances are foundational schema mistakes that are expensive to fix later. The schema must be correct from the start.

**Delivers:** Runnable Docker Compose stack (Next.js + PostgreSQL + Redis + Nginx), Drizzle schema with migrations, CLAUDE.md with "MUST KNOW" rules, CI skeleton (GitHub Actions: lint, type-check, test, build stages), project structure with `server-only` guards on DAL/DB/session files.

**Addresses:** FEATURES.md table-stakes foundation (all features depend on schema)

**Avoids:** Pitfall 1 (float money — enforce integer pence in schema), Pitfall 5 (mutable balance — append-only transactions from the start), Pitfall 3 (secrets in Docker build args), Pitfall 8 (Docker health checks and startup order), Pitfall 6 (server-only guards), Pitfall 15 (focused CLAUDE.md)

### Phase 2: Authentication and Session Management

**Rationale:** Auth gates all app features. Cannot build any user-facing data access without it. The Redis blacklist pattern must be designed alongside JWT issuance — not added later.

**Delivers:** Login/logout flow, `jose` JWT with httpOnly cookie, Redis blacklist for logout invalidation, `verifySession()` DAL function with Redis check, rate limiting on login endpoint, proxy.ts redirect layer.

**Uses:** `jose`, `bcryptjs`, `ioredis`, DAL pattern, `server-only` directive

**Avoids:** Pitfall 2 (proxy as sole auth gate), Pitfall 4 (JWT logout without invalidation), Pitfall 12 (layouts don't re-run auth on navigation), Pitfall 14 (React Context for auth state)

### Phase 3: Financial Calculation Engine

**Rationale:** The engine is pure functions with no dependencies — it can be built in parallel with Phase 2 (the primary parallelisation opportunity). However, it must exist before the DAL can return meaningful financial data. Building it first with complete tests proves correctness before any data is wired up.

**Delivers:** `lib/engine/` module — pot allocation, bill scheduling, surplus/deficit calculation, cash-flow projections, debt strategy calculations (avalanche/snowball). Full Vitest unit test suite. Zero I/O, zero async.

**Addresses:** Core differentiators from FEATURES.md — disposable income, forecasting, debt strategies, joint split calculations

**Avoids:** Pitfall 17 (financial logic without boundary isolation), Pitfall 1 (float arithmetic — enforced in engine via decimal.js)

### Phase 4: Data Access Layer and API Routes

**Rationale:** DAL wraps the schema with auth guards; API routes expose it to the UI. These are prerequisite for any UI work. The thin Route Handler pattern must be established here.

**Delivers:** `lib/dal/` functions for accounts, pots, bills, transactions (each calling `verifySession()` first). REST-style API Route Handlers for all resources. Zod validators per resource. Integration tests against real PostgreSQL.

**Implements:** DAL + API layer from ARCHITECTURE.md component boundaries

**Avoids:** Pitfall 2 (all DAL functions gate on verifySession), Pitfall 4 (thin Route Handlers), Pitfall 11 (explicit connection pool sizing in DATABASE_URL)

### Phase 5: Core UI — Pots, Bills, Accounts, Transactions

**Rationale:** Table-stakes features that make the app functional. Must be complete before dashboard summary is meaningful. This is the largest UI phase — mobile responsiveness must be designed in from the start, not retrofitted.

**Delivers:** RSC pages + Client Components for: pots (create/edit/delete/reorder), bills (CRUD, mark-as-paid, recurring cadence), accounts, transaction history (with search/filter), income entry, upcoming bills panel. Mobile-responsive layout throughout.

**Addresses:** Must-have features from FEATURES.md (pots, bills, income, history, upcoming bills, mobile layout)

**Avoids:** Pitfall 7 (stale caching — `revalidatePath` in all mutating Server Actions), Pitfall 10 (Server Actions without ownership verification), Pitfall 13 (third-party UI component `use client` wrapping)

### Phase 6: Dashboard, Analytics, and Differentiating Features

**Rationale:** Requires transactions + pots + bills data to exist. This is where engine output surfaces in the UI and the differentiators become visible to users.

**Delivers:** Dashboard summary (disposable income, pot health, upcoming bills, spending donut), per-pot progress bars, debt tracking with avalanche/snowball UI, savings goals linked to pots, joint bill percentage splits, bill forecasting/projection, Clearbit logo enrichment, overspend warnings, "committed vs free cash" display.

**Addresses:** Should-have and nice-to-have features from FEATURES.md (all differentiators)

**Avoids:** Pitfall 7 (dashboard caching — aggregate data must be fresh)

### Phase 7: Production Hardening and Deployment

**Rationale:** Finalises infrastructure for actual use. CI/CD must be correct before trusting deployments.

**Delivers:** Multi-stage Dockerfile with Next.js standalone output (~150MB image), production Docker Compose with Nginx, GitHub Actions full pipeline (lint → type-check → test → build → docker push to GHCR), environment variable documentation (`.env.example`), Playwright E2E test suite for critical flows.

**Avoids:** Pitfall 3 (secrets in build args), Pitfall 9 (CI cache invalidation with `hashFiles()` keys)

---

### Phase Ordering Rationale

- **Schema before auth before data:** You cannot write secure queries without auth, and you cannot write correct auth without a users table. The dependency chain is strict.
- **Engine before DAL:** The engine's correctness is proven by pure unit tests before it is wired to real data. This prevents discovering arithmetic bugs via UI integration.
- **Core UI before dashboard:** The dashboard aggregates data across all resources. Building it on top of incomplete data access produces misleading results.
- **Infrastructure early:** Docker Compose and CI skeleton in Phase 1 means the entire team works in a known, reproducible environment from the first day.

### Research Flags

Phases likely needing deeper research or careful implementation decisions:

- **Phase 3 (Financial Engine):** Debt strategy calculations (avalanche vs snowball ordering with minimum payments) and bill forecasting with variable pay cycles have edge cases worth modelling carefully before writing code. The engine is pure functions — prototype and test exhaustively before integrating.
- **Phase 6 (Clearbit integration):** Clearbit's free logo API status should be verified before building the feature. Plan a fallback (initials/placeholder) from the start.
- **Phase 7 (CI/CD Docker push):** GitHub Container Registry configuration and multi-platform build (`buildx`) setup should be confirmed against current GitHub Actions documentation before wiring up the pipeline.

Phases with well-established patterns (standard implementation, skip research-phase):

- **Phase 1 (Scaffold + Docker):** Next.js standalone output + Docker Compose is the documented official pattern with published Dockerfiles. HIGH confidence.
- **Phase 2 (Auth):** The jose + Redis blacklist pattern is explicitly documented in the Next.js authentication guide. HIGH confidence.
- **Phase 4 (DAL + API Routes):** The DAL/thin-Route-Handler pattern is directly from Next.js official docs. HIGH confidence.
- **Phase 5 (shadcn/ui):** shadcn components are well-documented with copy-paste patterns. No research needed.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Core choices (Next.js, TypeScript, shadcn, Vitest, Playwright) are HIGH confidence. Drizzle version numbers, Recharts v2/v3 migration status, and ioredis v5 maintenance should be verified on npm before locking in. |
| Features | MEDIUM | Based on training knowledge of YNAB/Monzo/Actual Budget (cutoff Aug 2025). Personal budgeting feature landscape is mature and stable — unlikely to have shifted by Mar 2026. No live verification was possible. |
| Architecture | HIGH | Directly sourced from Next.js official documentation (v16.1.7, verified in PITFALLS.md research). The DAL, proxy, Redis blacklist, and standalone Docker patterns are all officially documented. |
| Pitfalls | HIGH | Mix of official Next.js docs (auth, caching, middleware), OWASP JWT guidance, and well-established fintech domain patterns (cents-as-integer, append-only ledger). |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Drizzle ORM version:** `^0.36` / `drizzle-kit ^0.27` should be verified on npmjs.com before starting — Drizzle moves fast. Use latest stable.
- **Recharts v2 vs v3:** Confirm whether Recharts v3 has released and whether the shadcn `Chart` component integration has been updated accordingly.
- **ioredis v5 maintenance status:** Verify ioredis v5 is actively maintained; if not, `node-redis v4` is a valid drop-in alternative with near-identical API for this use case.
- **Clearbit logo API availability:** The Clearbit free logo API should be confirmed before building that feature; plan a fallback (initial-based avatar or placeholder icon) from the start.
- **Bill cadence edge cases:** Weekly and annual bill scheduling has calendar edge cases (week boundaries, leap years) that the financial engine tests should cover explicitly.
- **`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`:** Required when using Server Actions in multi-instance Docker deployments. Must be set consistently. Include in `.env.example`.

---

## Sources

### Primary (HIGH confidence)
- Next.js official docs v16.1.7 (March 2026) — authentication guide, caching, proxy/middleware, self-hosting, server/client components, testing
- ARCHITECTURE.md research — directly cites Next.js docs with verified URLs
- PITFALLS.md research — Next.js auth guide, MDN, Node.js security docs, OWASP JWT guidance

### Secondary (MEDIUM confidence)
- Training knowledge (cutoff Aug 2025) — Drizzle ORM ecosystem, shadcn/ui community consensus, Vitest adoption in Next.js community
- Feature landscape analysis — YNAB, Monzo, Actual Budget, Emma, Copilot Money product knowledge from training data
- Redis blacklist/caching patterns — standard industry patterns, multiple documentation sources

### Tertiary (LOW confidence — verify before use)
- Drizzle ORM version numbers (`^0.36`, `drizzle-kit ^0.27`) — verify on npm
- Recharts v3 migration status — verify on npmjs.com / Recharts GitHub
- ioredis v5 maintenance status — verify on GitHub

---
*Research completed: 2026-03-18*
*Ready for roadmap: yes*
