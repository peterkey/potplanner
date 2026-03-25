---
phase: 4
slug: financial-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 |
| **Config file** | `vitest.config.mts` (repo root — no changes needed) |
| **Quick run command** | `npx vitest run src/lib/engine/` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run type-check`
- **After every plan wave:** Run `npm run type-check && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green (`npx vitest run` passes, 60+ tests)
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 0 | ENG-05 | install | `npm ls decimal.js date-fns` | ❌ W0 | ⬜ pending |
| 4-01-02 | 01 | 0 | ENG-05 | type-check | `npm run type-check` | ❌ W0 | ⬜ pending |
| 4-01-03 | 01 | 0 | ENG-01, ENG-02 | unit | `npx vitest run src/lib/engine/income.test.ts` | ❌ W0 | ⬜ pending |
| 4-01-04 | 01 | 0 | ENG-02, ENG-06 | unit | `npx vitest run src/lib/engine/bills.test.ts` | ❌ W0 | ⬜ pending |
| 4-01-05 | 01 | 0 | ENG-02, ENG-05 | unit | `npx vitest run src/lib/engine/pots.test.ts` | ❌ W0 | ⬜ pending |
| 4-01-06 | 01 | 0 | ENG-03, ENG-06 | unit | `npx vitest run src/lib/engine/forecast.test.ts` | ❌ W0 | ⬜ pending |
| 4-02-01 | 02 | 1 | ENG-01 | unit | `npx vitest run src/lib/engine/income.test.ts` | ❌ W0 | ⬜ pending |
| 4-02-02 | 02 | 1 | ENG-02 | unit | `npx vitest run src/lib/engine/income.test.ts` | ❌ W0 | ⬜ pending |
| 4-03-01 | 03 | 1 | ENG-02 | unit | `npx vitest run src/lib/engine/bills.test.ts` | ❌ W0 | ⬜ pending |
| 4-03-02 | 03 | 1 | ENG-05 | type-check | `npm run type-check` | ❌ W0 | ⬜ pending |
| 4-04-01 | 04 | 1 | ENG-02 | unit | `npx vitest run src/lib/engine/pots.test.ts` | ❌ W0 | ⬜ pending |
| 4-05-01 | 05 | 2 | ENG-03 | unit | `npx vitest run src/lib/engine/forecast.test.ts` | ❌ W0 | ⬜ pending |
| 4-05-02 | 05 | 2 | ENG-06 | unit | `npx vitest run src/lib/engine/` (60+ tests) | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/engine/types.ts` — shared TypeScript interfaces (BillInput, PotInput, ForecastInput, ForecastMonth, BillOccurrence); no tests needed but must exist before all test files import it
- [ ] `src/lib/engine/income.test.ts` — stub test file for ENG-01, ENG-02 (income + disposable income tests)
- [ ] `src/lib/engine/bills.test.ts` — stub test file for bill scheduling, frequency handling, ENG-02, ENG-05
- [ ] `src/lib/engine/pots.test.ts` — stub test file for pot allocation validation, ENG-02, ENG-05
- [ ] `src/lib/engine/forecast.test.ts` — stub test file for N-month projection, ENG-03, ENG-06
- [ ] `npm install decimal.js date-fns` — neither package is installed; both are runtime deps, not devDeps

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
