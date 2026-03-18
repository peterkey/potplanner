# Architecture Patterns

**Domain:** Personal finance / budgeting web app (household shared)
**Researched:** 2026-03-18
**Stack:** Next.js 15 App Router, PostgreSQL, Redis, Docker Compose, self-hosted

---

## Recommended Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                          │
│  React Client Components — interactive forms, charts, modals     │
└────────────────────────┬─────────────────────────────────────────┘
                         │ HTTP (cookie-authenticated)
┌────────────────────────▼─────────────────────────────────────────┐
│                   Next.js App (Node.js)                          │
│                                                                  │
│  proxy.ts              — JWT cookie check, route protection      │
│  app/(auth)/           — Login page (public)                     │
│  app/(app)/            — Protected route group                   │
│    dashboard/          — RSC: fetch + render summary             │
│    accounts/           — RSC + Client (forms)                    │
│    pots/               — RSC + Client                            │
│    bills/              — RSC + Client                            │
│    transactions/       — RSC + Client (filtered lists)           │
│  app/api/              — Route Handlers (REST-style CRUD)        │
│                                                                  │
│  lib/dal/              — Data Access Layer (auth-gated queries)  │
│  lib/session/          — JWT encrypt/decrypt, cookie helpers     │
│  lib/engine/           — Financial calculation engine (pure fns) │
│  lib/db/               — Drizzle ORM client + schema             │
│  lib/redis/            — ioredis client wrapper                  │
└──────┬────────────────────────────────┬───────────────────────────┘
       │ SQL (pg)                        │ Redis commands
┌──────▼────────┐              ┌─────────▼────────┐
│  PostgreSQL   │              │      Redis        │
│  (persistent) │              │  - JWT blacklist  │
│               │              │  - Session cache  │
│  accounts     │              │  - Query cache    │
│  pots         │              │    (optional)     │
│  bills        │              └──────────────────┘
│  transactions │
│  users        │
│  sessions*    │
└───────────────┘
* sessions table optional; JWT blacklist in Redis is the primary
  mechanism for logout / forced invalidation
