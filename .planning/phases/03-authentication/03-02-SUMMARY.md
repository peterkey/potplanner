---
phase: 03-authentication
plan: "02"
subsystem: authentication
tags: [auth, dal, api-routes, seed, rate-limiting, bcrypt, jwt]
dependency_graph:
  requires: [03-01]
  provides: [login-endpoint, logout-endpoint, auth-dal, seed-script]
  affects: [src/app/(auth)/login, src/lib/dal/auth.ts]
tech_stack:
  added: []
  patterns:
    - DAL function without verifySession() — documented exception for pre-auth login flow
    - Rate limit before DB work to prevent timing attacks from DB latency
    - Uniform 401 message for both wrong-password and non-existent-email (no user enumeration)
    - onConflictDoUpdate for idempotent seed upsert
key_files:
  created:
    - src/lib/dal/auth.ts
    - src/app/api/auth/login/route.ts
    - src/app/api/auth/logout/route.ts
    - scripts/seed.ts
  modified:
    - package.json
decisions:
  - "getUserByEmail does not call verifySession() — login DAL is a documented exception since auth is not yet established at login time"
  - "Rate limit check placed before DB lookup to avoid timing side-channels from DB latency contributing to rate limit bypass"
  - "RateLimiterRes constructor called with undefined (not null) — required for TypeScript strict mode compatibility"
metrics:
  duration: "3 minutes"
  completed: "2026-03-24"
  tasks_completed: 2
  files_created: 4
  files_modified: 1
---

# Phase 3 Plan 02: Login/Logout Routes and Auth DAL Summary

One-liner: JWT login/logout HTTP endpoints with IP-based rate limiting (5 attempts/15 min), bcrypt credential comparison, and idempotent household user seed script.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create DAL auth function, login route, logout route, and seed script | 75442ab | src/lib/dal/auth.ts, src/app/api/auth/login/route.ts, src/app/api/auth/logout/route.ts, scripts/seed.ts, package.json |
| 2 | Unit tests for login and logout routes | ae3fe02 | src/app/api/auth/__tests__/login.test.ts, src/app/api/auth/__tests__/logout.test.ts |

## What Was Built

### src/lib/dal/auth.ts
Exports `getUserByEmail(email: string)` — the only DAL function without `verifySession()`. This is an intentional, documented exception: the function is called during login, before a session exists. The function uses a simple `db.select().from(users).where(eq(users.email, email))` query and returns `typeof users.$inferSelect | undefined`.

### src/app/api/auth/login/route.ts
POST handler implementing the full login flow:
1. Parse and validate email/password (400 if missing)
2. Rate limit by IP via `loginRateLimiter.consume(ip)` — 5 points/15 min, returns 429 with `Retry-After` header if exceeded
3. Lookup user via `getUserByEmail` — returns uniform 401 if not found (no user enumeration)
4. `bcrypt.compare(password, user.passwordHash)` — returns uniform 401 if mismatch
5. `signSession(user.id)` — signs JWT and sets httpOnly session cookie
6. Returns `{ success: true }` with 200

### src/app/api/auth/logout/route.ts
Minimal POST handler: calls `destroySession()` (which blacklists the JWT jti in Redis and clears the cookie), returns `{ success: true }` with 200.

### scripts/seed.ts
Standalone tsx script that loads `.env`, hashes `HOUSEHOLD_PASSWORD` with bcrypt cost 12, and upserts the household user via `onConflictDoUpdate` on the email column. Idempotent — safe to re-run. No `import 'server-only'` (runs outside Next.js).

### package.json
Added `"db:seed": "npx tsx scripts/seed.ts"` script.

## Verification Results

- `npm run type-check`: PASS
- `npx vitest run src/app/api/auth/__tests__/`: PASS (6 tests)
  - 200 on valid credentials + signSession called with userId
  - 401 on wrong password
  - 401 on non-existent email
  - 400 on missing fields
  - 429 on rate limit exceeded (with Retry-After header)
  - 200 on logout + destroySession called
- `npx vitest run src/lib/auth/__tests__/`: PASS (7 tests — Plan 01 session tests unbroken)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] RateLimiterRes constructor null -> undefined**
- **Found during:** Task 2 (type-check after writing tests)
- **Issue:** `new RateLimiterRes(0, 30000, 0, null)` fails TypeScript strict mode — 4th param is `boolean | undefined`, not `boolean | null`
- **Fix:** Changed `null` to `undefined` in test constructor call
- **Files modified:** src/app/api/auth/__tests__/login.test.ts
- **Commit:** ae3fe02 (included in task commit)

## Self-Check: PASSED

Files verified:
- FOUND: src/lib/dal/auth.ts
- FOUND: src/app/api/auth/login/route.ts
- FOUND: src/app/api/auth/logout/route.ts
- FOUND: scripts/seed.ts
- FOUND: src/app/api/auth/__tests__/login.test.ts
- FOUND: src/app/api/auth/__tests__/logout.test.ts

Commits verified:
- FOUND: 75442ab (feat(03-02))
- FOUND: ae3fe02 (test(03-02))
