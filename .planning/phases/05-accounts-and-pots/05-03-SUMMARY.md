---
phase: 05-accounts-and-pots
plan: "03"
subsystem: ui
tags: [react, nextjs, shadcn, tailwind, server-components, server-actions, lucide]

requires:
  - phase: 05-01
    provides: DAL functions (getPots), Server Actions (createPotAction, updatePotAction, deletePotAction, resetPotAllocationsAction), engine functions (sumPotAllocations, validatePotAllocations, getPotBalance), shadcn components installed

provides:
  - /pots page Server Component fetching and rendering pots
  - PotList client component with income input, allocation summary, over-allocation warning, pot table, delete and reset confirmation dialogs
  - PotForm client component dialog for create/edit with rollover toggle (shadcn Switch)

affects: [phase-05-accounts-and-pots, phase-06-transactions]

tech-stack:
  added: []
  patterns:
    - "Server Component fetches data and passes to 'use client' component (same as accounts pattern)"
    - "useActionState from 'react' for Server Action forms with pending/error/success state"
    - "AlertDialog for destructive confirmation (delete/reset) before Server Action fires"
    - "Client-side income state (useState<number>) with pence conversion on input onChange"
    - "Engine functions (sumPotAllocations, validatePotAllocations, getPotBalance) used in client component after mapping DB shape to EnginePot type"

key-files:
  created:
    - src/app/(app)/pots/page.tsx
    - src/components/pots/pot-list.tsx
    - src/components/pots/pot-form.tsx
  modified: []

key-decisions:
  - "Income stored in client useState only (phase 5 limitation); no DB persistence until future phase"
  - "Balance display uses getPotBalance(allocatedPence, 0) with spentPence=0 — Phase 6 will wire real spent amount"
  - "PotRow extracted as separate component to isolate delete pending state per row"

patterns-established:
  - "PotRow as sub-component: isolates per-row delete pending state from parent list state"
  - "Shared header/income/summary/warning JSX extracted as named variables to avoid duplication between empty-state and populated branches"

requirements-completed:
  - POT-01
  - POT-02
  - POT-03
  - POT-04
  - POT-05

duration: 3min
completed: 2026-04-20
---

# Phase 5 Plan 03: Pots UI Summary

**Full pots management page with income allocation tracking, over-allocation warning, rollover toggle via shadcn Switch, and AlertDialog confirmation for delete and reset month**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-20T10:28:43Z
- **Completed:** 2026-04-20T10:31:07Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- /pots page Server Component fetches pots and passes to PotList client component
- PotList renders income input (client-side pence state), allocation summary line with amber warning when over-allocated, and pot table with balance column
- AlertDialog confirmations for both delete pot and reset month actions, with correct copy per UI-SPEC contract
- PotForm handles create and edit modes via useActionState, with shadcn Switch for rollover toggle (v2 feature helper text)

## Task Commits

1. **Task 1: Create pots page Server Component and PotList client component** - `403db7e` (feat)
2. **Task 2: Create PotForm dialog component for create and edit with rollover toggle** - `d78376a` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified

- `src/app/(app)/pots/page.tsx` - Server Component; fetches pots via getPots(), renders PotList
- `src/components/pots/pot-list.tsx` - Client component; income input, allocation summary, over-allocation alert, pot table, delete/reset AlertDialog flows, empty state
- `src/components/pots/pot-form.tsx` - Client component dialog; create/edit via useActionState, rollover Switch, auto-close on success

## Decisions Made

- Income stored in client `useState<number>(0)` only — no DB persistence in Phase 5 (plan-specified limitation). Persistence note shown to user below the input.
- Balance column uses `getPotBalance(pot.allocatedPence, 0)` with `spentPence=0` — Phase 6 will wire real transaction spending.
- `PotRow` extracted as a sub-component to give each row its own `deletePending` state, avoiding shared state in the parent list.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- POT-01 through POT-05 all satisfied
- /pots page fully functional for CRUD, income allocation tracking, rollover flag persistence, and monthly reset
- Ready for Phase 6 which will wire real transaction spending into the balance column (replacing the `spentPence=0` stub)

---
*Phase: 05-accounts-and-pots*
*Completed: 2026-04-20*
