---
phase: 05-accounts-and-pots
plan: 01
subsystem: ui, database, api
tags: [drizzle-orm, shadcn, server-actions, next.js, react, typescript]

# Dependency graph
requires:
  - phase: 04-financial-engine
    provides: financial engine and db schema with accounts/pots tables
  - phase: 03-authentication
    provides: verifySession() and session management
provides:
  - DAL layer for accounts CRUD (getAccounts, createAccount, updateAccount, deleteAccount)
  - DAL layer for pots CRUD (getPots, createPot, updatePot, updatePotAllocation, deletePot, resetAllPotAllocations)
  - Server Actions for accounts mutations (createAccountAction, updateAccountAction, deleteAccountAction)
  - Server Actions for pots mutations (createPotAction, updatePotAction, deletePotAction, resetPotAllocationsAction, updatePotAllocationAction)
  - shadcn UI components: dialog, input, label, table, switch, alert, alert-dialog
  - NavLink client component with active path styling
  - App layout nav bar with /accounts and /pots links
affects: [05-02-accounts-page, 05-03-pots-page]

# Tech tracking
tech-stack:
  added: [dialog, input, label, table, switch, alert, alert-dialog (shadcn)]
  patterns: [Server Actions with useActionState signature, inline allocation action with direct params, DAL with verifySession guard]

key-files:
  created:
    - src/lib/dal/accounts.ts
    - src/lib/dal/pots.ts
    - src/app/actions/accounts.ts
    - src/app/actions/pots.ts
    - src/components/nav-link.tsx
    - src/components/ui/dialog.tsx
    - src/components/ui/alert-dialog.tsx
    - src/components/ui/input.tsx
    - src/components/ui/label.tsx
    - src/components/ui/table.tsx
    - src/components/ui/switch.tsx
    - src/components/ui/alert.tsx
  modified:
    - src/app/(app)/layout.tsx
    - src/components/ui/button.tsx

key-decisions:
  - "updatePotAllocationAction accepts (id, allocationPounds) directly — not via FormData — for inline allocation editing from pot table rows"
  - "deleteAccountAction and deletePotAction accept (id: number) directly since called via .bind(null, id) from client, not through useActionState"
  - "rollover parsed as formData.get('rollover') === 'on' — shadcn Switch submits 'on' when checked"
  - "Pence conversion uses Math.round(parseFloat(pounds) * 100) to prevent float rounding issues"

patterns-established:
  - "Server Action pattern: form actions use (prevState, formData) signature for useActionState compatibility"
  - "Direct Server Action pattern: delete/inline actions accept typed params for programmatic invocation via .bind()"
  - "DAL guard pattern: import 'server-only' first, await verifySession() first in every function body"

requirements-completed: [ACCT-01, ACCT-02, POT-01, POT-04, POT-05]

# Metrics
duration: 3min
completed: 2026-04-20
---

# Phase 5 Plan 01: Accounts and Pots — DAL, Server Actions, and Nav Summary

**shadcn UI components installed, DAL layer for accounts/pots CRUD with verifySession guards, and Server Actions for all mutations including inline allocation editing**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-20T10:21:26Z
- **Completed:** 2026-04-20T10:24:40Z
- **Tasks:** 3 (Task 0, Task 1, Task 2)
- **Files modified:** 14

## Accomplishments
- Installed 7 shadcn UI components (dialog, input, label, table, switch, alert, alert-dialog)
- Created DAL files for accounts (4 functions) and pots (6 functions), all guarded with `import 'server-only'` and `await verifySession()`
- Created Server Actions for all mutations: 3 for accounts, 5 for pots (including `resetPotAllocationsAction` and `updatePotAllocationAction` for inline editing)
- Added app layout navigation bar with "Accounts" and "Pots" links using NavLink client component with active state styling

## Task Commits

Each task was committed atomically:

1. **Task 0: Install shadcn UI components** - `367b587` (chore)
2. **Task 1: Create DAL files for accounts and pots** - `0c5ff80` (feat)
3. **Task 2: Create Server Actions, NavLink, and update app layout** - `2439a5b` (feat)

## Files Created/Modified
- `src/lib/dal/accounts.ts` - DAL with getAccounts, createAccount, updateAccount, deleteAccount
- `src/lib/dal/pots.ts` - DAL with getPots, createPot, updatePot, updatePotAllocation, deletePot, resetAllPotAllocations
- `src/app/actions/accounts.ts` - Server Actions for accounts mutations with revalidatePath
- `src/app/actions/pots.ts` - Server Actions for pots mutations including inline allocation action
- `src/components/nav-link.tsx` - Client component for active nav link styling via usePathname
- `src/app/(app)/layout.tsx` - Updated with nav bar containing Accounts and Pots links
- `src/components/ui/dialog.tsx` - shadcn Dialog component
- `src/components/ui/alert-dialog.tsx` - shadcn AlertDialog for confirm flows
- `src/components/ui/input.tsx` - shadcn Input
- `src/components/ui/label.tsx` - shadcn Label
- `src/components/ui/table.tsx` - shadcn Table
- `src/components/ui/switch.tsx` - shadcn Switch
- `src/components/ui/alert.tsx` - shadcn Alert

## Decisions Made
- `updatePotAllocationAction` accepts `(id: number, allocationPounds: string)` directly rather than FormData, since it is called programmatically from an inline input's onBlur handler, not via a `<form>` submission
- Delete actions accept `(id: number)` directly for use with `.bind(null, id)` from client components
- Rollover parsed as `formData.get('rollover') === 'on'` — shadcn Switch submits "on" when checked, not a boolean

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
- shadcn CLI prompted interactively to overwrite `button.tsx`; resolved by using `--overwrite` flag. Five components (input, label, table, switch, alert) were flagged as already existing with identical content — confirmed present and correct.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- DAL and Server Actions ready for consumption by Plan 02 (Accounts page) and Plan 03 (Pots page)
- shadcn components installed and available for use in UI pages
- App layout nav bar provides navigation between /accounts and /pots

---
*Phase: 05-accounts-and-pots*
*Completed: 2026-04-20*
