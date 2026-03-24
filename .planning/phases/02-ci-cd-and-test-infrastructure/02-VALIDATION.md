---
phase: 2
slug: ci-cd-and-test-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x (unit) + Playwright 1.58.x (E2E) |
| **Config file** | `vitest.config.mts` (unit) / `playwright.config.ts` (E2E — Wave 0 creates) |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run && npx playwright test` |
| **Estimated runtime** | ~30 seconds (unit) / ~60 seconds (E2E with app start) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run && npx playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds (unit), 90 seconds (E2E)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | SCAF-04 | lint | `npx eslint .` | ❌ W0 | ⬜ pending |
| 2-01-02 | 01 | 1 | SCAF-04 | type-check | `npm run type-check` | ✅ | ⬜ pending |
| 2-01-03 | 01 | 1 | SCAF-04 | unit | `npx vitest run` | ✅ | ⬜ pending |
| 2-01-04 | 01 | 1 | SCAF-04 | ci | `cat .github/workflows/ci.yml` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 2 | SCAF-07 | e2e | `npx playwright test` | ❌ W0 | ⬜ pending |
| 2-02-02 | 02 | 2 | SCAF-07 | e2e | `npx playwright test e2e/smoke.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `eslint.config.mjs` — flat config with `eslint-config-next`; satisfies SCAF-04 lint gate
- [ ] `playwright.config.ts` — webServer config, Chromium+Firefox, base URL; satisfies SCAF-07
- [ ] `e2e/smoke.spec.ts` — navigate to `/`, assert redirect to `/login`, assert login form present
- [ ] `.github/workflows/ci.yml` — two jobs: `test` and `e2e`; satisfies SCAF-04 and SCAF-07

*All four files are new — Wave 0 must create them before any verification commands can run.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| GitHub Actions run on PR | SCAF-04 | Requires GitHub push/PR | Open a PR to main; confirm Actions tab shows both `test` and `e2e` jobs pass |
| `hashFiles()` cache hits on re-run | SCAF-04 | CI cache state only visible in Actions UI | Re-run the workflow; confirm "Cache hit" in setup-node step logs |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
