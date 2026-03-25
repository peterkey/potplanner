# Phase 5: Accounts and Pots - Research

**Researched:** 2026-03-25
**Domain:** Next.js Server Actions + Drizzle ORM CRUD + shadcn UI components
**Confidence:** HIGH

## Summary

Phase 5 is well-grounded: the schema, engine functions, DAL pattern, and auth session all already exist. The work is primarily assembling known patterns into new DAL files, Server Actions, and page components. No new third-party libraries are needed. The only discretionary choice is UI layout (modal dialog vs inline form — research supports dialog as the standard shadcn pattern).

Server Actions are the confirmed mutation pattern (not Route Handlers). `revalidatePath` from `next/cache` is the standard cache invalidation mechanism after mutations — it re-fetches the page without a full navigation. The Drizzle CRUD API (insert/update/delete with `.returning()`) is stable and well-documented.

The income figure needed for the pots allocation counter has no persistent column in the schema. The simplest Phase 5 approach is a page-level state input that defaults to zero and is stored only in the session or a simple in-memory way — but the CONTEXT.md locks "a simple editable field is fine." Research recommends a `monthlyIncomePence` field on a new `settings` table OR as a process.env-seeded constant — but since the schema has no `settings` table and CONTEXT.md says "deferred to Phase 9", the safest Phase 5 approach is a local page state with `useState` that the user types into for the session. No DB persistence of income in Phase 5.

**Primary recommendation:** Build DAL + Server Actions + page components using the established `src/lib/dal/auth.ts` pattern. Use `revalidatePath` in every Server Action. Add shadcn `dialog`, `input`, `label`, `table`, `switch` components as needed.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Page Layout**
- Separate `/accounts` and `/pots` pages (not a combined page)
- Both pages linked from the `(app)` layout navigation
- Phase 9 will compose a unified dashboard; Phase 5 just makes each page functional

**CRUD Pattern**
- Use Server Actions (`'use server'`) for all mutations (create, update, delete, reset)
- Route Handlers only for public APIs — not used in Phase 5
- Server Actions live in `src/app/actions/accounts.ts` and `src/app/actions/pots.ts` (or colocated in page files if simple)
- All DAL functions call `verifySession()` before any query — no exceptions

**Income Allocation UX (Pots Page)**
- Inline editing: each pot row shows a pence/pounds input for `allocatedPence`
- Running total displayed at top: "Allocated: £X.XX / Income: £Y.YY" — updates as user edits
- Use `validatePotAllocations` from `src/lib/engine/pots.ts` to check if total exceeds income
- Show a warning (not a blocker) when total allocated exceeds income — user can still save
- Income figure comes from the engine's `monthlyIncomePence` — for Phase 5, stored as a simple value; the income-setting UI can be a simple input on the pots page or a settings-adjacent field (Claude's discretion on placement)

**Account Balance Display**
- Display `initialBalancePence` as the account balance in Phase 5
- Label it "Balance" (not "Initial Balance") — Phase 7 will derive actual balance from ledger
- Show individual account balances + a "Total: £X.XX" summary row at the bottom
- `initialBalancePence` is editable via the account edit form (ACCT-02)

**Pot Balance Display**
- Pot balance = `allocatedPence` (spent = 0 in Phase 5)
- Use `getPotBalance(allocatedPence, 0)` from engine for consistency
- Display per-pot balance as "Balance: £X.XX" below the allocation input
- Rollover field (`boolean`) exists in schema and must be settable per pot (POT-05) — show a toggle in the pot edit form, but no rollover logic in Phase 5

**Monthly Reset**
- Server Action: `resetPotAllocations()` — sets `allocatedPence = 0` on all pots
- Exposed via a "Reset month" button on the pots page (with confirmation dialog before executing)
- No cron in Phase 5 — manual trigger only

### Claude's Discretion
- Exact form layout (modal dialog vs inline form vs side panel)
- Loading/optimistic UI patterns
- Empty state design for no accounts / no pots
- Exact placement of income input (pots page header vs settings section)

