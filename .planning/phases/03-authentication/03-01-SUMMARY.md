---
phase: 03-authentication
plan: 01
subsystem: auth
tags: [jwt, redis, session, rate-limiting, server-only]
dependency_graph:
  requires:
    - ioredis (already installed)
    - server-only (already installed)
  provides:
    - src/lib/redis.ts (ioredis singleton)
    - src/lib/auth/session.ts (signSession, verifySession, destroySession)
    - src/lib/auth/rate-limit.ts (loginRateLimiter)
  affects:
    - All DAL functions (must call verifySession)
    - Login route handler (uses signSession + loginRateLimiter)
    - Logout route handler (uses destroySession)
tech_stack:
  added:
    - bcryptjs@3.0.3 (password comparison at login)
    - jose@6.2.2 (JWT sign/verify — was transitive, now explicit)
    - rate-limiter-flexible@10.0.1 (RateLimiterRedis brute-force protection)
    - "@types/bcryptjs@3.0.0" (TypeScript types)
  patterns:
    - server-only boundary on all auth files
    - ioredis singleton export pattern (mirrors db/index.ts)
    - httpOnly cookie with maxAge for persistent sessions
    - Redis SETEX blacklist with TTL matching JWT remaining lifetime
key_files:
  created:
    - src/lib/redis.ts
    - src/lib/auth/session.ts
    - src/lib/auth/rate-limit.ts
    - src/tests/mocks/redis.ts
    - src/lib/auth/__tests__/session.test.ts
  modified:
    - .env.example (added HOUSEHOLD_EMAIL, HOUSEHOLD_PASSWORD)
    - package.json (added bcryptjs, jose, rate-limiter-flexible)
decisions:
  - Use @vitest-environment node directive in session.test.ts to enable Web Crypto API compatibility (jose's TextEncoder/Uint8Array key handling requires Node.js crypto context, not jsdom)
metrics:
  duration: 3m 28s
  completed: "2026-03-24"
  tasks: 2
  files: 7
---

# Phase 3 Plan 1: Auth Infrastructure (Redis + JWT + Rate Limiter) Summary

**One-liner:** JWT session helpers (sign/verify/destroy) with ioredis blacklist, httpOnly cookie, 7-day persistence, and RateLimiterRedis at 5 attempts/15 min.

## What Was Built

The complete auth infrastructure layer that all subsequent auth plans depend on:

1. **`src/lib/redis.ts`** — ioredis singleton (`new Redis(REDIS_URL)`) with `import 'server-only'` boundary. Single export `redis` used by both session and rate limiter.

2. **`src/lib/auth/session.ts`** — Three exported async functions:
   - `signSession(userId)` — Signs HS256 JWT with sub/jti/iat/exp claims; sets httpOnly cookie with `maxAge: 604800` (AUTH-02 persistent session)
   - `verifySession()` — Reads cookie, verifies signature with jwtVerify, checks Redis blacklist via `redis.get('blacklist:<jti>')`, returns `{ userId, jti }` (AUTH-06 DAL guard)
   - `destroySession()` — Extracts jti from valid token, writes `redis.setex('blacklist:<jti>', ttl, '1')` with TTL = remaining JWT lifetime, then deletes cookie (AUTH-03)

3. **`src/lib/auth/rate-limit.ts`** — `loginRateLimiter` singleton: `RateLimiterRedis` with `points: 5`, `duration: 900`, `blockDuration: 900` (AUTH-05)

4. **`src/tests/mocks/redis.ts`** — Shared ioredis mock with `get`, `setex`, `del` vi.fn() methods

5. **`src/lib/auth/__tests__/session.test.ts`** — 7 passing unit tests covering all session helper paths

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Redis singleton, session helpers, rate limiter, .env.example | b731dad |
| 2 | Redis mock + 7 unit tests for session helpers (TDD green) | 52bfe65 |

## Verification

- `npm run type-check` — passes
- `npx vitest run src/lib/auth/__tests__/session.test.ts` — 7/7 tests pass
- All auth files contain `import 'server-only'` as first import

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added `@vitest-environment node` directive to test file**
- **Found during:** Task 2 (GREEN phase)
- **Issue:** jose's `SignJWT.sign()` failed in jsdom environment with `TypeError: payload must be an instance of Uint8Array`. The jsdom environment's Web Crypto API context causes the `TextEncoder` output to be treated as incompatible with jose's internal `FlattenedSign` constructor validation.
- **Fix:** Added `// @vitest-environment node` as the first line of `session.test.ts`. This switches the test file to the Node.js environment where `TextEncoder` output is correctly recognised as `Uint8Array` by jose's Web Crypto-based signing.
- **Files modified:** `src/lib/auth/__tests__/session.test.ts`
- **Commit:** 52bfe65

## Self-Check: PASSED
