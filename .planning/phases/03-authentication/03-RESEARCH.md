# Phase 3: Authentication - Research

**Researched:** 2026-03-24
**Domain:** JWT authentication, bcrypt/argon2 password hashing, Redis session blacklist, rate limiting, Next.js 16 proxy.ts
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can log in with email and password via shared household login | POST /api/auth/login route, bcryptjs compare, SignJWT → httpOnly cookie |
| AUTH-02 | User session persists across browser refresh (JWT stored in httpOnly cookie) | `maxAge` on Set-Cookie header; persistent cookie survives tab close |
| AUTH-03 | User can log out; token is invalidated via Redis blacklist | POST /api/auth/logout, extract jti claim, SETEX in Redis with TTL = remaining JWT lifetime |
| AUTH-04 | All app routes are protected — unauthenticated requests redirect to login | proxy.ts with `request.cookies.has('session')` check + matcher excluding /login and static assets |
| AUTH-05 | Login is rate-limited to prevent brute force (>5 attempts → 429) | rate-limiter-flexible + ioredis, RateLimiterRedis keyed by IP, max 5 points per 15-minute window |
| AUTH-06 | `verifySession()` is called in every DAL function before any DB access | `src/lib/auth/session.ts` — exports `verifySession()`, checks cookie + Redis blacklist + jwtVerify |
</phase_requirements>

---

## Summary

Phase 3 implements the full authentication stack for PotPlanner: login form, JWT issuance into an httpOnly cookie, Redis blacklist logout, route protection via proxy.ts, login rate limiting, and the `verifySession()` DAL guard. The architecture is already designed and enshrined in CLAUDE.md — this research confirms the correct library choices and exact API patterns to use.

The stack is entirely custom JWT (no Auth.js/NextAuth), using `jose` for signing/verification, `bcryptjs` for password hashing, `ioredis` for the Redis blacklist and rate limiter, and `rate-limiter-flexible` for brute-force protection. This avoids the complexity of Auth.js adapters while remaining appropriate for a single-household, single-user application.

The most critical architectural detail is the two-layer security model: `proxy.ts` is a redirect-only UX convenience (checks cookie existence only), while `verifySession()` in every DAL function is the actual security gate (verifies the JWT signature, checks the Redis blacklist, and throws if invalid). These two layers must never be confused.

**Primary recommendation:** Use `jose@6` + `bcryptjs@3` + `rate-limiter-flexible@10` + existing `ioredis@5`. Do NOT use `argon2` (requires native compilation) or Auth.js (unnecessary complexity for single-user household app). Do NOT use `jsonwebtoken` (incompatible with Next.js proxy.ts Node.js runtime in some edge configurations; jose is the idiomatic choice).

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jose | 6.2.2 | JWT signing (SignJWT) and verification (jwtVerify) | Web Crypto API-based, works in Node.js runtime, no native deps, tree-shakeable ESM; `jose` is already a transitive dep via shadcn MCP SDK |
| bcryptjs | 3.0.3 | Password hash comparison at login | Pure JavaScript — zero native compilation, no Docker build issues on `node:24-slim`; bcrypt algorithm is proven and widely understood |
| ioredis | 5.10.0 | Redis client for JWT blacklist and rate-limit counter | Already installed. Handles reconnection, pipeline, SETEX natively |
| rate-limiter-flexible | 10.0.1 | Brute-force rate limiting keyed by IP | Battle-tested library, `RateLimiterRedis` constructor works directly with ioredis client, built-in block duration |
| server-only | 0.0.1 | Build-time guard on server-only modules | Already installed; MUST be first import in all auth/dal/db files |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/bcryptjs | 3.0.0 | TypeScript types for bcryptjs | Add as devDependency alongside bcryptjs |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| bcryptjs | argon2 / @node-rs/argon2 | argon2 requires native binaries (node-gyp or NAPI); @node-rs/argon2 avoids node-gyp but is less battle-tested; bcryptjs is pure JS and has zero build risk in Docker |
| bcryptjs | bcrypt (native) | Native bcrypt is faster but requires build tools in Docker image; bcryptjs is fine for a single-household app with 1 user |
| jose | jsonwebtoken | jsonwebtoken uses CommonJS and requires Node.js crypto module; jose is ESM, aligns with Next.js 16 module system, and is used by Auth.js itself |
| rate-limiter-flexible | custom Redis INCR | Custom INCR is ~15 lines but misses sliding window accuracy and block-duration semantics; rate-limiter-flexible handles all edge cases |
| Custom JWT auth | Auth.js (NextAuth v5) | Auth.js adds adapter/session complexity for a design that does not need OAuth or multi-user; custom JWT is 3 files and fully transparent |