### Deferred Ideas (OUT OF SCOPE)
- Ledger-derived account balance (sum of transfer_history entries) — Phase 7
- Cron-triggered monthly pot reset — Phase 9
- Income management as a first-class UI feature — Phase 9 dashboard polish
- Pot rollover carry-forward logic — v2
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ACCT-01 | User can create, edit, and delete bank accounts | DAL insert/update/delete + Server Actions + Dialog form pattern |
| ACCT-02 | User can set and update account balance | `initialBalancePence` is editable via account edit form; pence input converts to integer |
| ACCT-03 | User can view all accounts with individual and total balances | Server Component page reads all accounts via DAL; sum computed at render |
| POT-01 | User can create, edit, and delete pots (budget categories) | DAL insert/update/delete + Server Actions + Dialog form pattern |
| POT-02 | User can allocate an income amount to each pot | Inline edit of `allocatedPence`; `validatePotAllocations` engine function for warning |
| POT-03 | User can view pot balance (allocated minus spent) | `getPotBalance(allocatedPence, 0)` from engine; spent=0 in Phase 5 |
| POT-04 | Pots reset to zero at the start of each month (zero-based budgeting) | `resetPotAllocations()` Server Action with confirmation dialog; manual trigger |
| POT-05 | Schema includes rollover field per pot (carry-forward ready for v2) | `rollover` boolean already in schema; toggle rendered in edit form, persisted |
</phase_requirements>

---

## Standard Stack

### Core (already installed — no new installs needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 16.1.7 | Server Actions, Server Components, routing | Already in project |
| Drizzle ORM | 0.45.1 | Type-safe DB queries (insert/update/delete) | Already in project |
| React | 19.2.3 | `useActionState`, `useOptimistic`, `useFormStatus` | Already in project |
| shadcn/ui | 4.x (radix-nova) | Dialog, Input, Label, Table, Switch, Button | Already in project |
| `server-only` | 0.0.1 | Build-time guard for DAL files | Already in project |

### shadcn Components to Add

Only `button` is currently installed. The following components must be added via `npx shadcn add`:

| Component | Command | Purpose |
|-----------|---------|---------|
| dialog | `npx shadcn add dialog` | Create/edit forms as modal dialogs |
| input | `npx shadcn add input` | Form fields for name, amount |
| label | `npx shadcn add label` | Accessible form labels |
| table | `npx shadcn add table` | Account and pot list display |
| switch | `npx shadcn add switch` | Rollover toggle on pot edit form |
| alert | `npx shadcn add alert` | Over-allocation warning on pots page |

**Installation:**
```bash
npx shadcn add dialog input label table switch alert
```

**Version verification (confirmed 2026-03-25):**
- `shadcn`: 4.1.0 (npm registry current)
- `next`: 16.2.1 (npm registry) — project has 16.1.7; no action needed
- `drizzle-orm`: 0.45.1 (npm registry current, matches project)

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn Dialog | Inline form / side sheet | Dialog is standard shadcn pattern; less layout work |
| `useActionState` | `useState` + fetch | `useActionState` integrates with Server Actions natively; less boilerplate |
| `revalidatePath` | `router.refresh()` | `revalidatePath` is server-side; preferred for Server Actions |

---

## Architecture Patterns

### Recommended Project Structure (Phase 5 additions)

```
src/
├── app/
│   ├── (app)/
│   │   ├── layout.tsx          # ADD nav links: /accounts, /pots
│   │   ├── accounts/
│   │   │   └── page.tsx        # NEW — Server Component; fetches accounts
│   │   └── pots/
│   │       └── page.tsx        # NEW — Server Component; fetches pots
│   └── actions/
│       ├── accounts.ts         # NEW — Server Actions for accounts CRUD
│       └── pots.ts             # NEW — Server Actions for pots CRUD + reset
├── components/
│   ├── accounts/
│   │   ├── account-list.tsx    # NEW — Client Component for table + dialogs
│   │   └── account-form.tsx    # NEW — Client Component dialog form
│   └── pots/
│       ├── pot-list.tsx        # NEW — Client Component for pot rows + dialogs
│       └── pot-form.tsx        # NEW — Client Component dialog form
└── lib/
    └── dal/
        ├── accounts.ts         # NEW — getAccounts, createAccount, updateAccount, deleteAccount
        └── pots.ts             # NEW — getPots, createPot, updatePot, deletePot, resetPotAllocations
```

### Pattern 1: DAL Function (canonical pattern — mirrors existing `src/lib/dal/auth.ts`)

