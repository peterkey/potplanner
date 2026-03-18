# Requirements: PotPlanner v2

**Defined:** 2026-03-18
**Core Value:** Household finances are always visible and under control — income flows into pots, bills are tracked, and the financial engine tells you exactly where you stand.

## v1 Requirements

### Scaffolding & DevOps

- [x] **SCAF-01**: Project is scaffolded with Next.js App Router + TypeScript, Drizzle ORM, shadcn/ui, and correct Docker Compose setup (`output: 'standalone'`)
- [ ] **SCAF-02**: CLAUDE.md exists with project conventions, architecture decisions, security rules, and Claude Code workflow guidance
- [x] **SCAF-03**: Docker Compose runs app + PostgreSQL + Redis + Nginx with health checks and correct startup order
- [ ] **SCAF-04**: GitHub Actions CI/CD runs lint, type-check, Vitest unit tests, and build on every push/PR
- [ ] **SCAF-05**: Context7 MCP configured; GitHub MCP auth error resolved and documented
- [x] **SCAF-06**: Drizzle schema and migration tooling configured with integer pence columns and append-only ledger pattern
- [ ] **SCAF-07**: Playwright E2E test infrastructure configured and connected to CI/CD

### Authentication

- [ ] **AUTH-01**: User can log in with email and password via shared household login
- [ ] **AUTH-02**: User session persists across browser refresh (JWT stored in httpOnly cookie)
- [ ] **AUTH-03**: User can log out; token is invalidated via Redis blacklist
- [ ] **AUTH-04**: All app routes are protected — unauthenticated requests redirect to login
- [ ] **AUTH-05**: Login is rate-limited to prevent brute force
- [ ] **AUTH-06**: `verifySession()` is called in the DAL on every data access (proxy layer is redirect only, not a security gate)

### Accounts

- [ ] **ACCT-01**: User can create, edit, and delete bank accounts
- [ ] **ACCT-02**: User can set and update account balance
- [ ] **ACCT-03**: User can view all accounts with individual and total balances

### Pots

- [ ] **POT-01**: User can create, edit, and delete pots (budget categories)
- [ ] **POT-02**: User can allocate an income amount to each pot
- [ ] **POT-03**: User can view pot balance (allocated minus spent)
- [ ] **POT-04**: Pots reset to zero at the start of each month (zero-based budgeting)
- [ ] **POT-05**: Schema includes rollover field per pot (carry-forward ready for v2, UI deferred)

### Bills

- [ ] **BILL-01**: User can create, edit, and delete bills
- [ ] **BILL-02**: Bills support frequency: weekly, biweekly, 4-weekly, monthly, annual
- [ ] **BILL-03**: User can assign a bill to a pot or mark it as potless
- [ ] **BILL-04**: User can mark a bill as paid or unpaid within the current cycle
- [ ] **BILL-05**: User can set joint split percentages on a bill (household member A% / B%)
- [ ] **BILL-06**: User can view an upcoming bills panel (next 30 days projected from bill frequency)
- [ ] **BILL-07**: Potless bills are tracked and displayed separately from pot-assigned bills

### Financial Engine

- [ ] **ENG-01**: User can set total monthly income
- [ ] **ENG-02**: Disposable income is calculated (income − pot allocations − bills)
- [ ] **ENG-03**: Financial forecast projects income, bills, and pot balances forward N months
- [ ] **ENG-04**: Transfer history logs all pot/account movements with timestamps
- [ ] **ENG-05**: Financial engine is implemented as pure TypeScript functions in `lib/engine/` with integer pence arithmetic
- [ ] **ENG-06**: Engine has full unit test coverage via Vitest (target: rebuild and exceed original 48 tests)

### Debt Tracking

- [ ] **DEBT-01**: User can add, edit, and delete debt entries (name, balance, interest rate, minimum payment)
- [ ] **DEBT-02**: Avalanche payoff strategy is calculated and displayed (highest interest rate first)
- [ ] **DEBT-03**: Snowball payoff strategy is calculated and displayed (lowest balance first)
- [ ] **DEBT-04**: Debt payoff timeline is projected with month-by-month breakdown

### Savings Goals

- [ ] **SAV-01**: User can create savings goals with a name and target amount
- [ ] **SAV-02**: User can track progress toward each savings goal
- [ ] **SAV-03**: User can link a savings goal to a pot

### Reporting & UX

- [ ] **RPT-01**: Spending donut chart displays breakdown by pot/category for the current month
- [ ] **RPT-02**: Transfer history is viewable with filtering by date range
- [ ] **RPT-03**: Bill payee logos are fetched via Clearbit with favicon fallback
- [ ] **UX-01**: All pages are mobile-responsive (usable on phone without horizontal scroll)
- [ ] **UX-02**: UI uses primary colour `#7c3aed` (violet) with triadic colour system via shadcn/ui theming

