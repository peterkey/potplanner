# Phase 4: Financial Engine - Research

**Researched:** 2026-03-25
**Domain:** Pure TypeScript financial calculation engine — decimal arithmetic, bill scheduling, cash-flow projection
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Use `decimal.js` for ALL intermediate monetary arithmetic within engine functions
- Function signature contract: accept integers (pence), return integers (pence)
- `decimal.js` stays inside function bodies — never appears in public type signatures or return types
- `decimal.js` must be added to `dependencies` (not `devDependencies`) — it's a runtime dep
- Use `date-fns` for date arithmetic — check if already installed before adding; if not, add to dependencies
- Bill frequency handling:
  - `weekly`: add 7 days repeatedly from `nextDueDate`
  - `biweekly`: add 14 days
  - `four_weekly`: add 28 days
  - `monthly`: same calendar day each month; clamp to last day if day doesn't exist
  - `annual`: same month/day each year; if Feb 29 bill and non-leap year, use Feb 28
- Monthly bill cost uses actual occurrence counting (not 52/12 annualization)
- Core function: `getBillOccurrences(bill, startDate, endDate): Date[]`
- `getMonthlyBillCost(bill, year, month): number` calls `getBillOccurrences` for that month's date range
- Income is a single monthly fixed figure in pence
- Disposable income formula: `monthlyIncomePence − sum(pot.allocatedPence) − sum(getMonthlyBillCost for all bills)`
- Result can be negative — never clamp
- `forecastMonths(input: ForecastInput, n: number): ForecastMonth[]`
- `ForecastInput` contains: `monthlyIncomePence`, `pots: Pot[]`, `bills: Bill[]`, `startingBalancePence`, `startYear`, `startMonth`
- `cumulativeBalancePence` = previous month's cumulative + this month's disposable income
- File layout: `income.ts`, `bills.ts`, `pots.ts`, `forecast.ts`, `types.ts`, `index.ts`
- NO `import 'server-only'` in any engine file
- Target: 60+ tests (exceeding original 48)
- Test file structure mirrors engine files: `income.test.ts`, `bills.test.ts`, `pots.test.ts`, `forecast.test.ts`

### Claude's Discretion

- Exact `Decimal` rounding mode (ROUND_HALF_UP is standard for currency)
- Whether to use `date-fns/addDays`, `date-fns/addMonths`, or manual date math
- Internal helper function organisation within each file
- Test file setup/teardown (none needed — pure functions)

### Deferred Ideas (OUT OF SCOPE)

- Debt avalanche/snowball payoff calculations — Phase 8
- Savings goal progress calculations — Phase 8
- Transfer history log appending — Phase 7. Phase 4 engine does not write to the DB
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ENG-01 | User can set total monthly income | `monthlyIncomePence: number` field in `ForecastInput`; income.ts exports `setMonthlyIncome` validation helper |
| ENG-02 | Disposable income is calculated (income − pot allocations − bills) | income.ts `calculateDisposableIncome` using Decimal arithmetic; bills.ts `getMonthlyBillCost` per month |
| ENG-03 | Financial forecast projects income, bills, and pot balances forward N months | forecast.ts `forecastMonths(input, n)` iterating month-by-month with cumulative balance |
| ENG-05 | Financial engine is implemented as pure TypeScript functions in `lib/engine/` with integer pence arithmetic | All engine files: no I/O, no async, no DB imports; Decimal for intermediary arithmetic; `_pence` suffix convention |
| ENG-06 | Engine has full unit test coverage via Vitest (target: rebuild and exceed original 48 tests) | 60+ test target; Vitest 4.x already configured; test files alongside engine files |
</phase_requirements>

---

## Summary

Phase 4 creates the financial engine as a collection of pure TypeScript functions in `src/lib/engine/`. The engine has no side effects — it performs computations on plain data passed in and returns plain data. It must never import from `src/lib/db/` or `src/lib/auth/` and must not include `import 'server-only'`, making it safe for use in both Server Components and client-side React hooks.

The two primary external dependencies are `decimal.js` (for precision arithmetic) and `date-fns` (for date manipulation). Neither is currently installed in the project. Both must be added to `dependencies` (not `devDependencies`) because they are needed at runtime — the engine is imported in production server and client code. The Vitest test infrastructure is already fully configured (`vitest.config.mts`, `src/tests/setup.ts`); no test setup changes are needed for pure function unit tests.