**Installation (new packages only — jose and ioredis already installed):**
```bash
npm install bcryptjs rate-limiter-flexible
npm install --save-dev @types/bcryptjs
```

**Version verification (checked 2026-03-24):**
```
bcryptjs        3.0.3   (npm view bcryptjs version)
@types/bcryptjs 3.0.0   (npm view @types/bcryptjs version)
rate-limiter-flexible 10.0.1  (npm view rate-limiter-flexible version)
jose            6.2.2   (already transitive dep; npm view jose version)
ioredis         5.10.0  (already installed)
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   ├── auth/
│   │   ├── session.ts      # verifySession(), signSession(), destroySession()
│   │   └── rate-limit.ts   # loginRateLimiter singleton (RateLimiterRedis)
│   ├── dal/
│   │   └── auth.ts         # getUserByEmail() — queries users table
│   └── db/                 # (existing) schema.ts, index.ts
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       ├── page.tsx        # Login page (replace placeholder)
│   │       └── LoginForm.tsx   # Client component: email/password form
│   ├── (app)/
│   │   └── layout.tsx          # Already exists (calls verifySession())
│   └── api/
│       └── auth/
│           ├── login/
│           │   └── route.ts    # POST /api/auth/login
│           └── logout/
│               └── route.ts    # POST /api/auth/logout
└── proxy.ts                    # Route protection (redirect only)
```

### Pattern 1: JWT Issuance (login)

**What:** On successful credential check, sign a JWT with `jose.SignJWT`, set as httpOnly cookie.
**When to use:** In POST /api/auth/login route handler after bcryptjs.compare() returns true.

```typescript
// src/lib/auth/session.ts
// Source: https://github.com/panva/jose (SignJWT API, v6)
import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { nanoid } from 'nanoid' // or crypto.randomUUID()

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)
const COOKIE_NAME = 'session'
const JWT_EXPIRY = '7d'   // 7 days — persistent across browser sessions per AUTH-02
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days in seconds

export async function signSession(userId: number): Promise<void> {
  const jti = crypto.randomUUID() // unique ID for blacklist lookup
  const token = await new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: 'HS256' })
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(SECRET)

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE, // persistent cookie — survives browser restart (AUTH-02)
  })
}
```

### Pattern 2: JWT Verification with Redis Blacklist (verifySession)

**What:** Read the cookie, verify JWT signature, check Redis blacklist. Throw if any step fails.
**When to use:** First line of every DAL function (AUTH-06).

```typescript
// src/lib/auth/session.ts (continued)
// Source: https://github.com/panva/jose (jwtVerify API, v6)
import { redis } from '@/lib/redis' // ioredis singleton

export async function verifySession(): Promise<{ userId: number; jti: string }> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) {
    throw new Error('No session cookie')
  }

  let payload: { sub?: string; jti?: string }
  try {
    const result = await jwtVerify(token, SECRET)
    payload = result.payload
  } catch {
    throw new Error('Invalid or expired session token')
  }

  if (!payload.sub || !payload.jti) {
    throw new Error('Malformed token payload')
  }

  // Check Redis blacklist (AUTH-03: logout invalidation)
  const blacklisted = await redis.get(`blacklist:${payload.jti}`)
  if (blacklisted) {
    throw new Error('Token has been revoked')
  }

  return { userId: Number(payload.sub), jti: payload.jti }
}
```

### Pattern 3: Logout via Redis Blacklist (AUTH-03)

**What:** Extract `jti` from the cookie token, write it to Redis with a TTL matching the token's remaining lifetime.
**When to use:** POST /api/auth/logout route handler.

```typescript
// src/app/api/auth/logout/route.ts
import 'server-only'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { redis } from '@/lib/redis'
import { NextResponse } from 'next/server'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET)
      if (payload.jti && payload.exp) {
        const ttl = Math.max(0, payload.exp - Math.floor(Date.now() / 1000))
        // SETEX: key expires when the JWT would have expired anyway
        await redis.setex(`blacklist:${payload.jti}`, ttl, '1')
      }
    } catch {
      // Token already invalid — still clear the cookie
    }
  }

  cookieStore.delete('session')
  return NextResponse.redirect(new URL('/login', 'http://localhost')) // caller provides full URL
}
```

