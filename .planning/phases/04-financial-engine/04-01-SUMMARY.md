---
phase: 04-financial-engine
plan: 01
subsystem: engine
tags: [decimal-arithmetic, tdd, income, pots, types]
dependency_graph:
  requires: []
  provides: [engine/types.ts, engine/income.ts, engine/pots.ts, engine/bills.ts]
  affects: [04-02-bills, 04-03-forecast]
tech_stack:
  added: [decimal.js@10.6.0, date-fns@4.1.0]
  patterns: [Decimal-arithmetic-in-bodies, integer-pence-in-out, tdd-red-green]
key_files:
  created:
    - src/lib/engine/types.ts
    - src/lib/engine/income.ts
    - src/lib/engine/income.test.ts
    - src/lib/engine/pots.ts
    - src/lib/engine/pots.test.ts
    - src/lib/engine/bills.ts
  modified:
    - package.json
    - package-lock.json
decisions:
  - decimal.js used inside function bodies only — public signatures accept and return plain integers (pence)
  - bills.ts stub created for getMonthlyBillCost so income.ts can import it; real implementation in Plan 02
  - Negative disposable income returned accurately — not clamped to zero
metrics:
  duration: 3 minutes
  completed: 2026-03-25
  tasks_completed: 2
  tests_passing: 32
---

# Phase 4 Plan 1: Financial Engine Foundation (Types, Income, Pots) Summary

**One-liner:** Decimal-arithmetic income and pot allocation engine with 32 tests using decimal.js and date-fns runtime dependencies.

## What Was Built

Installed `decimal.js` and `date-fns` as runtime dependencies and implemented the shared type definitions plus two core financial engine modules.

**`src/lib/engine/types.ts`** — Shared TypeScript interfaces: `BillFrequency`, `Pot`, `Bill`, `BillOccurrence`, `ForecastInput`, `ForecastMonth`, `IncomeValidation`. No server-only import; safe to use from client components.

**`src/lib/engine/income.ts`** — Two exported functions:
- `validateIncome(pence)`: validates non-negative finite integers
- `calculateDisposableIncome(incomePence, pots, bills, year, month)`: uses Decimal internally to prevent float accumulation; result can be negative

**`src/lib/engine/pots.ts`** — Three exported functions:
- `sumPotAllocations(pots)`: sums allocations with Decimal precision
- `validatePotAllocations(incomePence, pots)`: returns remaining or overAllocatedPence
- `getPotBalance(allocatedPence, spentPence)`: returns allocated minus spent (negative = overspent)

**`src/lib/engine/bills.ts`** — Stub implementation for `getMonthlyBillCost` and `getBillOccurrences` (real implementation in Plan 02).

## Test Results

| File | Tests |
|------|-------|
| income.test.ts | 16 passing |
| pots.test.ts | 16 passing |
| **Total** | **32 passing** |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

All 6 created files exist on disk. Both task commits verified (c2d1f55, f4ef361). 32 tests passing. TypeScript type-check clean.