**What:** Every DAL function: `import 'server-only'` first, `verifySession()` at top, Drizzle query.
**When to use:** All database access — no exceptions.

```typescript
// src/lib/dal/accounts.ts
// Source: established project pattern + Drizzle ORM docs
import 'server-only'
import { verifySession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { accounts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function getAccounts() {
  await verifySession()
  return db.select().from(accounts).orderBy(accounts.createdAt)
}

export async function createAccount(name: string, initialBalancePence: number) {
  await verifySession()
  return db.insert(accounts).values({ name, initialBalancePence }).returning()
}

export async function updateAccount(id: number, name: string, initialBalancePence: number) {
  await verifySession()
  return db.update(accounts)
    .set({ name, initialBalancePence })
    .where(eq(accounts.id, id))
    .returning()
}

export async function deleteAccount(id: number) {
  await verifySession()
  return db.delete(accounts).where(eq(accounts.id, id))
}
```

### Pattern 2: Server Action with revalidatePath

**What:** `'use server'` file-level directive. Parse FormData, validate, call DAL, revalidate path, return state.
**When to use:** All mutations from the UI.

```typescript
// src/app/actions/accounts.ts
// Source: https://nextjs.org/docs/app/guides/forms (verified 2026-03-25)
'use server'

import { revalidatePath } from 'next/cache'
import { createAccount } from '@/lib/dal/accounts'

export type AccountActionState = { error?: string; success?: boolean }

export async function createAccountAction(
  _prevState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const name = formData.get('name')?.toString().trim()
  const balancePounds = formData.get('balancePounds')?.toString()

  if (!name) return { error: 'Name is required' }

  const balancePence = Math.round(parseFloat(balancePounds ?? '0') * 100)
  if (isNaN(balancePence)) return { error: 'Invalid balance' }

  try {
    await createAccount(name, balancePence)
    revalidatePath('/accounts')
    return { success: true }
  } catch {
    return { error: 'Failed to create account' }
  }
}
```

### Pattern 3: Server Component Page (data fetch + pass to Client Component)

**What:** Page is a Server Component that fetches data and passes it to a Client Component for interactivity.
**When to use:** Any page with CRUD UI.

```typescript
// src/app/(app)/accounts/page.tsx
// Source: Next.js App Router pattern — verified in project layout.tsx
import { getAccounts } from '@/lib/dal/accounts'
import { AccountList } from '@/components/accounts/account-list'

export default async function AccountsPage() {
  const accounts = await getAccounts()
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Accounts</h1>
      <AccountList accounts={accounts} />
    </div>
  )
}
```

### Pattern 4: Client Component with useActionState

**What:** `'use client'` component using React 19 `useActionState` to handle Server Action state and pending UI.
**When to use:** Any form that needs validation error display or pending state.

```typescript
// Source: https://nextjs.org/docs/app/guides/forms (verified 2026-03-25)
'use client'

import { useActionState } from 'react'
import { createAccountAction } from '@/app/actions/accounts'

const initialState = {}

export function CreateAccountForm() {
  const [state, formAction, pending] = useActionState(createAccountAction, initialState)

  return (
    <form action={formAction}>
      <input name="name" required />
      <input name="balancePounds" type="number" step="0.01" defaultValue="0" />
      {state.error && <p className="text-destructive">{state.error}</p>}
      <button type="submit" disabled={pending}>
        {pending ? 'Saving...' : 'Create'}
      </button>
    </form>
  )
}
```

### Pattern 5: Pots Reset Action

**What:** Sets `allocatedPence = 0` on all pots in a single Drizzle update.

```typescript
// src/lib/dal/pots.ts (excerpt)
export async function resetAllPotAllocations() {
  await verifySession()
  return db.update(pots).set({ allocatedPence: 0 })
}
```

### Pattern 6: Monetary Pence Input/Display

**What:** Convert pounds → pence on save; pence → pounds on display.
**When to use:** All monetary form fields.

```typescript
// Input: user types "12.50" → save as 1250
const pence = Math.round(parseFloat(formData.get('balancePounds') as string) * 100)

// Display: 1250 → "£12.50"
const display = (pence / 100).toFixed(2)  // "12.50"
const formatted = `£${(pence / 100).toFixed(2)}`
```

### Anti-Patterns to Avoid