### Pattern 4: proxy.ts Route Protection (AUTH-04)

**What:** Check for session cookie existence. Redirect to /login if missing. This is UX only — NOT a security gate.
**When to use:** `src/proxy.ts` at the project root (alongside `src/` or at `src/proxy.ts`).

```typescript
// src/proxy.ts
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/proxy (v16.2.1)
import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuthenticated = request.cookies.has('session')

  if (!isAuthenticated && !pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Exclude: API routes (have their own auth), Next.js internals, static assets
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

### Pattern 5: Login Rate Limiting (AUTH-05)

**What:** Limit login attempts to 5 per 15-minute window per IP. Return 429 if exceeded.
**When to use:** At the top of POST /api/auth/login before any DB work.

```typescript
// src/lib/auth/rate-limit.ts
// Source: https://www.npmjs.com/package/rate-limiter-flexible (v10)
import 'server-only'
import { RateLimiterRedis } from 'rate-limiter-flexible'
import { redis } from '@/lib/redis'

export const loginRateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'login_fail',
  points: 5,           // 5 attempts
  duration: 60 * 15,  // per 15-minute window
  blockDuration: 60 * 15, // block for 15 minutes after limit exceeded
})
```

```typescript
// In POST /api/auth/login route.ts — before password check:
import { headers } from 'next/headers'
import { loginRateLimiter } from '@/lib/auth/rate-limit'

const headerStore = await headers()
const ip = headerStore.get('x-forwarded-for') ?? headerStore.get('x-real-ip') ?? 'unknown'

try {
  await loginRateLimiter.consume(ip)
} catch {
  return NextResponse.json({ error: 'Too many attempts' }, { status: 429 })
}
```

### Pattern 6: ioredis Singleton

**What:** A single ioredis client shared by session blacklist and rate limiter.
**When to use:** `src/lib/redis.ts` — imported by auth/session.ts and auth/rate-limit.ts.

```typescript
// src/lib/redis.ts
import 'server-only'
import { Redis } from 'ioredis'

export const redis = new Redis(process.env.REDIS_URL!)
```

### Pattern 7: DAL Authorization Guard (AUTH-06)

Every DAL function must call `verifySession()` as its first action:

```typescript
// src/lib/dal/accounts.ts (example for Phase 5 — shown here as the pattern)
import 'server-only'
import { verifySession } from '@/lib/auth/session'
import { db } from '@/lib/db'

export async function getAccounts() {
  await verifySession()   // REQUIRED — throws if unauthenticated
  return db.select().from(accounts)
}
```

For Phase 3 itself, `src/lib/dal/auth.ts` needs `getUserByEmail()` — this DAL function does NOT call `verifySession()` (it is called before auth is established). Instead it is only called from the login route handler which has already checked the rate limiter.

### Anti-Patterns to Avoid

- **Relying on proxy.ts as the security gate:** proxy.ts checks cookie existence only — it does NOT verify the JWT signature or blacklist. A request with a forged or revoked cookie will pass proxy.ts. Only `verifySession()` in the DAL stops it.
- **Storing userId without jti in the JWT:** Without a `jti` claim, logout blacklisting is impossible. Always set `jti` at sign time.
- **Setting `session` cookie without `maxAge`:** Without `maxAge`, the cookie is a session cookie and dies on browser close, breaking AUTH-02. Always set `maxAge: 60 * 60 * 24 * 7`.
- **Using `secure: true` in development:** `secure: true` blocks the cookie on `http://localhost`. Use `secure: process.env.NODE_ENV === 'production'`.
- **Calling `new Redis()` multiple times:** Multiple ioredis instances exhaust the Redis connection pool. Export a singleton from `src/lib/redis.ts`.
- **Using `jsonwebtoken` instead of `jose`:** `jsonwebtoken` uses Node.js `crypto` module APIs that are not available in the same form as the Web Crypto API. `jose` is the maintained idiomatic choice for Next.js.
- **Missing `import 'server-only'` in auth files:** Without it, auth code can accidentally be bundled for the client. Every file in `src/lib/auth/` must start with this import.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT signing/verification | Custom HMAC with crypto module | jose SignJWT / jwtVerify | Handles expiry, jti, alg header, proper padding; manual HMAC misses claim validation |
| Rate limiting with Redis | Custom INCR + TTL logic | rate-limiter-flexible RateLimiterRedis | Handles atomic increment, block duration, race conditions, and key expiry correctly |
| Password hashing | crypto.createHash or custom bcrypt | bcryptjs.compare | bcryptjs handles salt extraction, work-factor version differences (2a/2b/2y) |
| Cookie management | Manual Set-Cookie headers | Next.js `cookies()` API | Handles encoding, path scoping, and works correctly with App Router streaming |

