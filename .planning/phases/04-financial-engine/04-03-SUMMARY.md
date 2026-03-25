---
phase: 04-financial-engine
plan: 03
subsystem: engine
tags: [typescript, vitest, decimal.js, date-fns, forecast, pure-functions]

# Dependency graph
requires:
  - phase: 04-financial-engine-plan-01
    provides: income.ts, pots.ts, types.ts engine foundations
  - phase: 04-financial-engine-plan-02
    provides: bills.ts with getBillOccurrences and getMonthlyBillCost
provides:
  - forecast.ts: N-month cash-flow projection via forecastMonths()
  - index.ts: barrel re-export of all engine public API
  - 87 engine tests passing (well above 60 target)
  - Complete financial engine ready for Phase 5 DAL/Server Actions wiring
affects:
  - phase: 05-accounts-and-pots (imports forecastMonths from @/lib/engine)
  - phase: 08-debt (extends engine with debt.ts module)
  - phase: 09-visualisation (imports engine functions for chart data)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - forecastMonths: builds ForecastMonth array with Decimal arithmetic for cumulative balance compounding
    - Barrel export: index.ts re-exports all engine modules, no server-only (engine is client-safe by design)
    - TDD pattern: RED (failing tests) -> GREEN (implementation) -> COMMIT

key-files:
  created:
    - src/lib/engine/forecast.ts
    - src/lib/engine/forecast.test.ts
    - src/lib/engine/index.ts
  modified: []

key-decisions:
  - "forecastMonths does NOT call calculateDisposableIncome from income.ts — it directly uses getBillOccurrences and sums billsDue to avoid double-counting; keeps forecast logic self-contained"
  - "index.ts has no server-only import — engine is the explicit exception per CLAUDE.md; safe for both server and client components"
  - "Decimal arithmetic used inside forecastMonths loop for cumulative balance to prevent float drift over 12+ months"

patterns-established:
  - "Barrel pattern: src/lib/engine/index.ts export * from each module; consumers import from @/lib/engine"
  - "forecastMonths algorithm: per-month loop using getBillOccurrences to count actual bill occurrences, not annualised rates"
  - "Test helper factories (makePot, makeBill, makeInput) with Partial<T> overrides — established for engine tests"

requirements-completed: [ENG-03, ENG-05, ENG-06]

# Metrics
duration: 7min
completed: 2026-03-25
---

# Phase 4 Plan 03: Forecast Module and Engine Barrel Summary

**N-month cash-flow forecast engine using actual bill occurrence counting, cumulative Decimal balance, year rollover, and barrel export — 87 engine tests pass**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-03-25T10:27:00Z
- **Completed:** 2026-03-25T10:29:33Z
- **Tasks:** 2
- **Files modified:** 3 created

## Accomplishments

- `forecastMonths(input, n)` produces N ForecastMonth entries with correct cumulative balance compounding from startingBalancePence
- billsDue per month contains actual BillOccurrence objects from getBillOccurrences — actual occurrence counting (not 52/12 annualisation), handles 4-week vs 5-week months
- Year rollover works correctly: month 12 -> month 1, year increments
- `src/lib/engine/index.ts` barrel re-exports all public engine API — no server-only import per CLAUDE.md
- Engine test suite: 87 tests (income: 16, bills: 29, pots: 16, forecast: 26); full project suite: 100 tests all passing

## Task Commits

Each task was committed atomically:

1. **Task 1: TDD forecast module** - `4769c63` (feat)
2. **Task 2: Create barrel export and verify full suite** - `9638a0d` (feat)

**Plan metadata:** (pending docs commit)

_Note: TDD tasks — RED (tests written and confirmed failing) then GREEN (implementation passes all tests)_

## Files Created/Modified

- `src/lib/engine/forecast.ts` — forecastMonths() with per-month bill occurrence loop and Decimal cumulative balance
- `src/lib/engine/forecast.test.ts` — 26 tests across 8 describe blocks: basic, pots, bills, cumulative balance, billsDue, year rollover, boundary values, mixed frequencies
- `src/lib/engine/index.ts` — barrel: `export * from` all 5 engine modules (types, income, bills, pots, forecast)

## Decisions Made

- forecastMonths directly uses getBillOccurrences rather than delegating to calculateDisposableIncome — avoids double-counting and keeps forecast self-contained
- Barrel index.ts intentionally has no `import 'server-only'` — engine is the explicit CLAUDE.md exception (safe for client and server)
- Used Decimal arithmetic inside the forecast loop's cumulative balance accumulation to prevent float drift over multi-month projections

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Financial engine is complete and ready for Phase 5 (Accounts and Pots) consumption
- `import { forecastMonths, calculateDisposableIncome, getBillOccurrences, sumPotAllocations } from '@/lib/engine'` resolves correctly
- All 100 project tests pass; type-check clean
- No blockers

---
*Phase: 04-financial-engine*
*Completed: 2026-03-25*
