---
phase: 03-authentication
plan: "03"
subsystem: auth-ui
tags: [proxy, login-form, session-guard, e2e]
dependency_graph:
  requires: [03-01, 03-02]
  provides: [route-protection, login-ui, authenticated-layout]
  affects: [all-app-routes]
tech_stack:
  added: []
  patterns: [proxy-redirect-only, verifySession-layout-guard, client-fetch-form]
key_files:
  created:
    - src/proxy.ts
    - src/components/login-form.tsx
    - src/app/(app)/page.tsx
  modified:
    - src/app/(auth)/login/page.tsx
    - src/app/(app)/layout.tsx
    - e2e/smoke.spec.ts
    - vitest.config.mts
decisions:
  - proxy.ts is redirect-only (no JWT verification) — verifySession() in (app)/layout.tsx is the real security gate
  - LoginForm uses native inputs + shadcn Button; shadcn Input deferred to later phases
  - e2e smoke tests cover redirect, form rendering, and invalid-credential error; valid-credential test deferred until seeded DB available
metrics:
  duration_seconds: 134
  completed_date: "2026-03-24"
  tasks_completed: 2
  tasks_total: 3
  files_created: 3
  files_modified: 4
---

# Phase 03 Plan 03: Route Protection, Login UI, and Auth Layout Guard Summary

**One-liner:** Proxy redirect layer, client-side login form, and verifySession() layout guard connecting Plans 01-02 auth backend to the browser.

## What Was Built

All user-facing authentication wiring across five files:

- **src/proxy.ts** — Next.js 16 redirect proxy (function named `proxy`, not `middleware`). Checks for the `session` cookie and redirects unauthenticated requests to `/login`. Does not import `server-only`, does not touch Redis or JWT — redirect-only by design.

- **src/components/login-form.tsx** — `'use client'` component. Manages `email`, `password`, `error`, and `loading` state. Submits to `POST /api/auth/login`, handles 200/401/429/other responses, displays errors via `role="alert"` paragraph, uses shadcn `<Button>`.

- **src/app/(auth)/login/page.tsx** — Login page wrapper. Centers the form, renders "PotPlanner" heading with subtitle, renders `<LoginForm />`.

- **src/app/(app)/layout.tsx** — Async layout that calls `verifySession()` before rendering children. Catches failures and `redirect('/login')`. This is the DAL-level security gate (AUTH-06).

- **src/app/(app)/page.tsx** — Placeholder authenticated home page with "Dashboard" heading.

- **e2e/smoke.spec.ts** — Expanded from single placeholder test to three auth-aware tests: unauthenticated redirect, login page form element rendering, invalid-credential error display.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Exclude e2e/ directory from Vitest glob**
- **Found during:** Task 2 automated verification (`npx vitest run`)
- **Issue:** Vitest was picking up `e2e/smoke.spec.ts` in its default glob. The old smoke test used `test()` as a plain global (Playwright's `test` was accidentally shadowed by Vitest's global `test`). After Task 2 added `test.describe()` from `@playwright/test`, Vitest crashed because Playwright's `test` object is not Vitest's.
- **Fix:** Added `exclude: ['**/node_modules/**', '**/e2e/**']` to the `test` config in `vitest.config.mts`.
- **Files modified:** `vitest.config.mts`
- **Commit:** 5947c03

## Checkpoint Reached

Task 3 is a `checkpoint:human-verify` gate requiring human end-to-end verification of the full authentication flow (proxy redirect, login form, session persistence, Dashboard page). Automated pre-checks (`npx vitest run` and `npm run type-check`) both pass.

## Self-Check

### Files Created/Modified

- [x] src/proxy.ts — FOUND
- [x] src/components/login-form.tsx — FOUND
- [x] src/app/(auth)/login/page.tsx — FOUND (updated)
- [x] src/app/(app)/layout.tsx — FOUND (updated)
- [x] src/app/(app)/page.tsx — FOUND
- [x] e2e/smoke.spec.ts — FOUND (updated)
- [x] vitest.config.mts — FOUND (updated, auto-fix)

### Commits

- 16146c0 — feat(03-03): Task 1 — proxy.ts, login form, layout guard, home page
- b5159f2 — test(03-03): Task 2 — e2e smoke tests for auth flow
- 5947c03 — fix(03-03): auto-fix — exclude e2e/ from Vitest glob

## Self-Check: PASSED
