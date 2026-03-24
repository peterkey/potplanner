---
phase: 3
slug: authentication
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
| **Config file** | `vitest.config.mts` |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run && npm run type-check` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run && npm run type-check`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | AUTH-01 | unit | `npx vitest run src/lib/auth` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 1 | AUTH-01 | unit | `npx vitest run src/lib/auth` | ❌ W0 | ⬜ pending |
| 3-01-03 | 01 | 1 | AUTH-02 | unit | `npx vitest run src/lib/auth` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 2 | AUTH-03 | unit | `npx vitest run src/lib/dal` | ❌ W0 | ⬜ pending |
| 3-02-02 | 02 | 2 | AUTH-04 | unit | `npx vitest run src/lib/dal` | ❌ W0 | ⬜ pending |
| 3-03-01 | 03 | 3 | AUTH-05 | unit | `npx vitest run src/app/api` | ❌ W0 | ⬜ pending |
| 3-03-02 | 03 | 3 | AUTH-06 | unit | `npx vitest run src/app/api` | ❌ W0 | ⬜ pending |
| 3-04-01 | 04 | 4 | AUTH-04 | e2e | `npx playwright test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/auth/__tests__/session.test.ts` — stubs for AUTH-01, AUTH-02
- [ ] `src/lib/dal/__tests__/auth.test.ts` — stubs for AUTH-03, AUTH-04
- [ ] `src/app/api/auth/__tests__/login.test.ts` — stubs for AUTH-05, AUTH-06
- [ ] `src/tests/auth.spec.ts` — Playwright e2e stub for AUTH-04

*Existing Vitest and Playwright infrastructure from Phase 2 covers test running.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Redis blacklist invalidation (cookie replay) | AUTH-03 | Requires capturing a real httpOnly cookie and replaying it after logout | 1. Log in; 2. Copy session cookie from DevTools; 3. Log out; 4. Replay the cookie in a direct request — should get 401 |
| Rate limiting (5+ failed attempts → 429) | AUTH-05 | Requires real Redis and IP-based rate limiting | Send 6 bad login requests from the same IP, confirm 6th returns 429 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
