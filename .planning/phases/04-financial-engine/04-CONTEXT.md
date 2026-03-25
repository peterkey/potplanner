# Phase 4: Financial Engine - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Pure TypeScript financial engine functions in `src/lib/engine/` — zero I/O, zero async, no database calls. Covers: income tracking, disposable income calculation, pot allocation, bill scheduling (with frequency handling), and N-month cash-flow projection. The engine is purely computational — all domain data is passed in as plain TypeScript values; the engine never fetches anything.

This phase produces a complete Vitest unit test suite. There is no UI, no DAL, no API — just pure functions and their tests.

</domain>

<decisions>
## Implementation Decisions

### Decimal Arithmetic (decimal.js)

- Use `decimal.js` for ALL intermediate monetary arithmetic within engine functions
- Function signature contract: **accept integers (pence), return integers (pence)**
- `decimal.js` stays inside function bodies — never appears in public type signatures or return types
- Example pattern:
  ```typescript
  function calculateDisposableIncome(incomePence: number, allocations: number[], billsTotalPence: number): number {
    const d = new Decimal(incomePence)
    const allocated = allocations.reduce((acc, a) => acc.add(a), new Decimal(0))
    return d.minus(allocated).minus(billsTotalPence).toNumber()
  }
  ```
- This prevents float accumulation errors across multi-month projections
- `decimal.js` must be added to `dependencies` (not `devDependencies`) — it's a runtime dep

### Bill Frequency and Scheduling

- Core function: `getBillOccurrences(bill, startDate, endDate): Date[]` — returns all due dates in range
- Use `date-fns` for date arithmetic — check if already installed before adding; if not, add to dependencies
- Frequency handling:
  - `weekly`: add 7 days repeatedly from `nextDueDate` until past `endDate`
  - `biweekly`: add 14 days
  - `four_weekly`: add 28 days
  - `monthly`: same calendar day each month; if day doesn't exist (e.g. 31st in Feb), clamp to last day of that month
  - `annual`: same month/day each year; if Feb 29 bill and non-leap year, use Feb 28
- Monthly normalization for disposable income: count **actual occurrences** in the calendar month (not 52/12 annualization)
  - `getMonthlyBillCost(bill, year, month): number` — calls `getBillOccurrences` for that month's date range
  - This correctly handles 4-occurrence vs 5-occurrence weeks and annual bills (only charged in their month)

### Income Model

- Income is a **single monthly fixed figure** in pence (integer)
- ENG-01: user sets `monthlyIncomePence: number` — no variable income, no per-category income
- Disposable income formula: `monthlyIncomePence − sum(pot.allocatedPence) − sum(getMonthlyBillCost for all bills)`
- Result can be negative (user is over-allocated) — this is valid and must be represented, not clamped

### Forecast Structure

- Function signature: `forecastMonths(input: ForecastInput, n: number): ForecastMonth[]`
- `ForecastInput` contains: `monthlyIncomePence`, `pots: Pot[]`, `bills: Bill[]`, `startingBalancePence`, `startYear`, `startMonth`
- `ForecastMonth`:
  ```typescript
  interface ForecastMonth {
    year: number
    month: number               // 1-12
    incomePence: number
    billsDue: BillOccurrence[]  // each bill occurrence in this month
    totalBillsPence: number
    potAllocationsPence: number  // sum of all pot allocations
    disposableIncomePence: number
    cumulativeBalancePence: number  // running total from startingBalance
  }
  ```
- `cumulativeBalancePence` = previous month's cumulative + this month's disposable income
- `BillOccurrence`: `{ billId, name, amountPence, dueDate, potId }`

### File Organisation in `lib/engine/`

- `income.ts` — income and disposable income calculations
- `bills.ts` — bill scheduling, occurrence generation, monthly cost
- `pots.ts` — pot allocation validation, pot balance calculation
- `forecast.ts` — N-month cash-flow projection
- `types.ts` — shared TypeScript interfaces (no logic)
- `index.ts` — re-exports all public API
- All files: NO `import 'server-only'` — pure functions, safe to import anywhere (including client components)

### Test Coverage Target