**Key insight:** The three hardest parts of auth are not the happy path — they are logout invalidation (requires a blacklist with correct TTL), rate limiting (requires atomic Redis operations), and cookie security flags (easy to misconfigure). Libraries handle these correctly; hand-rolled solutions almost never do on the first attempt.

---

## Common Pitfalls

### Pitfall 1: proxy.ts Location

**What goes wrong:** Creating `proxy.ts` at the project root when `src/` layout is used causes the file to not be recognised, or vice versa.
**Why it happens:** Next.js looks for `proxy.ts` either at the root OR at `src/proxy.ts`, depending on whether the project uses a `src/` directory.
**How to avoid:** This project uses `src/` layout (confirmed: `src/app/` exists). Create `src/proxy.ts`.
**Warning signs:** Routes are not redirecting despite proxy.ts code being correct.

### Pitfall 2: `await cookies()` — Next.js 16 async requirement

**What goes wrong:** Calling `cookies()` without `await` throws a runtime error in Next.js 16.
**Why it happens:** Next.js 16 made `cookies()`, `headers()`, `params`, and `searchParams` async-only.
**How to avoid:** Always `const cookieStore = await cookies()` then `cookieStore.get(...)`.
**Warning signs:** `TypeError: cookies() must be awaited` at runtime.

### Pitfall 3: Redis blacklist TTL must match JWT remaining lifetime

**What goes wrong:** Setting a fixed TTL (e.g. 7 days) instead of the JWT's remaining lifetime causes tokens to stay blacklisted long after they would have expired, consuming Redis memory unnecessarily.
**Why it happens:** Using a constant instead of computing `payload.exp - now`.
**How to avoid:** `const ttl = Math.max(0, payload.exp - Math.floor(Date.now() / 1000))` before `redis.setex(...)`.
**Warning signs:** Redis memory growing unboundedly; blacklist keys persisting after natural JWT expiry.

### Pitfall 4: Rate limiter keyed by body field (email) not IP

**What goes wrong:** Keying the rate limiter by email means an attacker can rotate emails to bypass the limit. Keying by IP is the baseline; add per-email keying as a secondary if desired.
**Why it happens:** Developers key by email thinking it's more targeted — but it's weaker alone.
**How to avoid:** Key by IP first: `await loginRateLimiter.consume(ip)`. The IP comes from `x-forwarded-for` header (set by Nginx in the Docker stack).
**Warning signs:** Rate limit can be bypassed by changing the email field in the request body.

### Pitfall 5: `secure` flag blocking login in local development

**What goes wrong:** `secure: true` on the session cookie causes the browser to reject it over `http://localhost`, making login appear to fail (cookie is set but not sent on subsequent requests).
**Why it happens:** `secure` means HTTPS-only. localhost is HTTP.
**How to avoid:** `secure: process.env.NODE_ENV === 'production'`.
**Warning signs:** Login succeeds (no error from route handler) but subsequent requests to `/` redirect back to `/login`.

### Pitfall 6: Importing `redis` client in proxy.ts

**What goes wrong:** proxy.ts in Next.js 16 runs on the Node.js runtime, and ioredis is technically compatible — BUT creating a persistent Redis connection in proxy.ts means every request starts/checks a connection. This is inefficient and may cause connection pool exhaustion.
**Why it happens:** Temptation to verify the JWT or check the blacklist in proxy.ts for "extra security".
**How to avoid:** proxy.ts MUST only check `request.cookies.has('session')`. JWT verification and blacklist checks happen in `verifySession()` in the DAL only.
**Warning signs:** Redis connection count growing with traffic; unnecessary Redis round-trips on static asset requests.