- **DAL function without `verifySession()`:** Zero security. Every single function must call it.
- **Calling DAL from Client Component:** Client cannot import `server-only` files — will fail at build time.
- **Using Route Handler for mutations:** CONTEXT.md is explicit: Server Actions only for Phase 5.
- **Storing balance as float:** NEVER. Integer pence only. Round with `Math.round()`.
- **Updating `transfer_history` rows:** Append-only. Phase 5 does not write to `transfer_history` at all.
- **Using `middleware.ts`:** Project uses `proxy.ts` (Next.js 16). `middleware.ts` is the v15 name.
- **Custom webpack config:** Turbopack is the default; any `webpack()` in `next.config.ts` breaks `next build`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation state + pending UI | Custom hook + useState | `useActionState` (React 19) | Native integration with Server Actions; handles prevState automatically |
| Cache invalidation after mutation | `router.refresh()` | `revalidatePath('/accounts')` | Server-side; works without client navigation |
| Over-allocation warning | Custom sum logic | `validatePotAllocations` from `src/lib/engine/pots.ts` | Already implemented, tested, Decimal-safe |
| Pot balance calculation | Custom subtraction | `getPotBalance(allocatedPence, 0)` from engine | Consistent; Phase 6 just changes second arg |
| Modal form | Custom overlay | `shadcn Dialog` | Accessible, Radix-based, already configured in project |
| Pence formatting | Custom function | Inline `(pence / 100).toFixed(2)` | Simple enough; no library needed |

**Key insight:** The engine functions (`pots.ts`) already solve the financial arithmetic correctly with Decimal.js. The DAL pattern is established by `src/lib/dal/auth.ts`. The primary work is boilerplate assembly, not novel logic.

---

## Common Pitfalls

### Pitfall 1: Missing `verifySession()` in New DAL Functions

**What goes wrong:** Account or pot data returned to unauthenticated requests.
**Why it happens:** New file created by copying a template that omits it.
**How to avoid:** First thing written in every DAL function body, before any `db.*` call.
**Warning signs:** TypeScript won't catch it; only detectable by reviewing the function.

### Pitfall 2: Float Arithmetic on Pence

**What goes wrong:** `0.1 + 0.2 = 0.30000000000000004` stored as balance.
**Why it happens:** Developer parses user input as `parseFloat` and uses it directly.
**How to avoid:** Always `Math.round(parseFloat(input) * 100)` before storing. Engine functions use Decimal.js internally but their public API accepts and returns plain integers.
**Warning signs:** Pence values ending in digits other than 0 when they shouldn't.

### Pitfall 3: Forgetting `revalidatePath` After Mutation

**What goes wrong:** UI shows stale data after create/update/delete until full page reload.
**Why it happens:** Server Action mutates DB but doesn't tell Next.js the cached page is stale.
**How to avoid:** Every Server Action that writes to DB must call `revalidatePath('/accounts')` or `revalidatePath('/pots')` before returning.
**Warning signs:** Create an account, dialog closes, account not in list.

### Pitfall 4: `useActionState` Signature Mismatch

**What goes wrong:** Server Action receives unexpected first argument.
**Why it happens:** When used with `useActionState`, the Server Action signature gains `prevState` as first argument. If the action was written without `prevState`, the `formData` param receives the state object instead of FormData.
**How to avoid:** Server Actions used with `useActionState` MUST have signature `(prevState: State, formData: FormData)`.
**Warning signs:** `formData.get()` returns null for all fields.

### Pitfall 5: Income State Has No DB Persistence

**What goes wrong:** User refreshes pots page, income figure resets to 0.
**Why it happens:** CONTEXT.md specifies income as "simple value" without DB column; no `settings` table exists.
**How to avoid:** For Phase 5, income input is client-side `useState` on the pots page — explicitly document this limitation. Phase 9 will persist it.
**Warning signs:** User confusion about income resetting; this is expected Phase 5 behaviour.

### Pitfall 6: shadcn Dialog Close After Successful Action

**What goes wrong:** Dialog stays open after successful create/edit.
**Why it happens:** `useActionState` `success` flag is not wired to dialog's `open` state.
**How to avoid:** Use a `useEffect` watching `state.success` to call `setOpen(false)`.

---

## Code Examples

Verified patterns from official sources and project code:

