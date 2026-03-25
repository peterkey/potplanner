---
phase: 5
slug: accounts-and-pots
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 |
| **Config file** | `vitest.config.mts` at repo root |
| **Quick run command** | `npx vitest run src/lib/dal/ src/app/actions/` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run type-check`
- **After every plan wave:** Run `npm run type-check && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 5-W0-mock | W0 | 0 | ACCT-01,02,03,POT-01,04,05 | unit | `npx vitest run src/tests/mocks/` | ❌ W0 | ⬜ pending |
| 5-ACCT-01 | accounts DAL | 1 | ACCT-01 | unit | `npx vitest run src/lib/dal/accounts.test.ts` | ❌ W0 | ⬜ pending |
| 5-ACCT-02 | accounts DAL | 1 | ACCT-02 | unit | `npx vitest run src/lib/dal/accounts.test.ts` | ❌ W0 | ⬜ pending |
| 5-ACCT-03 | accounts DAL | 1 | ACCT-03 | unit | `npx vitest run src/lib/dal/accounts.test.ts` | ❌ W0 | ⬜ pending |
| 5-POT-01 | pots DAL | 1 | POT-01 | unit | `npx vitest run src/lib/dal/pots.test.ts` | ❌ W0 | ⬜ pending |
| 5-POT-02 | engine | 1 | POT-02 | unit | `npx vitest run src/lib/engine/pots.test.ts` | ✅ | ⬜ pending |
| 5-POT-03 | engine | 1 | POT-03 | unit | `npx vitest run src/lib/engine/pots.test.ts` | ✅ | ⬜ pending |
| 5-POT-04 | pots DAL | 1 | POT-04 | unit | `npx vitest run src/lib/dal/pots.test.ts` | ❌ W0 | ⬜ pending |
| 5-POT-05 | pots DAL | 2 | POT-05 | unit | `npx vitest run src/lib/dal/pots.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/tests/mocks/db.ts` — shared Drizzle db mock (needed by both DAL test files)
- [ ] `src/lib/dal/accounts.test.ts` — stubs for ACCT-01, ACCT-02, ACCT-03 (with mocked db)
- [ ] `src/lib/dal/pots.test.ts` — stubs for POT-01, POT-04, POT-05 (with mocked db)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Accounts page renders with list + total balance | ACCT-03 | UI rendering, not logic | Navigate to /accounts; verify account rows and total row visible |
| Pots page renders with allocation counter | POT-02 | UI rendering + state | Navigate to /pots; enter income value; edit allocations; verify warning shown when over-allocated |
| Pot balance shown correctly (allocated - 0) | POT-03 | UI display | Navigate to /pots; verify each pot shows `allocatedPence / 100` as balance |
| Monthly reset sets all allocatedPence to 0 | POT-04 | UI action | Click reset; verify all pots show £0.00 allocated |
| FK cascade: delete pot with linked bill | POT-01 | DB constraint | Create pot, create bill linked to pot, delete pot; verify bill.pot_id becomes NULL |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