---

## Code Examples

Verified patterns from official sources:

### SignJWT — complete token creation

```typescript
// Source: https://github.com/panva/jose (README, v6.2.2)
import { SignJWT } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

const token = await new SignJWT({ sub: String(userId) })
  .setProtectedHeader({ alg: 'HS256' })
  .setJti(crypto.randomUUID())
  .setIssuedAt()
  .setExpirationTime('7d')
  .sign(secret)
```

### jwtVerify — signature check plus claim extraction

```typescript
// Source: https://github.com/panva/jose (README, v6.2.2)
import { jwtVerify } from 'jose'

try {
  const { payload } = await jwtVerify(token, secret)
  // payload.sub, payload.jti, payload.exp are available
} catch (err) {
  // JWTExpired, JWSSignatureVerificationFailed, JWTClaimValidationFailed
  throw new Error('Invalid token')
}
```

### RateLimiterRedis — consume and catch

```typescript
// Source: https://www.npmjs.com/package/rate-limiter-flexible (v10)
import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible'

try {
  await loginRateLimiter.consume(ip) // decrements remaining points
} catch (rateLimiterRes) {
  if (rateLimiterRes instanceof RateLimiterRes) {
    return NextResponse.json(
      { error: 'Too many login attempts. Try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(rateLimiterRes.msBeforeNext / 1000)),
        },
      }
    )
  }
  throw rateLimiterRes // unexpected error — rethrow
}
```

### bcryptjs — hash and compare

```typescript
// Source: https://www.npmjs.com/package/bcryptjs (v3.0.3)
import bcrypt from 'bcryptjs'

// Hash on user creation (not needed for Phase 3 — user is pre-seeded):
const hash = await bcrypt.hash(plaintext, 12)

// Compare on login:
const valid = await bcrypt.compare(plaintext, storedHash)
```

### proxy.ts — complete auth redirect (Next.js 16)

```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/proxy (v16.2.1, 2026-03-20)
import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuthenticated = request.cookies.has('session')

  if (!isAuthenticated && !pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` + `export function middleware()` | `proxy.ts` + `export function proxy()` | Next.js 16.0.0 (2025) | File must be renamed; function name must be `proxy`; codemod available |
| Edge Runtime (default for middleware) | Node.js runtime (default for proxy in v16) | Next.js 15.5.0 stable | ioredis and full Node.js APIs are now available in proxy.ts |
| `cookies()` synchronous | `cookies()` async — must `await` | Next.js 15 / 16 | All call sites must `await cookies()` |
| jsonwebtoken (CommonJS) | jose (ESM, Web Crypto) | Ongoing | jose is the current standard for Next.js JWT; used internally by Auth.js |
| bcrypt (native) for new projects | bcryptjs (pure JS) or @node-rs/argon2 | Ongoing | Zero native compilation; argon2 preferred by OWASP but bcryptjs is safe and simpler |

**Deprecated/outdated:**
- `middleware.ts`: Deprecated in Next.js 16.0.0 — use `proxy.ts` with `export function proxy()`.
- `jsonwebtoken`: Not recommended for new Next.js projects — prefer `jose`.

---

## Open Questions

1. **Seed user creation mechanism**
   - What we know: The `users` table exists with `email` and `password_hash` columns. AUTH-01 requires the household to log in — someone must have created the user record.
   - What's unclear: Is the seed user created by a Drizzle seed script, a one-time API endpoint, or manually via Drizzle Studio? REQUIREMENTS.md does not specify.
   - Recommendation: Create a `db:seed` npm script that inserts a single household user using bcryptjs to hash the password from `.env`. This is the simplest approach for a single-user household app. Add `HOUSEHOLD_EMAIL` and `HOUSEHOLD_PASSWORD` to `.env.example`.

2. **Login form UI component**
   - What we know: `src/app/(auth)/login/page.tsx` currently returns a placeholder. The login form is a client component (needs `useState` or `useActionState` for the form).
   - What's unclear: Whether to use a Server Action or a fetch to `/api/auth/login`. Server Actions would require the login route to be a Server Action rather than a route handler, which changes the rate-limiting approach slightly.
   - Recommendation: Use a standard `<form>` posting to `/api/auth/login` (route handler) via `fetch`. This keeps rate limiting simple (IP from headers) and the route handler pattern consistent with the logout route.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `vitest.config.mts` (repo root) |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run --coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | POST /api/auth/login returns 200 + sets session cookie on valid credentials | unit | `npx vitest run src/app/api/auth/login/route.test.ts` | ❌ Wave 0 |