### Drizzle Delete with eq()
```typescript
// Source: https://orm.drizzle.team/docs/update (verified 2026-03-25)
import { eq } from 'drizzle-orm'

await db.delete(accounts).where(eq(accounts.id, id))
```

### Drizzle Update with returning()
```typescript
// Source: https://orm.drizzle.team/docs/update (verified 2026-03-25)
await db.update(pots)
  .set({ allocatedPence: 0 })
  .where(eq(pots.id, id))
  .returning()
```

### Drizzle Bulk Update (reset all pots)
```typescript
// Source: Drizzle ORM docs — no .where() targets all rows
await db.update(pots).set({ allocatedPence: 0 })
```

### Server Action with bind() for ID passing
```typescript
// Source: https://nextjs.org/docs/app/guides/forms (verified 2026-03-25)
// Client Component:
const deleteWithId = deleteAccountAction.bind(null, account.id)
// <form action={deleteWithId}><button type="submit">Delete</button></form>

// Server Action:
export async function deleteAccountAction(id: number, _formData: FormData) {
  await deleteAccount(id)
  revalidatePath('/accounts')
}
```

### Using Engine Functions on Pots Page
```typescript
// Source: src/lib/engine/pots.ts (project file, confirmed)
import { sumPotAllocations, validatePotAllocations, getPotBalance } from '@/lib/engine/pots'

// On pots page (client component, react state):
const totalAllocated = sumPotAllocations(pots)  // integer pence
const validation = validatePotAllocations(monthlyIncomePence, pots)
// validation.valid === false → show warning banner

// Per pot balance display:
const balance = getPotBalance(pot.allocatedPence, 0)  // Phase 5: spent=0
```

### Pence Input Field Pattern
```tsx
{/* Display: pence → pounds string */}
<input
  name="balancePounds"
  type="number"
  step="0.01"
  min="0"
  defaultValue={(account.initialBalancePence / 100).toFixed(2)}
/>

{/* Server Action: pounds string → pence integer */}
const pence = Math.round(parseFloat(formData.get('balancePounds') as string) * 100)
```

### Rollover Toggle (Switch)
```tsx
{/* Pot edit form — rollover toggle */}
{/* Source: shadcn Switch component pattern */}
<Switch
  name="rollover"
  defaultChecked={pot.rollover}
/>

{/* Server Action: parse checkbox/switch value */}
const rollover = formData.get('rollover') === 'on'
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useFormState` (React) | `useActionState` (React 19) | React 19 / Next.js 15+ | `useFormState` removed; import from `react` not `react-dom` |
| `middleware.ts` | `proxy.ts` | Next.js 16 | File and export name changed — project already uses `proxy.ts` |
| `cookies()` sync | `await cookies()` | Next.js 15+ | Async only — project already awaits |
| `params` sync | `await params` | Next.js 15+ | Async only — relevant if any route uses `[id]` params |

**Deprecated/outdated:**
- `useFormState`: Removed in React 19. Use `useActionState` imported from `react`.
- `redirect()` inside try/catch: In Next.js 16, `redirect()` throws an error that must not be caught. Use `unstable_rethrow` if inside a catch block.

---

## Open Questions

1. **Income persistence in Phase 5**
   - What we know: No `settings` table exists; CONTEXT.md says "simple value" is fine for Phase 5
   - What's unclear: Whether client-side-only `useState` is acceptable UX (resets on refresh)
   - Recommendation: Implement as `useState` on pots page with a visible note; deferred DB persistence to Phase 9. Planner should scope this explicitly in a task.

2. **Account delete with referential integrity**
   - What we know: `transfer_history` has `source_id`/`destination_id` integer columns with no FK constraint to `accounts`; `bills` table has no account FK
   - What's unclear: Whether deleting an account that has transfer history should be blocked
   - Recommendation: No constraint exists in schema; Phase 5 can delete freely. Phase 7 (Transfer History) should address this. Planner should add a note, not a blocker.

3. **Pot delete with bills FK**
   - What we know: `bills.pot_id` references `pots.id` (foreign key in schema.ts line 50)
   - What's unclear: Whether deleting a pot with associated bills should cascade or be blocked
   - Recommendation: Phase 5 has no bills yet, so delete will succeed. However, the FK means Phase 6 bills with `pot_id` will block pot deletion. Add a `CASCADE` or `SET NULL` to the FK, or handle the error. Research finding: Drizzle schema supports `.references(() => pots.id, { onDelete: 'set null' })` — but changing this in Phase 5 requires a migration. Planner should include this as a Wave 0 migration task.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `vitest.config.mts` at repo root |