```

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `proxy.ts` | Reads JWT cookie, verifies signature (no DB hit), redirects unauthenticated users from protected routes | Next.js routing layer |
| `lib/session/` | JWT sign/verify (jose), cookie set/delete, Redis blacklist check | Redis (blacklist), Next.js `cookies()` API |
| `lib/dal/` | Single source of truth for DB queries; always calls `verifySession()` first; returns DTOs not raw rows | PostgreSQL via Drizzle, `lib/session/` |
| `lib/engine/` | Pure TypeScript functions: pot allocation, bill scheduling, balance summaries, surplus/deficit calc | Nothing — no I/O, takes plain data objects, returns plain data objects |
| `lib/db/` | Drizzle ORM schema definitions + migration runner; exports `db` client | PostgreSQL |
| `lib/redis/` | ioredis client; exposes typed helpers (`blacklistToken`, `isBlacklisted`, `cacheGet`, `cacheSet`) | Redis |
| `app/api/` | Route Handlers for CRUD operations; validate request with Zod; call `lib/dal/`; run engine functions on results | DAL, engine, redis cache |
| RSC Pages (`app/(app)/*/page.tsx`) | Server-rendered data fetch via DAL; pass serializable data to Client Components | DAL |
| Client Components (`'use client'`) | Forms, charts, modals, interactive filters; call API routes via `fetch` | `app/api/` Route Handlers |

---

## Data Flow

### Read path (dashboard load)
```
Browser navigates to /dashboard
  → proxy.ts: verify JWT cookie signature (stateless, no Redis)
  → app/(app)/dashboard/page.tsx (RSC): calls verifySession() + DAL functions
  → DAL: db query → raw rows → engine functions → DTOs
  → RSC renders HTML with data as props to Client Components
  → Browser receives streamed HTML + RSC payload
```

### Write path (add transaction)
```
User submits form (Client Component)
  → POST /api/transactions (Route Handler)
  → verifySession() → Redis blacklist check → JWT decode
  → Zod validation of request body
  → DAL.createTransaction() → db.insert()
  → Invalidate relevant Redis cache keys
  → Return { success: true, data: DTO }
  → Client Component updates local state / triggers revalidation
```

### Logout path
```
User clicks logout
  → POST /api/auth/logout (Route Handler or Server Action)
  → Extract JWT jti (unique token ID) and exp from cookie
  → redis.blacklistToken(jti, remainingTTL)
  → cookies().delete('session')
  → Redirect to /login
```

### JWT + Redis blacklist flow
```
Every authenticated request:
  proxy.ts → verifyJWT(cookie) — signature check only, no Redis
  Route Handler / DAL → verifySession() — checks Redis blacklist by jti
  If jti in blacklist → 401 / redirect to login
```

This two-layer approach keeps proxy.ts fast (no Redis call on every prefetch)
while ensuring logout takes effect immediately at the API/data layer.

---

## Database Schema Patterns

### Core tables

```sql
-- Household / user identity
users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,           -- bcrypt
  display_name TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
)

-- Bank/cash accounts
accounts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL,             -- 'checking' | 'savings' | 'cash'
  currency    TEXT NOT NULL DEFAULT 'GBP',
  balance     NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
)

-- Budget pots (envelope budgeting)
pots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  UUID REFERENCES accounts(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  target_amount NUMERIC(12,2),           -- NULL = no limit
  current_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  colour      TEXT,                      -- UI display
  icon        TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
)

-- Recurring bills / standing orders
bills (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pot_id      UUID REFERENCES pots(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  amount      NUMERIC(12,2) NOT NULL,
  frequency   TEXT NOT NULL,             -- 'monthly' | 'weekly' | 'annual'
  due_day     INTEGER,                   -- day of month for monthly
  next_due_date DATE NOT NULL,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
)

-- Transactions
transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  UUID REFERENCES accounts(id) ON DELETE CASCADE,
  pot_id      UUID REFERENCES pots(id) ON DELETE SET NULL,
  bill_id     UUID REFERENCES bills(id) ON DELETE SET NULL,
  type        TEXT NOT NULL,             -- 'income' | 'expense' | 'transfer'
  amount      NUMERIC(12,2) NOT NULL,    -- always positive; type determines direction
  description TEXT,
  date        DATE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
)

-- Indexes for common queries
CREATE INDEX idx_transactions_account_date ON transactions(account_id, date DESC);
CREATE INDEX idx_transactions_pot_date     ON transactions(pot_id, date DESC);
CREATE INDEX idx_bills_next_due            ON bills(next_due_date) WHERE is_active = true;
```

**Household sharing model:** Because PotPlanner is a single-household app (all users see same data), there is no per-user data partitioning. The `users` table is for authentication only. No `household_id` foreign keys needed unless multi-household support is planned.

**Monetary precision:** Use `NUMERIC(12,2)` not `FLOAT`. Floating-point arithmetic is inappropriate for money. The financial engine must operate on integers (pence) or Decimal objects, never native JS floats.

---

## Financial Calculation Engine

The engine lives in `lib/engine/` as pure TypeScript functions with zero I/O.

### Structure

```
lib/engine/
  index.ts           — barrel export
  types.ts           — input/output types (no DB types)
  pots.ts            — pot allocation, available balance per pot
  bills.ts           — next due dates, upcoming total, overdue detection
  summary.ts         — account balance summaries, surplus/deficit
  projections.ts     — simple forward projection (burn rate)
```

### Design rules

1. Functions receive plain data objects (not Drizzle row types).
2. Functions return plain data objects.
3. No async. No side effects.
4. Monetary values: accept and return integers in the smallest currency unit (pence/cents). Conversion to/from display format happens at the boundary (DAL output or API response serializer).
5. 100% unit testable with Vitest — no mocking required.

### Example signature pattern

```typescript
// lib/engine/pots.ts
export type PotSummary = {
  potId: string
  name: string
  currentAmountPence: number
  targetAmountPence: number | null
  availablePence: number       // currentAmount minus upcoming bills in window
  fillPercentage: number | null
}

export function summarisePots(
  pots: PotInput[],
  upcomingBills: BillInput[],
  windowDays: number
): PotSummary[] { ... }
```

---

## API Route Organization

Convention: `app/api/[resource]/route.ts` for collections, `app/api/[resource]/[id]/route.ts` for single items.

```
app/api/
  auth/
    login/route.ts          POST — validate creds, issue JWT cookie
    logout/route.ts         POST — blacklist JWT, clear cookie
    me/route.ts             GET  — return current user DTO
  accounts/
    route.ts                GET (list), POST (create)
    [id]/route.ts           GET, PATCH, DELETE
  pots/
    route.ts                GET (list), POST (create)
    [id]/route.ts           GET, PATCH, DELETE
    [id]/transfer/route.ts  POST — move money between pots
  bills/
    route.ts                GET (list), POST (create)
    [id]/route.ts           GET, PATCH, DELETE
    upcoming/route.ts       GET — bills due in next N days (uses engine)
  transactions/
    route.ts                GET (list w/ filters), POST (create)
    [id]/route.ts           GET, PATCH, DELETE
  summary/
    route.ts                GET — household dashboard data (uses engine)
```

Each Route Handler follows this pattern:
```typescript
// app/api/pots/route.ts
import { verifySession } from '@/lib/dal'
import { getPots, createPot } from '@/lib/dal/pots'
import { CreatePotSchema } from '@/lib/validators/pots'

export async function GET() {
  const session = await verifySession()      // throws/redirects if invalid
  const pots = await getPots()
  return Response.json(pots)
}

export async function POST(request: Request) {
  const session = await verifySession()
  const body = await request.json()
  const parsed = CreatePotSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ errors: parsed.error.flatten() }, { status: 400 })
  }
  const pot = await createPot(parsed.data)
  return Response.json(pot, { status: 201 })
}
```

---

## Redis Usage Patterns

### 1. JWT blacklist (token invalidation on logout)

```
Key pattern:  blacklist:<jti>
Value:        "1"
TTL:          remaining seconds until token exp
```

Check on every authenticated API call (not in proxy — proxy does stateless sig verify only).

### 2. Query caching (optional, Phase 2+)

```
Key pattern:  cache:summary            (short TTL, 30s)
              cache:bills:upcoming     (short TTL, 60s)
Value:        JSON-serialised DTO
TTL:          30–120s depending on staleness tolerance
```

Invalidate on write: when a transaction or bill is created/updated, delete affected cache keys.

### 3. Rate limiting (auth endpoints)

```
Key pattern:  ratelimit:login:<ip>
Value:        counter (INCR)
TTL:          60s window
```

Reject at 10 failed attempts per minute per IP on `/api/auth/login`.

---

## Docker Compose Setup

### Services

```yaml
# docker-compose.yml (production)
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    image: potplanner:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://potplanner:${DB_PASSWORD}@postgres:5432/potplanner
      - REDIS_URL=redis://redis:6379
      - SESSION_SECRET=${SESSION_SECRET}
      - NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=${ACTIONS_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: potplanner
      POSTGRES_USER: potplanner
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U potplanner"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Dockerfile pattern (Next.js standalone output)

```dockerfile
FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
# next.config.js must have output: 'standalone'
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

`next.config.js` requires:
```js
module.exports = {
  output: 'standalone',
}
```

This produces a minimal image (~150MB) rather than bundling all `node_modules`.

---

## CI/CD with GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: potplanner_test
          POSTGRES_USER: potplanner
          POSTGRES_PASSWORD: testpassword
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports: ["6379:6379"]
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 5s
          --health-timeout 3s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npm run test:unit          # Vitest — engine pure functions
      - run: npm run test:integration   # Vitest — DAL + DB (test DB)
      - run: npm run build

  docker:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker image
        run: docker build -t potplanner:${{ github.sha }} .
      - name: Push to registry (optional)
        # configure registry credentials in GitHub secrets
        run: echo "Push step — configure per deployment target"
```

### Test strategy
- **Unit tests (Vitest):** `lib/engine/**` — pure functions, zero setup, fast.
- **Integration tests (Vitest + real PG/Redis):** `lib/dal/**` — run against CI service containers. No mocking of DB.
- **E2E tests (Playwright, optional):** Full user flows — login, create pot, add transaction. Run on pull requests against a Docker Compose stack.
- Async RSC cannot be reliably unit tested — use E2E for page-level verification (official Next.js guidance, HIGH confidence).

---

## CLAUDE.md / Project Scaffolding

`CLAUDE.md` lives at the project root. It is the mandatory first-read for any AI assistant or new developer.

### Recommended contents

```markdown
# PotPlanner — Developer Guide

## Project Overview
[2-3 sentence description]

## Architecture Quick Reference
- Framework: Next.js 15 App Router (RSC + Route Handlers)
- DB: PostgreSQL 16 via Drizzle ORM
- Cache/session: Redis 7 (ioredis)
- Auth: JWT (jose) stored in httpOnly cookie + Redis blacklist

## Key Conventions
- Monetary values: ALWAYS integers (pence). Never use JS float for money.
- Auth gate: ALL data access goes through lib/dal/ which calls verifySession().
- Financial logic: ALL calculations go through lib/engine/ pure functions.
- No direct DB calls in Route Handlers or components — use DAL.

## Running Locally
npm run dev          — Next.js dev server
docker compose up    — Full stack (PG + Redis)
npm run db:migrate   — Run pending Drizzle migrations
npm run db:studio    — Drizzle Studio (DB browser)

## Testing
npm run test         — Unit tests (Vitest)
npm run test:int     — Integration tests (requires running PG + Redis)

## Environment Variables
See .env.example for all required variables.
Never commit .env files.

## Adding a New Resource
1. Add table to lib/db/schema.ts
2. Generate migration: npm run db:generate
3. Add DAL functions in lib/dal/[resource].ts
4. Add Route Handler in app/api/[resource]/route.ts
5. Add Zod validator in lib/validators/[resource].ts
6. Add tests
```

---

## Suggested Build Order

Based on component dependencies:

| Phase | Deliverable | Why This Order |
|-------|-------------|----------------|
| 1 | Project scaffold, Docker Compose, CI skeleton | Everything else depends on working infra |
| 2 | DB schema + Drizzle setup + migrations | DAL cannot exist without schema |
| 3 | Auth system: JWT session, Redis blacklist, login/logout | All app features require auth |
| 4 | Financial engine (pure functions + tests) | Engine has no deps; tests prove correctness before wiring up |
| 5 | DAL: accounts, pots, bills, transactions | Wraps DB with auth guard; feeds API layer |
| 6 | API Route Handlers (CRUD per resource) | Consumed by UI; depends on DAL + validators |
| 7 | RSC pages + Client Components (UI) | Depends on API routes and session |
| 8 | Dashboard summary (engine integration) | Requires transactions + pots + bills data to exist |
| 9 | Docker production image + deployment | Finalises infra; requires working app |

**Critical dependency chain:**

```
Docker/Infra → DB Schema → Auth → Engine → DAL → API Routes → UI → Dashboard
```

The engine (Phase 4) can be built in parallel with auth (Phase 3) since it has no dependencies. This is the main parallelisation opportunity.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Direct DB calls in components or Route Handlers
**What:** `import { db } from '@/lib/db'` used directly in a page or API route.
**Why bad:** Bypasses auth gate in DAL; queries leak unguarded.
**Instead:** Always use `lib/dal/` functions that call `verifySession()` first.

### Anti-Pattern 2: Floating-point money arithmetic
**What:** `const total = 10.50 + 20.10` results in `30.599999...`
**Why bad:** Financial rounding errors accumulate; incorrect balances shown.
**Instead:** Store and compute in integer pence. Convert to display format at render time only.

### Anti-Pattern 3: JWT verification in proxy only
**What:** Treating proxy.ts as the sole auth check.
**Why bad:** Server Actions and direct API calls bypass proxy. Blacklisted tokens could still access data.
**Instead:** proxy.ts does stateless signature check (fast). DAL `verifySession()` does Redis blacklist check (authoritative).

### Anti-Pattern 4: Fat Route Handlers
**What:** Route Handlers containing business logic, calculations, and DB queries inline.
**Why bad:** Untestable, duplicated logic, auth gate inconsistently applied.
**Instead:** Route Handlers are thin: validate input (Zod) → call DAL → call engine if needed → return response.

### Anti-Pattern 5: Storing session data in Redis without blacklist TTL
**What:** Adding JWT jti to Redis blacklist with no expiry.
**Why bad:** Redis fills up over time with stale blacklist entries.
**Instead:** Set TTL equal to remaining JWT lifetime (`exp - now()`). Expired tokens are invalid by signature anyway.

### Anti-Pattern 6: Running DB migrations in Dockerfile CMD
**What:** `CMD ["sh", "-c", "npm run migrate && node server.js"]`
**Why bad:** Race conditions if multiple containers start simultaneously; migration failures kill the app.
**Instead:** Run migrations as a separate Docker Compose `command` step or GitHub Actions job that completes before app containers start. Use Drizzle's `migrate()` in an explicit startup script with a lock.

---

## Scalability Considerations

| Concern | At 1 household | At 10 households | At 1000+ households |
|---------|---------------|-----------------|---------------------|
| Auth | JWT stateless sig | Same + Redis blacklist | Same (Redis scales) |
| DB | Single PG instance | Same | Add read replica; partition by household |
| Redis | Single instance | Same | Redis Cluster |
| Caching | Optional | Recommended for summary | Required |
| Financial engine | Pure fns, fast | Same | Same (stateless, infinitely parallelisable) |

For PotPlanner's target use case (single household), the architecture above is sufficient. No pre-optimisation needed.

---

## Sources

- Next.js App Router Route Handlers: https://nextjs.org/docs/app/api-reference/file-conventions/route (verified, HIGH confidence)
- Next.js Authentication guide: https://nextjs.org/docs/app/guides/authentication (verified, HIGH confidence)
- Next.js Server/Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components (verified, HIGH confidence)
- Next.js Self-hosting guide: https://nextjs.org/docs/app/guides/self-hosting (verified, HIGH confidence)
- Next.js Project Structure: https://nextjs.org/docs/app/getting-started/project-structure (verified, HIGH confidence)
- Next.js Deploying: https://nextjs.org/docs/app/getting-started/deploying (verified, HIGH confidence)
- Next.js Testing: https://nextjs.org/docs/app/guides/testing (verified, HIGH confidence)
- Redis blacklist/cache patterns: standard industry patterns, MEDIUM confidence (no single authoritative source; verified against multiple Redis documentation descriptions)
- Docker Compose multi-service patterns: MEDIUM confidence (official docs inaccessible during research; based on widely established conventions + Next.js Docker examples)
- PostgreSQL NUMERIC for money: HIGH confidence (well-established convention; IEEE 754 floating-point unsuitability for currency is a documented property)