The trickiest implementation area is bill scheduling: the CONTEXT.md specifies actual occurrence counting per calendar month rather than annualization, and the monthly/annual frequency edge cases (day clamping, leap year) require careful implementation. The `date-fns` `addMonths` function already implements month-end clamping, which aligns with the requirement. The `decimal.js` `ROUND_HALF_UP` rounding mode (integer value 4) is the correct choice for currency.

**Primary recommendation:** Install `decimal.js@^10.6.0` and `date-fns@^4.1.0` as runtime dependencies, implement the six engine files in order (`types.ts` → `income.ts` → `bills.ts` → `pots.ts` → `forecast.ts` → `index.ts`), then write 60+ Vitest tests covering all edge cases before moving to Phase 5.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| decimal.js | 10.6.0 | Arbitrary-precision decimal arithmetic for monetary calculations | Prevents float accumulation errors in multi-step calculations; locked decision |
| date-fns | 4.1.0 | Date arithmetic (addDays, addMonths, etc.) for bill scheduling | Lightweight, modular, tree-shakeable, pure functions; locked decision |
| TypeScript | 5.x (already installed) | Strict type safety for engine interfaces | Project-wide convention |
| Vitest | 4.1.0 (already installed) | Unit test runner | Already configured at repo root; project convention |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| server-only | 0.0.1 (already installed) | Build-time client bundling guard | Do NOT use in engine/ files — engine is safe for client use |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| decimal.js | big.js or bignumber.js | decimal.js is the most feature-complete; big.js is simpler but lacks some API; locked decision |
| date-fns | dayjs or luxon | date-fns is pure-functional and tree-shakeable; locked decision |
| date-fns addMonths | Manual date math | date-fns already handles end-of-month clamping correctly — no need to hand-roll |

**Installation (neither package is currently installed):**
```bash
npm install decimal.js date-fns
```

**Version verification (confirmed against npm registry 2026-03-25):**
- `decimal.js`: 10.6.0
- `date-fns`: 4.1.0

---

## Architecture Patterns

### Recommended Project Structure

```
src/lib/engine/
├── types.ts         # Shared interfaces: Pot, Bill, BillOccurrence, ForecastInput, ForecastMonth
├── income.ts        # calculateDisposableIncome, validateIncome
├── bills.ts         # getBillOccurrences, getMonthlyBillCost
├── pots.ts          # validatePotAllocations, sumPotAllocations
├── forecast.ts      # forecastMonths
└── index.ts         # Re-exports all public API
src/lib/engine/
├── income.test.ts
├── bills.test.ts
├── pots.test.ts
└── forecast.test.ts
```

### Pattern 1: Integer-In / Integer-Out with Decimal Internals

**What:** Engine functions accept `number` (integer pence) and return `number` (integer pence). Decimal instances are created and discarded within function bodies only.

**When to use:** Every arithmetic operation that could accumulate floating-point error.

**Example:**
```typescript
// Source: CONTEXT.md locked decision pattern
import Decimal from 'decimal.js'

export function calculateDisposableIncome(
  incomePence: number,
  pots: Pot[],
  bills: Bill[],
  year: number,
  month: number
): number {
  const d = new Decimal(incomePence)
  const potTotal = pots.reduce(
    (acc, p) => acc.plus(p.allocatedPence),
    new Decimal(0)
  )
  const billTotal = bills.reduce(
    (acc, b) => acc.plus(getMonthlyBillCost(b, year, month)),
    new Decimal(0)
  )
  return d.minus(potTotal).minus(billTotal).toNumber()
}
```

### Pattern 2: Bill Occurrence Generation

**What:** `getBillOccurrences` generates all due dates in a date range by stepping from `nextDueDate` using frequency-appropriate increments.

**When to use:** Any time bills need to be costed or listed for a period.

**Example:**
```typescript
// Source: CONTEXT.md locked decisions + date-fns v4.1.0
import { addDays, addMonths, addYears, endOfMonth } from 'date-fns'

export function getBillOccurrences(
  bill: Bill,
  startDate: Date,
  endDate: Date
): Date[] {
  const occurrences: Date[] = []
  let current = new Date(bill.nextDueDate)

  // Advance past start if bill started before range
  while (current < startDate) {
    current = advanceByFrequency(current, bill.frequency)
  }

  while (current <= endDate) {
    occurrences.push(new Date(current))
    current = advanceByFrequency(current, bill.frequency)
  }
  return occurrences
}
```

