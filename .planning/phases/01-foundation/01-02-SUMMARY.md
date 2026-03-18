---
phase: 01-foundation
plan: 02
subsystem: database
tags: [drizzle-orm, drizzle-kit, postgres, integer-pence, server-only, schema, migrations]

# Dependency graph
requires:
  - phase: 01-01
    provides: package.json with drizzle-orm, drizzle-kit, postgres, server-only, dotenv installed; tsconfig.json with strict mode and @/* path alias

provides:
  - Drizzle ORM schema with 8 domain tables (users, accounts, pots, bills, bill_splits, transfer_history, debts, savings_goals)
  - Integer pence monetary columns enforced throughout schema
  - Append-only transfer_history ledger pattern
  - Drizzle client (server-only boundary enforced)
  - drizzle.config.ts pointing to schema
  - scripts/migrate.ts programmatic migration runner
  - .env.example documenting all required environment variables

affects: [auth, financial-engine, dal, all-feature-phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - integer pence for all monetary columns (never numeric/real/decimal)
    - append-only ledger via transfer_history (rows never updated or deleted)
    - server-only guard on all DB files (import 'server-only' as first import)
    - drizzle-orm relational queries via schema export in db client
    - drizzle-kit for migration generation and execution

key-files:
  created:
    - src/lib/db/schema.ts
    - src/lib/db/index.ts
    - drizzle.config.ts
    - scripts/migrate.ts
    - .env.example
  modified:
    - .gitignore

key-decisions:
  - "integer pence for monetary columns: integer() maps to PostgreSQL INTEGER (32-bit), max ~£21M — sufficient for household budgets; basis points for interest_rate (2500 = 25.00%)"
  - "transfer_history is append-only by design — balances are always derived, never maintained as mutable column"
  - ".gitignore .env* glob replaced with explicit .env patterns so .env.example can be committed"

patterns-established:
  - "Pattern: import 'server-only' as first line of any DB or DAL file"
  - "Pattern: all monetary columns named *Pence and typed integer()"
  - "Pattern: no current_balance column — balances computed from transfer_history"

requirements-completed: [SCAF-06]

# Metrics
duration: 2min
completed: 2026-03-18
---

# Phase 1 Plan 02: Drizzle Schema and Migration Tooling Summary

**Drizzle ORM schema with 8 domain tables using integer pence columns, append-only transfer_history ledger, server-only DB client, drizzle-kit config, and programmatic migration runner**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-18T17:28:22Z
- **Completed:** 2026-03-18T17:30:13Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Complete Drizzle schema: 8 domain tables with integer pence enforced on all monetary columns, frequencyEnum, foreign key relationships, and append-only ledger pattern documented
- Drizzle client with server-only boundary — any accidental client-side import causes a build-time error
- Migration tooling wired: drizzle.config.ts + scripts/migrate.ts ready for `npm run db:generate` and `npm run db:migrate`
- Environment variable template committed (.env.example) with all required vars for local dev and production

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Drizzle schema with all domain tables using integer pence** - `33e9703` (feat)
2. **Task 2: Create Drizzle client, config, migration script, and env template** - `8e1c840` (feat)

**Plan metadata:** TBD (docs commit)

## Files Created/Modified

- `src/lib/db/schema.ts` - All 8 domain tables with integer pence columns, frequencyEnum, foreign keys, append-only comment on transfer_history
- `src/lib/db/index.ts` - Drizzle client with `import 'server-only'` guard and schema export for relational queries
- `drizzle.config.ts` - drizzle-kit config: postgresql dialect, schema path, DATABASE_URL credentials
- `scripts/migrate.ts` - Programmatic migration runner using `drizzle-orm/node-postgres/migrator` for Docker entrypoint use
- `.env.example` - Documents DATABASE_URL, POSTGRES_DB/USER/PASSWORD, REDIS_URL, JWT_SECRET, GITHUB_PERSONAL_ACCESS_TOKEN
- `.gitignore` - Fixed `.env*` wildcard to explicit `.env` / `.env.local` patterns so `.env.example` can be committed

## Decisions Made

- **Integer pence mandate established**: All monetary columns use `integer()` (PostgreSQL INTEGER, 32-bit). Basis points for `interest_rate` (2500 = 25.00%). Maximum ~£21M per column — sufficient for household budgets.
- **Append-only ledger**: `transfer_history` has a block comment documenting rows are never updated or deleted. No `current_balance` column exists anywhere.
- **`.gitignore` fix**: The default Next.js `.env*` pattern was blocking `.env.example` from being committed. Replaced with explicit patterns (`.env`, `.env.local`, `.env.development.local`, `.env.test.local`, `.env.production.local`).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Fixed .gitignore to allow .env.example to be committed**
- **Found during:** Task 2 (env file creation)
- **Issue:** The existing `.gitignore` had `.env*` which would have ignored `.env.example`, preventing it from being committed. Plan specified `.env.example` must be committed.
- **Fix:** Replaced `.env*` with explicit `.env`, `.env.local`, `.env.development.local`, `.env.test.local`, `.env.production.local` entries
- **Files modified:** `.gitignore`
- **Verification:** `git status` showed `.env.example` as untracked (committable) while `.env` was correctly gitignored
- **Committed in:** `8e1c840` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Fix was required for `.env.example` to be committable per plan spec. No scope creep.

## Issues Encountered

None — TypeScript compiled clean (`npx tsc --noEmit` exit 0) after both tasks.

## User Setup Required

None for this plan. Full environment variable setup is in `.env.example`. Copy to `.env` for local development:

```bash
cp .env.example .env
```

A PostgreSQL instance and Redis instance must be running for `db:migrate` to work (covered by Docker Compose in plan 01-03).

## Next Phase Readiness

- Schema is complete and immutable for Phase 1 — all 8 domain tables ready for Phase 3 (Auth) and Phase 5+ (Features)
- Drizzle migration tooling configured — running `npm run db:generate` will produce SQL migration files once DB is available
- `server-only` boundary is active — any accidental client import of DB files will cause a build-time error
- Integer pence mandate is locked in — all subsequent phases must follow this pattern (documented in schema comments)

## Self-Check: PASSED

All files found. All commits verified.

---
*Phase: 01-foundation*
*Completed: 2026-03-18*
