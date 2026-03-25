---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: completed
stopped_at: Completed 04-financial-engine 04-01-PLAN.md
last_updated: "2026-03-25T10:21:21.187Z"
last_activity: 2026-03-18 — Phase 1 Plan 4 complete (CLAUDE.md + MCP config)
progress:
  total_phases: 9
  completed_phases: 3
  total_plans: 12
  completed_plans: 10
  percent: 44
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-18)

**Core value:** Household finances are always visible and under control — income flows into pots, bills are tracked, and the financial engine tells you exactly where you stand.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 9 (Foundation)
Plan: 4 of 4 in current phase (all Phase 1 plans complete)
Status: Phase 1 complete — ready for Phase 2 (CI/CD)
Last activity: 2026-03-18 — Phase 1 Plan 4 complete (CLAUDE.md + MCP config)

Progress: [████░░░░░░] 44%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
| Phase 01-foundation P01 | 11 | 2 tasks | 18 files |
| Phase 01-foundation P02 | 2 | 2 tasks | 6 files |
| Phase 01-foundation P03 | 2 | 2 tasks | 5 files |
| Phase 01-foundation P04 | 3 | 2 tasks | 4 files |
| Phase 02-ci-cd-and-test-infrastructure P01 | 4 | 1 tasks | 4 files |
| Phase 02-ci-cd-and-test-infrastructure P02 | 7 | 2 tasks | 5 files |
| Phase 03-authentication P01 | 208 | 2 tasks | 7 files |
| Phase 03-authentication P02 | 3 | 2 tasks | 5 files |
| Phase 03-authentication P03 | 134 | 2 tasks | 7 files |
| Phase 04-financial-engine P01 | 3 | 2 tasks | 6 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Phase 1]: All monetary columns use integer pence — foundational, cannot be retrofitted
- [Phase 1]: Append-only ledger pattern for balances — never maintain a mutable `current_balance` column
- [Phase 3]: proxy.ts is a redirect-only layer; `verifySession()` in the DAL is the real security gate
- [Phase 3]: Redis blacklist for JWT invalidation — must be designed alongside JWT issuance, not added later
- [Phase 01-foundation]: shadcn init chose Nova preset (Radix/Lucide/Geist); violet theme applied via CSS variable override independent of baseColor
- [Phase 01-foundation]: create-next-app scaffolded in temp dir (PotPlanner/ directory name violates npm naming rules)
- [Phase 01-foundation]: output: standalone in next.config.ts set as first configuration change — non-negotiable for Docker image optimisation
- [Phase 01-foundation]: integer pence for all monetary columns (integer type maps to PostgreSQL INTEGER 32-bit, max ~21M pence); interest_rate stored in basis points (2500 = 25.00%)
- [Phase 01-foundation]: transfer_history is append-only by design — rows NEVER updated or deleted; balances always derived from ledger entries, never maintained as mutable column
- [Phase 01-foundation]: .gitignore fixed: .env* wildcard replaced with explicit patterns so .env.example can be committed while .env remains gitignored
- [Phase 01-foundation]: Dockerfile uses ARG NODE_VERSION=24-slim so all three stages share the same base image version via single point of control
- [Phase 01-foundation]: Dev compose targets dependencies stage only — no production build overhead; source mounted via volume for hot-reload
- [Phase 01-foundation]: CLAUDE.md enshrines integer pence, append-only ledger, verifySession() in DAL, server-only boundaries, proxy.ts redirect-only rule
- [Phase 01-foundation]: GitHub MCP requires classic PAT (ghp_) not fine-grained token; .mcp.json gitignored; .mcp.json.example committed as template
- [Phase 02-ci-cd-and-test-infrastructure]: Use eslint@9 not eslint@10: eslint-plugin-react@7.37.x (bundled in eslint-config-next) calls context.getFilename() removed in ESLint 10; ESLint 9 is the compatible version
- [Phase 02-ci-cd-and-test-infrastructure]: Set settings.react.version to fixed string in eslint.config.mjs to prevent eslint-plugin-react from calling detectReactVersion which uses the removed getFilename API
- [Phase 02-ci-cd-and-test-infrastructure]: Add passWithNoTests: true to vitest.config.mts so vitest run exits 0 when no test files exist (CI must pass before tests are written)
- [Phase 02-ci-cd-and-test-infrastructure]: Playwright webServer uses node .next/standalone/server.js with PORT/HOSTNAME — output:standalone incompatible with npm run start
- [Phase 02-ci-cd-and-test-infrastructure]: E2E smoke test navigates directly to /login since proxy.ts not yet present; redirect assertion deferred to Phase 3
- [Phase 02-ci-cd-and-test-infrastructure]: Chromium + Firefox only in Playwright projects; no WebKit — too flaky on Linux CI runners
- [Phase 03-authentication]: Use @vitest-environment node in session.test.ts for Web Crypto API compatibility with jose's TextEncoder/Uint8Array key signing
- [Phase 03-authentication]: getUserByEmail does not call verifySession() — login DAL is a documented exception since auth is not yet established at login time
- [Phase 03-authentication]: Rate limit check placed before DB lookup to avoid timing side-channels
- [Phase 03-authentication]: proxy.ts is redirect-only (no JWT); verifySession() in (app)/layout.tsx is the real security gate
- [Phase 03-authentication]: e2e/ excluded from Vitest glob — Playwright test.describe() incompatible with Vitest globals
- [Phase 04-financial-engine]: decimal.js used inside function bodies only — public signatures accept and return plain integers (pence)
- [Phase 04-financial-engine]: bills.ts stub created for getMonthlyBillCost so income.ts can compile; real implementation in Plan 02

### Pending Todos

None yet.

### Blockers/Concerns

- [Pre-start]: Verify Drizzle ORM version on npm before locking in (moves fast; use latest stable)
- [Pre-start]: Confirm Recharts v2 vs v3 status and shadcn Chart integration compatibility
- [Pre-start]: Verify ioredis v5 maintenance status; node-redis v4 is the fallback
- [Pre-start]: Clearbit free logo API availability must be confirmed before Phase 7 implementation

## Session Continuity

Last session: 2026-03-25T10:21:21.182Z
Stopped at: Completed 04-financial-engine 04-01-PLAN.md
Resume file: None