**Key insight on `addMonths` clamping (verified from date-fns source, confirmed by GitHub issue #3506):**
`addMonths` already clamps to the last day of the target month. Jan 31 + 1 month = Feb 28 (non-leap) or Feb 29 (leap). This matches the CONTEXT.md requirement exactly — no custom clamping logic is needed for `monthly` frequency.

### Pattern 3: Rounding Mode

**What:** `Decimal.ROUND_HALF_UP` (integer value 4) for all `.toDecimalPlaces()` or `.toFixed()` calls. However, since all values are already integers (pence), the `toNumber()` call should always yield an exact integer — rounding mode is only relevant if division is performed (e.g., splitting a bill).

**When to use:** Any time a Decimal result must be converted to an integer pence value after division.

```typescript
// For bill splits (percentage of pence amount):
const splitPence = new Decimal(bill.amountPence)
  .times(percentage)
  .dividedBy(100)
  .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
  .toNumber()
```

### Pattern 4: Types Mirror Schema Without DB Import

**What:** `engine/types.ts` defines plain TypeScript interfaces that mirror the Drizzle schema column names and types — but NEVER import from `src/lib/db/schema.ts`.

**Why:** The engine must not depend on the DB layer (would create circular dependency and pull `server-only` into client bundles).

```typescript
// Source: schema.ts column names + CONTEXT.md
export type BillFrequency = 'weekly' | 'biweekly' | 'four_weekly' | 'monthly' | 'annual'

export interface Pot {
  id: number
  name: string
  allocatedPence: number
  rollover: boolean
}

export interface Bill {
  id: number
  name: string
  amountPence: number
  frequency: BillFrequency
  potId: number | null
  nextDueDate: Date
}

export interface BillOccurrence {
  billId: number
  name: string
  amountPence: number
  dueDate: Date
  potId: number | null
}

export interface ForecastInput {
  monthlyIncomePence: number
  pots: Pot[]
  bills: Bill[]
  startingBalancePence: number
  startYear: number
  startMonth: number  // 1-12
}

export interface ForecastMonth {
  year: number
  month: number               // 1-12
  incomePence: number
  billsDue: BillOccurrence[]
  totalBillsPence: number
  potAllocationsPence: number
  disposableIncomePence: number
  cumulativeBalancePence: number
}
```

### Anti-Patterns to Avoid

- **Importing from `src/lib/db/`:** Engine types must be plain interfaces, not Drizzle inferred types. Importing schema would pull `server-only` into client bundles.
- **Adding `import 'server-only'` to engine files:** Explicitly forbidden — engine must be importable in client components.
- **Using native JS `+`, `*`, `/` on pence values across multiple steps:** Float accumulation errors compound. Use `Decimal` for any multi-step arithmetic.
- **Storing intermediate Decimal instances in return types:** Decimal must stay inside function bodies.
- **Clamping negative disposable income to zero:** Negative disposable income is a valid state — Phase 9 UI will warn the user.
- **Using 52/12 annualization for weekly bills:** Count actual occurrences in the calendar month instead.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Month-end date clamping (Jan 31 + 1 month) | Custom day-clamping logic | `date-fns` `addMonths` | Already handles: verified from source code and GitHub issue #3506 |
| Arbitrary-precision addition across multiple pots/bills | Native JS float accumulation | `decimal.js` `Decimal.plus` chain | 0.1 + 0.2 = 0.30000000000000004 in JS; Decimal gives exact results |
| Days-in-month lookup | Custom lookup table | `date-fns` `getDaysInMonth` or `endOfMonth` | Already accounts for leap years |
| Date range iteration | Custom while loop with raw Date math | `date-fns` `addDays`, `addWeeks`, `addMonths` | Handles DST, leap years, month boundaries |

**Key insight:** The bill occurrence counting problem looks simple but has O(12) leap-year-aware edge cases. `date-fns` handles all of them; the engine only needs to call the right functions.

---

## Common Pitfalls

### Pitfall 1: `addMonths` Asymmetry Near Month-End

**What goes wrong:** Bills with `nextDueDate` on the 31st will be scheduled on Feb 28 (correct per CONTEXT.md) but then the next advance from Feb 28 goes to Mar 28 rather than Mar 31 — creating date drift.

**Why it happens:** `addMonths(Jan31, 1) = Feb28`, then `addMonths(Feb28, 1) = Mar28` — not Mar31. The original date's day-of-month is permanently lost after the first clamping.

**How to avoid:** Always advance by frequency from the **original** `nextDueDate` stepping forward by full period multiples, NOT from the last computed occurrence. The iteration pattern in getBillOccurrences must advance from a stable baseline, not from the previously clamped date.

**Recommended approach:** Track the period count and compute each occurrence as `addMonths(nextDueDate, i)` where `i` increments — never `addMonths(lastOccurrence, 1)`.

**Warning signs:** Tests for "monthly bill on 31st over 6 months" show dates shifting to 28th/30th permanently.

### Pitfall 2: `endOfMonth` Returns 23:59:59.999, Not Midnight

**What goes wrong:** Using `endOfMonth(date)` as the `endDate` in `getBillOccurrences` and then doing `current <= endDate` — bills falling exactly on the last day of month would appear to be within range but time comparison may exclude them if the bill's `dueDate` time component is midnight.

**Why it happens:** `endOfMonth` returns the last millisecond of the day (23:59:59.999). A bill due date created with `new Date(year, month-1, day)` is midnight (00:00:00.000), so `midnight <= 23:59:59.999` is `true` — this actually works correctly. But constructing the range end as midnight on the last day would miss bills due that day.

**How to avoid:** Use `endOfMonth(new Date(year, month-1, 1))` as the range end when calling `getBillOccurrences` from `getMonthlyBillCost`. The time component of `endOfMonth` (23:59:59.999) is fine — midnight bill dates will compare correctly as `<=`.

**Warning signs:** Bills due on the last day of a month are missing from monthly cost calculations.

### Pitfall 3: Vitest Environment for Pure Functions

**What goes wrong:** The default `vitest.config.mts` sets `environment: 'jsdom'`. Engine tests don't use DOM APIs, but this is harmless. The gotcha is if engine tests accidentally import anything from server-only modules — they would fail at import time.

**Why it happens:** If `types.ts` or any engine file accidentally imports from `@/lib/db/`, Vitest will fail with a module resolution error or `server-only` boundary error.

**How to avoid:** Engine test imports should only reference `@/lib/engine/*`. No DAL, no DB, no auth imports. Verify: `import { forecastMonths } from '@/lib/engine'` — that's the only import needed.

**Warning signs:** `Error: This module cannot be imported from a Client Component module` in Vitest output.

### Pitfall 4: `decimal.js` Import — Default vs Named

**What goes wrong:** `import { Decimal } from 'decimal.js'` vs `import Decimal from 'decimal.js'` — either works in practice (the package exports both), but mixing styles across files causes confusion and may cause TypeScript errors depending on `moduleResolution`.

**How to avoid:** Use `import Decimal from 'decimal.js'` (default import) consistently across all engine files. This is the pattern shown in the official README and works with `moduleResolution: bundler` (Next.js default).

**Warning signs:** TypeScript error `Module '"decimal.js"' has no exported member 'Decimal'` with named import (rare but possible with certain tsconfig settings).

### Pitfall 5: Annual Bills — Two-Argument `addYears` Clamping for Feb 29

**What goes wrong:** An annual bill with `nextDueDate` on Feb 29 (leap year). The following year is not a leap year. `addYears(feb29date, 1)` in date-fns returns Feb 28 (clamped). This matches the CONTEXT.md requirement, but subsequent advances from Feb 28 rather than Feb 29 are not an issue for annual bills (only one occurrence per year).

**How to avoid:** No special handling needed — `date-fns` `addYears` already handles this correctly, same as `addMonths` for monthly bills.

---

## Code Examples

Verified patterns from official sources and CONTEXT.md locked decisions:

### decimal.js Import and Basic Arithmetic

```typescript
// Source: decimal.js README + CONTEXT.md pattern
import Decimal from 'decimal.js'

// Sum of pence values with full precision
const total = [10050, 2500, 799].reduce(
  (acc, v) => acc.plus(v),
  new Decimal(0)
)
const result: number = total.toNumber() // 13349
```

### decimal.js Rounding Constants

```typescript
// Source: github.com/MikeMcl/decimal.js (verified 2026-03-25)
// Rounding mode values:
// Decimal.ROUND_UP    = 0
// Decimal.ROUND_DOWN  = 1
// Decimal.ROUND_CEIL  = 2
// Decimal.ROUND_FLOOR = 3
// Decimal.ROUND_HALF_UP  = 4   <-- standard for currency
// Decimal.ROUND_HALF_DOWN = 5
// Decimal.ROUND_HALF_EVEN = 6
// Decimal.ROUND_HALF_CEIL = 7
// Decimal.ROUND_HALF_FLOOR = 8

const splitPence = new Decimal(9999)
  .times(50)
  .dividedBy(100)
  .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
  .toNumber() // 5000 (rounds £49.995 to £50.00 in pence: 4999.5 → 5000)
```

### date-fns Frequency Advancement

```typescript
// Source: date-fns v4.1.0 (verified against npm registry 2026-03-25)
import { addDays, addMonths, addYears } from 'date-fns'

function advanceByFrequency(date: Date, frequency: BillFrequency): Date {
  switch (frequency) {
    case 'weekly':      return addDays(date, 7)
    case 'biweekly':    return addDays(date, 14)
    case 'four_weekly': return addDays(date, 28)
    case 'monthly':     return addMonths(date, 1)  // clamps automatically
    case 'annual':      return addYears(date, 1)   // clamps Feb29 automatically
  }
}
```

### date-fns Month Range for getMonthlyBillCost

```typescript
// Source: date-fns v4.1.0 + endOfMonth returns 23:59:59.999 (verified from source)
import { endOfMonth, startOfMonth } from 'date-fns'

export function getMonthlyBillCost(bill: Bill, year: number, month: number): number {
  const monthStart = new Date(year, month - 1, 1)   // midnight, first of month
  const monthEnd = endOfMonth(monthStart)             // 23:59:59.999, last day
  const occurrences = getBillOccurrences(bill, monthStart, monthEnd)
  const total = occurrences.reduce(
    (acc, _) => acc.plus(bill.amountPence),
    new Decimal(0)
  )
  return total.toNumber()
}
```

### Monthly Bill Occurrence — Stable Baseline Pattern (Pitfall 1 prevention)

```typescript
// Advance using period count from original nextDueDate
// NOT from the last computed occurrence (prevents date drift)
export function getBillOccurrences(
  bill: Bill,
  startDate: Date,
  endDate: Date
): Date[] {
  const occurrences: Date[] = []
  const base = new Date(bill.nextDueDate)

  if (bill.frequency === 'monthly' || bill.frequency === 'annual') {
    // Period-count approach: avoids drift from repeated addMonths on clamped dates
    let i = 0
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const candidate = bill.frequency === 'monthly'
        ? addMonths(base, i)
        : addYears(base, i)
      if (candidate > endDate) break
      if (candidate >= startDate) occurrences.push(candidate)
      if (candidate < startDate || candidate <= endDate) i++
      else break
    }
  } else {
    // Day-based: addDays is exact, no drift possible
    let current = new Date(base)
    while (current < startDate) current = advanceByFrequency(current, bill.frequency)
    while (current <= endDate) {
      occurrences.push(new Date(current))
      current = advanceByFrequency(current, bill.frequency)
    }
  }
  return occurrences
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `parseFloat` / `toFixed` for monetary math | `decimal.js` with integer pence in/out | Industry standard | No float rounding bugs in multi-month projections |
| `moment.js` for date manipulation | `date-fns` v4 named imports | 2020 (moment deprecated); date-fns v4: 2024 | Tree-shakeable, no global mutations |
| `date-fns` default import from subpath (`import addDays from 'date-fns/addDays'`) | Named export from subpath (`import { addDays } from 'date-fns/addDays'`) or top-level (`import { addDays } from 'date-fns'`) | date-fns v3+ | Both work in v4; top-level import is cleanest |

**Deprecated/outdated:**
- `moment.js`: Deprecated by its own maintainers. Do not use.
- `decimal.js-light`: A smaller build of decimal.js with reduced features. Not appropriate when full arithmetic precision is needed.

---

## Open Questions

1. **`addMonths` date drift for `monthly` bills on 31st over many months**
   - What we know: `addMonths(new Date(2024, 0, 31), i)` for each `i` gives Jan31, Feb29, Mar31, Apr30... (period-count approach avoids drift correctly)
   - What's unclear: The period-count approach in the code example above has a logic error in the while loop that needs correction in implementation
   - Recommendation: The planner should specify the period-count loop carefully in the task. The key invariant is: `addMonths(originalNextDueDate, i)` for i = 0,1,2,... — never `addMonths(previousOccurrence, 1)`

2. **`BillSplit` handling in engine**
   - What we know: `bill_splits` table has `percentage: integer (0-100)` per member. CONTEXT.md mentions "Bill with 100% joint split to one member, 50/50 split" as a test case.
   - What's unclear: The engine's `Bill` interface in `types.ts` needs to decide whether to include splits. Since the disposable income formula costs the full bill amount (not user's share), splits may only be needed for display, not calculation.
   - Recommendation: Include `splits?: BillSplit[]` as optional in `Bill` interface; the core calculations use `amountPence` directly. `BillOccurrence` can expose the splits for UI use without affecting arithmetic.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `vitest.config.mts` (repo root) |
| Quick run command | `npx vitest run src/lib/engine/` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ENG-01 | Monthly income stored as integer pence | unit | `npx vitest run src/lib/engine/income.test.ts` | ❌ Wave 0 |
| ENG-02 | Disposable income = income − pots − bills | unit | `npx vitest run src/lib/engine/income.test.ts` | ❌ Wave 0 |
| ENG-02 | Negative disposable income returned (not clamped) | unit | `npx vitest run src/lib/engine/income.test.ts` | ❌ Wave 0 |
| ENG-02 | Monthly bill cost uses actual occurrence count | unit | `npx vitest run src/lib/engine/bills.test.ts` | ❌ Wave 0 |
| ENG-03 | forecastMonths returns N ForecastMonth entries | unit | `npx vitest run src/lib/engine/forecast.test.ts` | ❌ Wave 0 |
| ENG-03 | Cumulative balance compounds correctly over N months | unit | `npx vitest run src/lib/engine/forecast.test.ts` | ❌ Wave 0 |
| ENG-03 | n=1 and n=12 boundary values | unit | `npx vitest run src/lib/engine/forecast.test.ts` | ❌ Wave 0 |
| ENG-05 | Engine functions accept and return integer pence | unit | `npx vitest run src/lib/engine/` | ❌ Wave 0 |
| ENG-05 | No float arithmetic in engine (verified by type) | type-check | `npm run type-check` | ❌ Wave 0 |
| ENG-06 | 60+ tests pass with zero failures | unit | `npx vitest run src/lib/engine/` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run type-check`
- **Per wave merge:** `npm run type-check && npx vitest run`
- **Phase gate:** `npx vitest run` (full suite green, 60+ tests)

### Wave 0 Gaps

- [ ] `src/lib/engine/types.ts` — shared interfaces (no tests needed, but must exist before test files)
- [ ] `src/lib/engine/income.test.ts` — covers ENG-01, ENG-02
- [ ] `src/lib/engine/bills.test.ts` — covers ENG-02 (bill scheduling), ENG-05
- [ ] `src/lib/engine/pots.test.ts` — covers ENG-02 (pot allocation), ENG-05
- [ ] `src/lib/engine/forecast.test.ts` — covers ENG-03
- [ ] `npm install decimal.js date-fns` — neither package is currently installed

---

## Sources

### Primary (HIGH confidence)

- `src/lib/db/schema.ts` — exact `frequencyEnum` values and column names; confirmed `_pence` suffix convention
- `vitest.config.mts` — confirmed `globals: true`, `passWithNoTests: true`, `exclude: ['**/e2e/**']`; no test config changes needed
- `.planning/phases/04-financial-engine/04-CONTEXT.md` — all locked implementation decisions
- `github.com/MikeMcl/decimal.js` (decimal.mjs source, fetched 2026-03-25) — rounding mode constants (ROUND_HALF_UP = 4), arithmetic methods (plus/minus/times/dividedBy/toNumber)
- `github.com/date-fns/date-fns/src/addMonths/index.ts` (fetched 2026-03-25) — confirmed month-end clamping behaviour
- `github.com/date-fns/date-fns/src/endOfMonth/index.ts` (fetched 2026-03-25) — confirmed returns 23:59:59.999

### Secondary (MEDIUM confidence)

- npm registry `npm view decimal.js version` (2026-03-25) — confirmed 10.6.0 is current
- npm registry `npm view date-fns version` (2026-03-25) — confirmed 4.1.0 is current
- GitHub issue date-fns/date-fns#3506 — confirmed addMonths clamping is working-as-designed, not a bug

### Tertiary (LOW confidence)

- WebSearch: date-fns v4 named export patterns — multiple sources agree; still lower confidence because date-fns.org docs were unreachable during research (site loaded without content)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — both libraries verified on npm registry; versions confirmed 2026-03-25
- Architecture: HIGH — locked decisions from CONTEXT.md; engine pattern is well-established
- Pitfalls: HIGH (addMonths drift, endOfMonth time component) — verified from date-fns source code; MEDIUM (decimal.js import style) — based on README and general TypeScript module patterns
- Test infrastructure: HIGH — vitest.config.mts read directly; no changes needed

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable libraries; 30-day window)
