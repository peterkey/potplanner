# Phase 5: Accounts and Pots - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

DAL + Server Actions + UI for managing bank accounts and budget pots. Users can create, edit, and delete accounts (with balance display) and pots (with income allocation). Pot balances are shown as allocated minus spent — spent is zero in this phase since bills arrive in Phase 6. Monthly reset logic is wired in this phase. This phase does not touch bills, transfer history, or the full dashboard.

</domain>

<decisions>
## Implementation Decisions

### Page Layout

- Separate `/accounts` and `/pots` pages (not a combined page)
- Both pages linked from the `(app)` layout navigation
- Phase 9 will compose a unified dashboard; Phase 5 just makes each page functional

### CRUD Pattern

- Use **Server Actions** (`'use server'`) for all mutations (create, update, delete, reset)
- Route Handlers only for public APIs — not used in Phase 5 (per CLAUDE.md convention)
- Server Actions live in `src/app/actions/accounts.ts` and `src/app/actions/pots.ts` (or colocated in page files if simple)
- All DAL functions call `verifySession()` before any query — no exceptions

### Income Allocation UX (Pots Page)

- Inline editing: each pot row shows a pence/pounds input for `allocatedPence`
- Running total displayed at top: "Allocated: £X.XX / Income: £Y.YY" — updates as user edits
- Use `validatePotAllocations` from `src/lib/engine/pots.ts` to check if total exceeds income
- Show a warning (not a blocker) when total allocated exceeds income — user can still save
- Income figure comes from the engine's `monthlyIncomePence` — for Phase 5, stored as a simple value; the income-setting UI can be a simple input on the pots page or a settings-adjacent field (Claude's discretion on placement)

### Account Balance Display

- Display `initialBalancePence` as the account balance in Phase 5
- Label it "Balance" (not "Initial Balance") — Phase 7 will derive actual balance from ledger, replacing this display
- Show individual account balances + a "Total: £X.XX" summary row at the bottom
- `initialBalancePence` is editable via the account edit form (ACCT-02: user can update balance)

### Pot Balance Display

- Pot balance = `allocatedPence` (spent = 0 in Phase 5; bills wire this in Phase 6)
- Use `getPotBalance(allocatedPence, 0)` from engine for consistency — makes Phase 6 wiring mechanical
- Display per-pot balance as "Balance: £X.XX" below the allocation input
- Rollover field (`boolean`) exists in schema and must be settable per pot (POT-05) — show a toggle in the pot edit form, but no rollover logic in Phase 5 (v2 feature)

### Monthly Reset

- Server Action: `resetPotAllocations()` — sets `allocatedPence = 0` on all pots
- Exposed via a "Reset month" button on the pots page (with confirmation dialog before executing)
- No cron in Phase 5 — manual trigger only; cron wiring deferred to Phase 9

### Claude's Discretion

- Exact form layout (modal dialog vs inline form vs side panel)
- Loading/optimistic UI patterns
- Empty state design for no accounts / no pots
- Exact placement of income input (pots page header vs settings section)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §Accounts — ACCT-01, ACCT-02, ACCT-03
- `.planning/REQUIREMENTS.md` §Pots — POT-01, POT-02, POT-03, POT-04, POT-05

### Architecture constraints
- `CLAUDE.md` §Security Rules — `verifySession()` in every DAL function, `import 'server-only'` in all DAL files
- `CLAUDE.md` §Architecture §Server-Only Boundaries — DAL files must never be client-bundled
- `CLAUDE.md` §Coding Conventions — Server Actions for mutations, Route Handlers only for public APIs
- `CLAUDE.md` §Database Rules — integer pence mandate, append-only ledger (accounts use `initialBalancePence`; no mutable balance column)

### Existing code to build on
- `src/lib/db/schema.ts` — `accounts` table (`id, name, initialBalancePence, createdAt`), `pots` table (`id, name, allocatedPence, rollover, createdAt`)
- `src/lib/engine/pots.ts` — `sumPotAllocations`, `validatePotAllocations`, `getPotBalance` — use these in UI and Server Actions
- `src/lib/engine/types.ts` — `Pot` interface mirrors schema shape
- `src/lib/dal/auth.ts` — canonical DAL pattern: `import 'server-only'`, `verifySession()` first
- `src/app/(app)/layout.tsx` — app layout with `verifySession()`; nav links for `/accounts` and `/pots` go here

### UI primitives
- `src/components/ui/` — shadcn components (Button, Input, Dialog, Table, etc.) — use existing primitives, do not re-implement

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/engine/pots.ts`: `sumPotAllocations(pots)`, `validatePotAllocations(incomePence, pots)`, `getPotBalance(allocatedPence, spentPence)` — call these in the pots Server Action and page component
- `src/lib/engine/types.ts`: `Pot` interface — mirrors schema; use as return type from DAL
- `src/components/ui/`: shadcn-generated components ready to compose
- `src/lib/dal/auth.ts`: DAL pattern to replicate for `accounts.ts` and `pots.ts`
- `src/app/(app)/layout.tsx`: app layout; add nav items here for accounts/pots pages

### Established Patterns
- DAL pattern: `import 'server-only'` first, then `verifySession()` at top of every function
- Monetary display: divide pence by 100, use `.toFixed(2)` for display — convert only at UI layer
- No mutable balance columns — `accounts` uses `initialBalancePence` (Phase 7 derives current balance from ledger)
- Server Actions for mutations (not Route Handlers)
- `(app)/` route group: all pages here are authenticated; layout handles redirect

### Integration Points
- `/accounts` and `/pots` pages added under `src/app/(app)/accounts/` and `src/app/(app)/pots/`
- New DAL files: `src/lib/dal/accounts.ts` and `src/lib/dal/pots.ts`
- New Server Action files: `src/app/actions/accounts.ts` and `src/app/actions/pots.ts`
- Nav added to `src/app/(app)/layout.tsx`
- Phase 6 (Bills) will import `src/lib/dal/pots.ts` to associate bills with pots — keep the DAL interface clean

</code_context>

<specifics>
## Specific Ideas

- Income figure needed for the allocation counter on the pots page — for Phase 5, a simple editable field (or hardcoded from env/config) is fine; Phase 9 polishes this into a full income management UI
- Rollover toggle on pot edit form must exist (POT-05 requirement) but has no behaviour in Phase 5 — just persist the boolean to schema

</specifics>

<deferred>
## Deferred Ideas

- Ledger-derived account balance (sum of transfer_history entries) — Phase 7
- Cron-triggered monthly pot reset — Phase 9
- Income management as a first-class UI feature — Phase 9 dashboard polish
- Pot rollover carry-forward logic — v2 (schema is v2-ready; UI toggle ships in Phase 5 but is inert)

</deferred>

---

*Phase: 05-accounts-and-pots*
*Context gathered: 2026-03-25*