## v2 Requirements

### Enhanced Pots

- **POT-V2-01**: Per-pot rollover setting — user can opt individual pots into carry-forward behaviour

### Multi-User

- **AUTH-V2-01**: Per-person logins with individual views within shared household data

### Reporting

- **RPT-V2-01**: Monthly budget report (PDF or CSV export)
- **RPT-V2-02**: Year-to-date spending summary

### Integrations

- **INT-V2-01**: Brandfetch API as primary logo source (if Clearbit unavailable)
- **INT-V2-02**: Bill reminder notifications (email or push)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Bank sync / Open Banking | Enormous complexity, self-hosted privacy trade-off — users accept manual entry |
| OAuth / social login | Shared household password is sufficient for v1 |
| Mobile app (native) | Web-first; responsive web covers mobile use |
| Multi-household / multi-tenant | Personal self-hosted tool only |
| Real-time sync / websockets | Not needed for personal household use |
| Multi-currency | Single-currency household budgeting only |
| Reporting to external services | Self-contained, no data egress |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCAF-01 | Phase 1 — Foundation | Complete |
| SCAF-02 | Phase 1 — Foundation | Pending |
| SCAF-03 | Phase 1 — Foundation | Complete |
| SCAF-05 | Phase 1 — Foundation | Pending |
| SCAF-06 | Phase 1 — Foundation | Complete |
| SCAF-04 | Phase 2 — CI/CD and Test Infrastructure | Pending |
| SCAF-07 | Phase 2 — CI/CD and Test Infrastructure | Pending |
| AUTH-01 | Phase 3 — Authentication | Pending |
| AUTH-02 | Phase 3 — Authentication | Pending |
| AUTH-03 | Phase 3 — Authentication | Pending |
| AUTH-04 | Phase 3 — Authentication | Pending |
| AUTH-05 | Phase 3 — Authentication | Pending |
| AUTH-06 | Phase 3 — Authentication | Pending |
| ENG-01 | Phase 4 — Financial Engine | Pending |
| ENG-02 | Phase 4 — Financial Engine | Pending |
| ENG-03 | Phase 4 — Financial Engine | Pending |
| ENG-05 | Phase 4 — Financial Engine | Pending |
| ENG-06 | Phase 4 — Financial Engine | Pending |
| ACCT-01 | Phase 5 — Accounts and Pots | Pending |
| ACCT-02 | Phase 5 — Accounts and Pots | Pending |
| ACCT-03 | Phase 5 — Accounts and Pots | Pending |
| POT-01 | Phase 5 — Accounts and Pots | Pending |
| POT-02 | Phase 5 — Accounts and Pots | Pending |
| POT-03 | Phase 5 — Accounts and Pots | Pending |
| POT-04 | Phase 5 — Accounts and Pots | Pending |
| POT-05 | Phase 5 — Accounts and Pots | Pending |
| BILL-01 | Phase 6 — Bills | Pending |
| BILL-02 | Phase 6 — Bills | Pending |
| BILL-03 | Phase 6 — Bills | Pending |
| BILL-04 | Phase 6 — Bills | Pending |
| BILL-05 | Phase 6 — Bills | Pending |
| BILL-06 | Phase 6 — Bills | Pending |
| BILL-07 | Phase 6 — Bills | Pending |
| ENG-04 | Phase 7 — Transfer History and Reporting | Pending |
| RPT-01 | Phase 7 — Transfer History and Reporting | Pending |
| RPT-02 | Phase 7 — Transfer History and Reporting | Pending |
| RPT-03 | Phase 7 — Transfer History and Reporting | Pending |
| DEBT-01 | Phase 8 — Debt Tracking and Savings Goals | Pending |
| DEBT-02 | Phase 8 — Debt Tracking and Savings Goals | Pending |
| DEBT-03 | Phase 8 — Debt Tracking and Savings Goals | Pending |
| DEBT-04 | Phase 8 — Debt Tracking and Savings Goals | Pending |
| SAV-01 | Phase 8 — Debt Tracking and Savings Goals | Pending |
| SAV-02 | Phase 8 — Debt Tracking and Savings Goals | Pending |
| SAV-03 | Phase 8 — Debt Tracking and Savings Goals | Pending |
| UX-01 | Phase 9 — Dashboard and UX Polish | Pending |
| UX-02 | Phase 9 — Dashboard and UX Polish | Pending |

**Coverage:**
- v1 requirements: 46 total
- Mapped to phases: 46
- Unmapped: 0

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 — traceability updated after roadmap creation*