- Target: **60+ tests** (well exceeding the original 48)
- Test file structure mirrors engine files: `income.test.ts`, `bills.test.ts`, `pots.test.ts`, `forecast.test.ts`
- Must cover:
  - Weekly bills in a 4-occurrence month vs a 5-occurrence month
  - Annual bill: in-month (charged) vs out-of-month (not charged)
  - Monthly bill day clamping: 31st Jan → Feb 28, 31st March → Apr 30
  - Feb 29 annual bill in a non-leap year → Feb 28
  - Zero income scenario (all disposable income is negative)
  - Negative disposable income (over-allocated pots + bills exceed income)
  - Bill with 100% joint split to one member, 50/50 split
  - Biweekly and four-weekly occurrence counts across months
  - Multi-month forecast: cumulative balance compounds correctly
  - `n = 1` and `n = 12` forecast lengths (boundary values)

### Claude's Discretion

- Exact `Decimal` rounding mode (ROUND_HALF_UP is standard for currency)
- Whether to use `date-fns/addDays`, `date-fns/addMonths`, or manual date math
- Internal helper function organisation within each file
- Test file setup/teardown (none needed — pure functions)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §Financial Engine — ENG-01 through ENG-06 (exact acceptance criteria)
- `.planning/PROJECT.md` — "TypeScript financial engine" note: rebuilding 48-test engine from original

### Architecture constraints
- `CLAUDE.md` §Database Rules — integer pence mandate, interest rate basis points, no float arithmetic
- `CLAUDE.md` §Architecture §Server-Only Boundaries — `lib/engine/` is the explicit EXCEPTION (no `server-only`; pure TS, safe anywhere)
- `src/lib/db/schema.ts` — all domain types: frequency enum values, column names, pence columns

### Test infrastructure
- `vitest.config.mts` — test environment (jsdom), globals, exclude patterns, `passWithNoTests`
- Phase 2 CONTEXT: `.planning/phases/02-ci-cd-and-test-infrastructure/02-CONTEXT.md` — CI runs `vitest run`, must pass with zero failures

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/db/schema.ts` — `frequencyEnum` defines exact values: `'weekly' | 'biweekly' | 'four_weekly' | 'monthly' | 'annual'`; use these strings as the TypeScript union type in engine interfaces
- `vitest.config.mts` — already configured with `globals: true`, `passWithNoTests: true`, `exclude: ['**/e2e/**']`; engine tests require no config changes

### Established Patterns
- `src/lib/engine/` directory exists but is empty — ready to populate
- No `decimal.js` or `date-fns` installed yet — both need to be added to `dependencies`
- All monetary values in schema use `_pence` suffix — engine types should mirror this convention
- Interest rate stored as basis points (integer) in schema — engine debt calculations divide by 10000

### Integration Points
- Phase 5 (Accounts and Pots) will import from `src/lib/engine/` in Server Actions and DAL functions
- Phase 8 (Debt) will extend engine with avalanche/snowball functions — keep debt calculations in a separate `debt.ts` module (or defer entirely to Phase 8)
- `src/lib/db/schema.ts` types should be mirrored as plain TypeScript interfaces in `engine/types.ts` — engine must not import from `src/lib/db/` (that would create a circular boundary violation)

</code_context>

<specifics>
## Specific Ideas

- The original Python engine had 48 tests — rebuild and exceed in TypeScript
- Engine functions should be usable from both Server Components (for SSR) and client-side React hooks (for reactive UI) — the no-`server-only` rule makes this possible
- Negative disposable income is a valid state (user is over-budget) — UI will surface this as a warning in Phase 9, but engine must return it accurately without clamping

</specifics>

<deferred>
## Deferred Ideas

- Debt avalanche/snowball payoff calculations — Phase 8. Engine `debt.ts` module can be stubbed or left entirely to Phase 8 (Phase 4 success criteria does not include debt calculations).
- Savings goal progress calculations — Phase 8.
- Transfer history log appending — Phase 7. Phase 4 engine does not write to the DB.

</deferred>

---

*Phase: 04-financial-engine*
*Context gathered: 2026-03-25*