| AUTH-01 | POST /api/auth/login returns 401 on wrong password | unit | `npx vitest run src/app/api/auth/login/route.test.ts` | ❌ Wave 0 |
| AUTH-02 | Session cookie has `maxAge` set (persistent) | unit | `npx vitest run src/lib/auth/session.test.ts` | ❌ Wave 0 |
| AUTH-03 | Logout writes jti to Redis blacklist | unit | `npx vitest run src/app/api/auth/logout/route.test.ts` | ❌ Wave 0 |
| AUTH-03 | verifySession() throws when jti is blacklisted | unit | `npx vitest run src/lib/auth/session.test.ts` | ❌ Wave 0 |
| AUTH-04 | Unauthenticated visit to app route redirects to /login | e2e | `npx playwright test e2e/auth.spec.ts` | ❌ Wave 0 |
| AUTH-04 | Authenticated visit to /login redirects to / | e2e | `npx playwright test e2e/auth.spec.ts` | ❌ Wave 0 |
| AUTH-05 | 6th login attempt within window returns 429 | unit | `npx vitest run src/app/api/auth/login/route.test.ts` | ❌ Wave 0 |
| AUTH-06 | verifySession() throws when no cookie is present | unit | `npx vitest run src/lib/auth/session.test.ts` | ❌ Wave 0 |
| AUTH-06 | verifySession() throws when JWT signature is invalid | unit | `npx vitest run src/lib/auth/session.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run type-check` (tsc --noEmit)
- **Per wave merge:** `npm run type-check && npx vitest run`
- **Phase gate:** Full suite + `npx playwright test` green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/lib/auth/session.test.ts` — covers AUTH-02, AUTH-03 (blacklist check), AUTH-06 (no cookie, bad sig)
- [ ] `src/app/api/auth/login/route.test.ts` — covers AUTH-01 (valid/invalid creds), AUTH-05 (rate limit 429)
- [ ] `src/app/api/auth/logout/route.test.ts` — covers AUTH-03 (Redis blacklist write)
- [ ] `e2e/auth.spec.ts` — covers AUTH-04 (redirect behaviour, replaces/extends smoke.spec.ts)
- [ ] `src/tests/mocks/redis.ts` — shared mock for ioredis (used by session + login tests)

---

## Sources

### Primary (HIGH confidence)

- https://nextjs.org/docs/app/api-reference/file-conventions/proxy — Next.js 16.2.1 official proxy.ts reference, checked 2026-03-20, direct WebFetch
- https://github.com/panva/jose — jose v6.2.2 GitHub README, SignJWT / jwtVerify API, direct WebFetch
- `npm view jose version` → 6.2.2 (verified 2026-03-24)
- `npm view bcryptjs version` → 3.0.3 (verified 2026-03-24)
- `npm view rate-limiter-flexible version` → 10.0.1 (verified 2026-03-24)
- `npm view @types/bcryptjs version` → 3.0.0 (verified 2026-03-24)

### Secondary (MEDIUM confidence)

- https://www.npmjs.com/package/rate-limiter-flexible — RateLimiterRedis constructor pattern, multiple sources agree
- https://www.npmjs.com/package/bcryptjs — bcryptjs.compare API pattern
- OWASP recommendation: argon2id preferred for new projects, bcryptjs with cost 12+ is acceptable — corroborated by multiple 2025 articles

### Tertiary (LOW confidence)

- WebSearch result re: Next.js 16 proxy.ts Node.js runtime + ioredis compatibility — stated in search result summary, consistent with official docs confirming Node.js runtime is now default

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified via `npm view`; jose/ioredis already in project; proxy.ts API confirmed from official Next.js 16.2.1 docs
- Architecture: HIGH — patterns match CLAUDE.md conventions verbatim; confirmed against official docs
- Pitfalls: HIGH — `await cookies()` async requirement is documented in CLAUDE.md and confirmed; proxy.ts location confirmed from official docs; Redis TTL pitfall is logic-verified

**Research date:** 2026-03-24
**Valid until:** 2026-06-24 (90 days — stable libraries, no major releases expected in this window)
