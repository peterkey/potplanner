# Roadmap: PotPlanner v2

## Overview

PotPlanner v2 rebuilds the household budgeting app from scratch in TypeScript. The build order is strict: infrastructure and schema decisions that are expensive to undo come first (integer pence, append-only ledger), auth gates everything, the financial engine is proven pure before wiring, then features ship as vertical slices (accounts/pots, bills, history/reporting, debt/savings), and the dashboard unifies everything at the end. CI/CD and Playwright infrastructure run in parallel with auth to keep quality gates active from the start.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Project scaffold, Docker Compose stack, Drizzle schema with integer pence and append-only ledger, CLAUDE.md, MCP configuration (completed 2026-03-18)
- [ ] **Phase 2: CI/CD and Test Infrastructure** - GitHub Actions pipeline (lint, type-check, test, build) and Playwright E2E infrastructure wired to CI
- [ ] **Phase 3: Authentication** - Shared household login, JWT with httpOnly cookie, Redis blacklist logout, rate limiting, DAL session guard
- [ ] **Phase 4: Financial Engine** - Pure TypeScript engine (lib/engine/) — income, disposable income, pot allocation, bill forecasting, full Vitest suite
- [ ] **Phase 5: Accounts and Pots** - DAL + API + UI for bank accounts and budget pots with income allocation
- [ ] **Phase 6: Bills** - DAL + API + UI for bills CRUD, recurring cadence, potless bills, joint splits, upcoming bills panel
- [ ] **Phase 7: Transfer History and Reporting** - Transfer history log with filtering, spending donut chart, Clearbit payee logos
- [ ] **Phase 8: Debt Tracking and Savings Goals** - Debt entries with avalanche/snowball strategies and payoff projections; savings goals linked to pots
- [ ] **Phase 9: Dashboard and UX Polish** - Mobile responsiveness across all pages, violet theme via shadcn, unified dashboard bringing all data together

## Phase Details

### Phase 1: Foundation
**Goal**: The project runs locally and in Docker, the schema is correct and migration-controlled, and CLAUDE.md enshrines the rules that cannot be broken later
**Depends on**: Nothing (first phase)
**Requirements**: SCAF-01, SCAF-02, SCAF-03, SCAF-05, SCAF-06
**Success Criteria** (what must be TRUE):
  1. `docker compose up` starts Next.js app, PostgreSQL, Redis, and Nginx with all health checks passing
  2. Drizzle migrations run against a fresh database with zero errors and all monetary columns use integer pence
  3. CLAUDE.md exists at repo root and contains architecture decisions, integer pence rule, append-only ledger rule, and `verifySession()` convention
  4. Context7 MCP is configured and GitHub MCP auth error is resolved and documented
  5. The codebase compiles with `tsc --noEmit` and the `server-only` boundary is enforced on DAL/DB/session files
**Plans:** 4/4 plans complete
Plans:
- [ ] 01-01-PLAN.md — Scaffold Next.js 16 with dependencies, directory structure, shadcn/ui violet theme, Vitest config
- [ ] 01-02-PLAN.md — Drizzle schema (8 tables, integer pence), DB client, migration tooling, .env setup
- [ ] 01-03-PLAN.md — Docker infrastructure (Dockerfile, Compose prod/dev, Nginx, .dockerignore)
- [ ] 01-04-PLAN.md — CLAUDE.md with all architecture rules, MCP configuration

### Phase 2: CI/CD and Test Infrastructure
**Goal**: Every push triggers automated quality gates and Playwright E2E tests can run against the application
**Depends on**: Phase 1
**Requirements**: SCAF-04, SCAF-07
**Success Criteria** (what must be TRUE):
  1. A pull request triggers GitHub Actions: lint, type-check, Vitest unit tests, and Next.js build all run and must pass before merge
  2. Playwright is installed and configured; a smoke test navigates to the app and asserts the page loads
  3. CI uses `hashFiles()` cache keys so dependency installs are cached correctly across runs
**Plans**: TBD

### Phase 3: Authentication
**Goal**: The household can securely log in and log out, and no data is accessible without a valid session
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06
**Success Criteria** (what must be TRUE):
  1. User can log in with the household email and password and is redirected to the app
  2. Refreshing the browser keeps the user logged in (JWT stored in httpOnly cookie persists across browser sessions)
  3. Logging out invalidates the token via the Redis blacklist — a previously-captured cookie cannot be reused after logout
  4. Navigating to any app route while unauthenticated redirects to the login page
  5. More than 5 failed login attempts in a short window returns a 429 rate-limit response
  6. Every DAL function calls `verifySession()` before touching the database (proxy.ts is redirect-only, not a security gate)
**Plans**: TBD