| Quick run command | `npx vitest run src/lib/dal/ src/app/actions/` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ACCT-01 | createAccount, updateAccount, deleteAccount DAL functions work correctly | unit | `npx vitest run src/lib/dal/accounts.test.ts` | ❌ Wave 0 |
| ACCT-02 | Account balance (initialBalancePence) can be set and updated via edit form | unit | `npx vitest run src/lib/dal/accounts.test.ts` | ❌ Wave 0 |
| ACCT-03 | getAccounts returns all accounts; sum is correct | unit | `npx vitest run src/lib/dal/accounts.test.ts` | ❌ Wave 0 |
| POT-01 | createPot, updatePot, deletePot DAL functions work | unit | `npx vitest run src/lib/dal/pots.test.ts` | ❌ Wave 0 |
| POT-02 | validatePotAllocations correctly identifies over-allocation | unit | Already covered by `src/lib/engine/pots.test.ts` | ✅ |
| POT-03 | getPotBalance(allocatedPence, 0) returns allocatedPence | unit | Already covered by `src/lib/engine/pots.test.ts` | ✅ |
| POT-04 | resetAllPotAllocations sets allocatedPence=0 on all rows | unit | `npx vitest run src/lib/dal/pots.test.ts` | ❌ Wave 0 |
| POT-05 | rollover boolean persists correctly via updatePot | unit | `npx vitest run src/lib/dal/pots.test.ts` | ❌ Wave 0 |

**Note on DAL tests:** DAL functions require a real PostgreSQL connection to test the query layer. The project has no test DB setup yet. Options:
1. **Mock the db module** (simpler for Phase 5): `vi.mock('@/lib/db', ...)` — tests verify the DAL calls correct Drizzle methods with correct args.
2. **Test DB via Docker** (more thorough): Add a test Postgres service; use in integration tests.
Recommendation: Mock-based DAL unit tests for Phase 5. Full integration tests deferred to Phase 7.

### Sampling Rate

- **Per task commit:** `npm run type-check`
- **Per wave merge:** `npm run type-check && npx vitest run`
- **Phase gate:** `npm run type-check && npx vitest run && npm run build`

### Wave 0 Gaps

- [ ] `src/lib/dal/accounts.test.ts` — covers ACCT-01, ACCT-02, ACCT-03 (with mocked db)
- [ ] `src/lib/dal/pots.test.ts` — covers POT-01, POT-04, POT-05 (with mocked db)
- [ ] `src/tests/mocks/db.ts` — shared Drizzle db mock (needed by both DAL test files)

---

## Sources

### Primary (HIGH confidence)

- Project source: `src/lib/db/schema.ts` — confirmed accounts/pots table shapes
- Project source: `src/lib/engine/pots.ts` — confirmed `sumPotAllocations`, `validatePotAllocations`, `getPotBalance` signatures
- Project source: `src/lib/dal/auth.ts` — canonical DAL pattern to replicate
- Project source: `src/lib/auth/session.ts` — confirmed `verifySession()` signature
- Official Next.js docs: https://nextjs.org/docs/app/guides/forms (version 16.2.1, updated 2026-03-20)
- Official Drizzle ORM docs: https://orm.drizzle.team/docs/insert — insert/returning patterns
- Official Drizzle ORM docs: https://orm.drizzle.team/docs/update — update/delete/eq patterns

### Secondary (MEDIUM confidence)

- npm registry: `drizzle-orm@0.45.1`, `shadcn@4.1.0`, `next@16.2.1` — current versions confirmed 2026-03-25
- Next.js caching docs: https://nextjs.org/docs/app/guides/caching-without-cache-components — `revalidatePath` usage confirmed

### Tertiary (LOW confidence)

- None — all critical claims verified against official sources or project code.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed; versions confirmed from npm registry
- Architecture: HIGH — patterns established by existing project code; Next.js Server Actions docs current as of 2026-03-20
- Pitfalls: HIGH — grounded in project conventions (CLAUDE.md), React 19 API changes (verified), and existing code patterns

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable libraries; Next.js 16.x patch releases unlikely to break these patterns)