### Phase 4: Financial Engine
**Goal**: The core financial calculations are proven correct in isolation, ready to be wired to real data
**Depends on**: Phase 1
**Requirements**: ENG-01, ENG-02, ENG-03, ENG-05, ENG-06
**Success Criteria** (what must be TRUE):
  1. `lib/engine/` contains pure TypeScript functions (zero I/O, zero async) for: income entry, disposable income calculation, pot allocation, bill scheduling, and N-month cash-flow projection
  2. All monetary arithmetic uses integer pence and decimal.js — no native JS float arithmetic on monetary values anywhere in the engine
  3. Vitest unit test suite exceeds 48 tests and covers edge cases including weekly/annual bill cadences and minimum-payment debt scenarios
  4. Running `vitest run` in CI passes with zero failures
**Plans**: TBD

### Phase 5: Accounts and Pots
**Goal**: Users can manage their bank accounts and budget pots, allocate income, and see pot balances
**Depends on**: Phase 3, Phase 4
**Requirements**: ACCT-01, ACCT-02, ACCT-03, POT-01, POT-02, POT-03, POT-04, POT-05
**Success Criteria** (what must be TRUE):
  1. User can create, edit, and delete bank accounts; account balances and a total balance are visible on screen
  2. User can create, edit, and delete budget pots and assign an income allocation amount to each
  3. Pot balance (allocated minus spent) is displayed per pot and updates when bills are marked paid
  4. Pots reset to zero at the start of each month (zero-based budgeting); rollover field exists in the schema for v2
  5. All DAL functions for accounts and pots call `verifySession()` before executing any query
**Plans**: TBD

### Phase 6: Bills
**Goal**: Users can track all bills, see what is upcoming, and the engine knows which bills belong to which pot
**Depends on**: Phase 5
**Requirements**: BILL-01, BILL-02, BILL-03, BILL-04, BILL-05, BILL-06, BILL-07
**Success Criteria** (what must be TRUE):
  1. User can create, edit, and delete bills with name, amount, due date, and frequency (weekly, biweekly, 4-weekly, monthly, annual)
  2. User can assign a bill to a pot or mark it as potless; potless bills appear in a separate section
  3. User can mark a bill as paid or unpaid within the current cycle
  4. User can set a joint split percentage (e.g. 60% / 40%) on any bill
  5. An upcoming bills panel shows all bills due in the next 30 days, projected from each bill's frequency
**Plans**: TBD

### Phase 7: Transfer History and Reporting
**Goal**: Users can see a full audit trail of movements and understand their spending by category
**Depends on**: Phase 5, Phase 6
**Requirements**: ENG-04, RPT-01, RPT-02, RPT-03
**Success Criteria** (what must be TRUE):
  1. Every pot and account movement is recorded in an append-only transfer history ledger with timestamp and description
  2. Transfer history is viewable in the UI and can be filtered by date range
  3. A spending donut chart displays the current month's breakdown by pot/category
  4. Bill payee logos are fetched via Clearbit and displayed next to each bill; a favicon or initial-based placeholder is shown when Clearbit returns no result
**Plans**: TBD

### Phase 8: Debt Tracking and Savings Goals
**Goal**: Users can track debts with payoff strategies and savings goals linked to pots
**Depends on**: Phase 5, Phase 4
**Requirements**: DEBT-01, DEBT-02, DEBT-03, DEBT-04, SAV-01, SAV-02, SAV-03
**Success Criteria** (what must be TRUE):
  1. User can add, edit, and delete debt entries (name, balance, interest rate, minimum payment)
  2. Avalanche strategy (highest interest first) and snowball strategy (lowest balance first) are both calculated and displayed with clearly labelled payoff order
  3. A month-by-month payoff timeline is projected for each strategy
  4. User can create savings goals with a name, target amount, and optional link to a pot
  5. Progress toward each savings goal is visible (amount saved vs target)
**Plans**: TBD

### Phase 9: Dashboard and UX Polish
**Goal**: Every page is usable on a phone and the dashboard gives an at-a-glance picture of household finances
**Depends on**: Phase 7, Phase 8
**Requirements**: UX-01, UX-02
**Success Criteria** (what must be TRUE):
  1. All pages render without horizontal scroll on a 375px-wide viewport (iPhone SE equivalent)
  2. The UI uses primary colour `#7c3aed` (violet) with the triadic colour system applied via shadcn/ui theming throughout
  3. A dashboard page surfaces: disposable income, pot health summary, upcoming bills, spending donut, and debt overview in a single view
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9

Note: Phase 2 (CI/CD) and Phase 3 (Auth) can proceed in parallel after Phase 1. Phase 4 (Engine) can proceed in parallel with Phase 3 (Auth) since it has no auth dependency.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 4/4 | Complete   | 2026-03-18 |
| 2. CI/CD and Test Infrastructure | 0/TBD | Not started | - |
| 3. Authentication | 0/TBD | Not started | - |
| 4. Financial Engine | 0/TBD | Not started | - |
| 5. Accounts and Pots | 0/TBD | Not started | - |
| 6. Bills | 0/TBD | Not started | - |
| 7. Transfer History and Reporting | 0/TBD | Not started | - |
| 8. Debt Tracking and Savings Goals | 0/TBD | Not started | - |
| 9. Dashboard and UX Polish | 0/TBD | Not started | - |
