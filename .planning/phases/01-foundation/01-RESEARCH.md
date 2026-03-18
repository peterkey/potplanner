# Phase 1: Foundation - Research

**Researched:** 2026-03-18
**Domain:** Next.js 16 App Router, Drizzle ORM, Docker Compose, shadcn/ui, MCP configuration
**Confidence:** HIGH (all major findings verified against live npm registry and official docs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Use `src/` directory; route groups `src/app/(app)/` and `src/app/(auth)/`
- Library organization: `src/lib/db/`, `src/lib/dal/`, `src/lib/auth/`, `src/lib/engine/`
- Components: `src/components/ui/` for shadcn, `src/components/` for app-specific
- `src/server/` for anything that must never reach the client
- Two Docker Compose files: `docker-compose.yml` (prod) and `docker-compose.dev.yml` (dev override)
- Services: `app` (Next.js standalone), `db` (PostgreSQL 16), `redis` (Redis 7), `nginx` (prod only)
- `output: 'standalone'` in next.config.ts — non-negotiable
- Named volumes: `postgres_data`, `redis_data`
- All services have health checks; `app` depends_on db+redis with `condition: service_healthy`
- Dev: volume-mount source for hot-reload, no Nginx, port 3000 direct
- Prod: Nginx terminates HTTP, no source mounts
- `.env` at repo root (gitignored), `.env.example` committed
- Define ALL domain tables in Phase 1 (users, accounts, pots, bills, bill_splits, transfer_history, debts, savings_goals)
- Monetary columns: always `integer` (pence) — never `decimal`, never `float`
- No mutable `current_balance` — balances derived from ledger
- Drizzle migrations via `drizzle-kit`; `npm run db:migrate` script
- CLAUDE.md sections: Stack, Architecture, Database Rules, Security Rules, Coding Conventions, Testing, Claude Code Workflow
- Context7 MCP, GitHub MCP, and Playwright MCP in `.mcp.json` at repo root
- Primary colour `#7c3aed` (violet) in shadcn theme from Phase 1

### Claude's Discretion

- Exact Nginx configuration (proxy_pass, headers, buffer sizes)
- Docker health check intervals and retry counts
- Exact Drizzle migration file naming and folder structure
- `.env.example` variable names and groupings
- Package manager choice (pnpm recommended)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCAF-01 | Project scaffolded with Next.js App Router + TypeScript, Drizzle ORM, shadcn/ui, correct Docker Compose setup (`output: 'standalone'`) | Next.js 16 create-next-app flags; Drizzle setup; shadcn init; standalone Dockerfile pattern |
| SCAF-02 | CLAUDE.md exists with project conventions, architecture decisions, security rules, and Claude Code workflow guidance | Content requirements fully defined in CONTEXT.md decisions |
| SCAF-03 | Docker Compose runs app + PostgreSQL + Redis + Nginx with health checks and correct startup order | Docker Compose patterns; depends_on conditions; health check syntax |
| SCAF-05 | Context7 MCP configured; GitHub MCP auth error resolved and documented | .mcp.json format; GitHub PAT setup; common auth error causes |
| SCAF-06 | Drizzle schema and migration tooling configured with integer pence columns and append-only ledger pattern | Drizzle column types; integer for pence; migration commands |
</phase_requirements>

---

## Summary

This is a greenfield Next.js 16 project. The jump from the assumed Next.js 15 to the current latest (16.1.7) introduces several breaking changes that must be handled from day one: synchronous Request APIs are fully removed, `middleware.ts` is renamed to `proxy.ts`, Turbopack is now the default bundler, and Node.js 20.9+ is now the minimum. All of these affect the initial scaffold and must be accounted for before writing any other code.

Drizzle ORM (0.45.1) and drizzle-kit (0.31.10) are stable and well-documented for PostgreSQL. The `integer` column type maps to PostgreSQL `INTEGER` (32-bit signed), which is correct for storing pence — it can hold values up to ~2.1 billion pence (~£21M), sufficient for personal household budgeting. The migration workflow is `drizzle-kit generate` then `drizzle-kit migrate`, with a `drizzle.config.ts` at repo root pointing to the schema.

The Docker standalone pattern for Next.js 16 is well-established: a three-stage build (dependencies → builder → runner) produces a minimal image running `node server.js` on port 3000. The official example uses Node 24.13.0-slim. Nginx configuration is straightforward reverse-proxy to the app container.

**Primary recommendation:** Scaffold with `create-next-app@latest` using `--typescript --tailwind --app --src-dir --no-eslint` flags, then immediately configure `output: 'standalone'` in next.config.ts before any other work, as this affects the entire build pipeline.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.7 | App framework | Project constraint; latest stable as of 2026-03-18 |
| react | 19.2.4 | UI runtime | Required by Next.js 16 |
| react-dom | 19.2.4 | DOM renderer | Required by Next.js 16 |
| typescript | 5.9.3 | Type safety | Project constraint; Next.js 16 requires TS 5.1+ |
| drizzle-orm | 0.45.1 | ORM | Project constraint; type-safe SQL, no runtime overhead |
| drizzle-kit | 0.31.10 | Migration CLI | Paired with drizzle-orm; generates SQL migration files |
| postgres (pg driver) | 3.4.8 | PostgreSQL driver | Drizzle's preferred driver for node-postgres; auto-detected |
| ioredis | 5.10.0 | Redis client | Mature, well-maintained; v5 still actively developed |
| server-only | 0.0.1 | Client boundary guard | npm package that throws build error if imported client-side |

### Supporting (UI & Tooling)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn (CLI) | 4.0.8 | Component scaffold CLI | Run once at init; adds components on demand |
| tailwindcss | 4.2.1 | CSS utility framework | Required by shadcn/ui |
| vitest | 4.1.0 | Unit test runner | Phase 1 config only; tests start in Phase 4 |
| @vitejs/plugin-react | 6.0.1 | Vitest React support | Needed for React component tests |
| vite-tsconfig-paths | 6.1.1 | Path alias resolution in tests | Resolves `@/` imports in test files |
| @testing-library/react | 16.3.2 | Component testing | Standard React testing utilities |
| @testing-library/dom | 10.4.1 | DOM queries | Used by @testing-library/react |
| jsdom | 29.0.0 | DOM environment for tests | Vitest `environment: 'jsdom'` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ioredis | node-redis v4 | node-redis v4 is simpler API but ioredis has better cluster/sentinel support; either works for this use case |
| postgres driver | @neondatabase/serverless | NeonDB driver is serverless-optimised; not needed for self-hosted Docker |

### Installation (production deps)

```bash
npm install next@latest react@latest react-dom@latest drizzle-orm postgres ioredis server-only
npm install -D drizzle-kit typescript @types/node @types/react @types/react-dom
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths
```

### Version verification

All versions verified against npm registry on 2026-03-18:
- `npm view next version` → 16.1.7
- `npm view drizzle-orm version` → 0.45.1
- `npm view drizzle-kit version` → 0.31.10
- `npm view react version` → 19.2.4
- `npm view ioredis version` → 5.10.0
- `npm view vitest version` → 4.1.0

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── (app)/           # Authenticated app pages (layout has session check)
│   │   └── layout.tsx
│   ├── (auth)/          # Login page (unauthenticated)
│   │   └── login/
│   │       └── page.tsx
│   ├── api/             # Route handlers
│   ├── globals.css      # Tailwind + shadcn CSS variables (violet theme)
│   └── layout.tsx       # Root layout
├── components/
│   ├── ui/              # shadcn generated components (git-tracked, owned by you)
│   └── (app-specific components)
├── lib/
│   ├── db/
│   │   ├── index.ts     # Drizzle client (server-only)
│   │   └── schema.ts    # All table definitions
│   ├── dal/             # Data access layer (all files: import 'server-only')
│   ├── auth/            # JWT helpers, session (import 'server-only')
│   └── engine/          # Pure financial functions (no I/O, pure TS)
└── server/              # Absolute server-only utilities (DB connection, etc.)
drizzle/                 # Migration SQL files (drizzle-kit output)
drizzle.config.ts        # Drizzle Kit configuration
next.config.ts           # Must include output: 'standalone'
vitest.config.mts        # Vitest configuration
docker-compose.yml       # Production stack
docker-compose.dev.yml   # Development overrides
.env.example             # Committed template
.env                     # Gitignored secrets
.mcp.json                # MCP server configuration (gitignored if contains tokens)
CLAUDE.md                # Architecture rules (committed)
```

### Pattern 1: Next.js 16 Standalone Configuration

**What:** `output: 'standalone'` makes Next.js emit `.next/standalone/` — a self-contained directory with only required runtime files. This is how Docker images stay small (~100-200MB vs 1GB+).

**When to use:** Always for Docker deployment.

```typescript
// Source: https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
}

export default nextConfig
```

### Pattern 2: server-only Boundary Enforcement

**What:** The `server-only` package causes a build-time error if a file importing it is ever bundled for the client. Add it to the top of any file in `src/lib/db/`, `src/lib/dal/`, `src/lib/auth/`.

**When to use:** All DAL files, DB client, session utilities, anything touching environment secrets.

```typescript
// Source: https://www.builder.io/blog/server-only-next-app-router
// src/lib/db/index.ts
import 'server-only'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

export const db = drizzle(process.env.DATABASE_URL!, { schema })
```

If a client component ever imports this file (directly or transitively), the build fails with:
```
Error: This module cannot be imported from a Client Component module.
```

### Pattern 3: Drizzle Schema with Integer Pence

**What:** All monetary values stored as `integer` (pence). The `integer()` type maps to PostgreSQL `INTEGER` (32-bit, max ~2.1 billion pence = ~£21M). Sufficient for household budgets. Never use `numeric()` or `real()` for monetary columns.

```typescript
// Source: https://orm.drizzle.team/docs/column-types/pg
// src/lib/db/schema.ts
import 'server-only'
import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  boolean,
  timestamp,
  pgEnum,
  real,
} from 'drizzle-orm/pg-core'

// Frequency enum for bills
export const frequencyEnum = pgEnum('frequency', [
  'weekly', 'biweekly', 'four_weekly', 'monthly', 'annual'
])

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  // Balance stored in pence — derived from transfer_history, but editable initial value
  initialBalancePence: integer('initial_balance_pence').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const pots = pgTable('pots', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  allocatedPence: integer('allocated_pence').notNull().default(0),
  rollover: boolean('rollover').notNull().default(false), // v2-ready
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const bills = pgTable('bills', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  amountPence: integer('amount_pence').notNull(),
  frequency: frequencyEnum('frequency').notNull(),
  potId: integer('pot_id').references(() => pots.id), // nullable = potless
  nextDueDate: timestamp('next_due_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const billSplits = pgTable('bill_splits', {
  id: serial('id').primaryKey(),
  billId: integer('bill_id').notNull().references(() => bills.id),
  memberName: varchar('member_name', { length: 255 }).notNull(),
  percentage: integer('percentage').notNull(), // 0-100, stored as integer
})

// Append-only: rows are NEVER updated or deleted
export const transferHistory = pgTable('transfer_history', {
  id: serial('id').primaryKey(),
  sourceType: varchar('source_type', { length: 50 }).notNull(), // 'account' | 'pot'
  sourceId: integer('source_id'),
  destinationType: varchar('destination_type', { length: 50 }).notNull(),
  destinationId: integer('destination_id'),
  amountPence: integer('amount_pence').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const debts = pgTable('debts', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  balancePence: integer('balance_pence').notNull(),
  interestRate: integer('interest_rate').notNull(), // basis points (e.g. 2500 = 25.00%)
  minimumPaymentPence: integer('minimum_payment_pence').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const savingsGoals = pgTable('savings_goals', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  targetPence: integer('target_pence').notNull(),
  potId: integer('pot_id').references(() => pots.id), // nullable
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

**Note on `interestRate`:** Storing as basis points (integer) avoids float arithmetic. 25.00% = 2500 basis points. Divide by 10000 for calculations.

### Pattern 4: Drizzle Configuration

```typescript
// Source: https://orm.drizzle.team/docs/get-started/postgresql-new
// drizzle.config.ts
import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './drizzle',
  schema: './src/lib/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

Migration scripts in `package.json`:
```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
```

### Pattern 5: Next.js 16 proxy.ts (formerly middleware.ts)

**BREAKING CHANGE IN NEXT.JS 16:** `middleware.ts` is renamed to `proxy.ts` and the export function must be named `proxy`. The file serves as a redirect-only layer — not a security gate (security is enforced via `verifySession()` in the DAL).

```typescript
// Source: https://nextjs.org/docs/app/guides/upgrading/version-16
// src/proxy.ts (NOT src/middleware.ts)
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

### Pattern 6: Docker Compose Stack

**What:** Two-file approach — `docker-compose.yml` for prod, `docker-compose.dev.yml` for dev overrides.

```yaml
# docker-compose.yml (production)
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build: .
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      REDIS_URL: redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    expose:
      - "3000"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - app

volumes:
  postgres_data:
  redis_data:
```

```yaml
# docker-compose.dev.yml (development overrides)
services:
  app:
    build:
      context: .
      target: dependencies  # Stop at deps stage for dev
    command: npm run dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    environment:
      NODE_ENV: development
  # nginx: not included in dev
```

### Pattern 7: Standalone Dockerfile

```dockerfile
# Source: https://github.com/vercel/next.js/tree/canary/examples/with-docker
ARG NODE_VERSION=24.13.0-slim

FROM node:${NODE_VERSION} AS dependencies
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN --mount=type=cache,target=/root/.npm \
  if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm install --frozen-lockfile; \
  fi

FROM node:${NODE_VERSION} AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN npm run build

FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
COPY --from=builder --chown=node:node /app/public ./public
RUN mkdir .next && chown node:node .next
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
```

### Pattern 8: MCP Configuration

```json
// .mcp.json (gitignore this file; commit .mcp.json.example without tokens)
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    },
    "github": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}
```

### Pattern 9: shadcn/ui Init and Violet Theme

```bash
# Source: https://ui.shadcn.com/docs/installation/next
pnpm dlx shadcn@latest init -t next
```

After init, override the primary CSS variables in `src/app/globals.css` to use violet `#7c3aed` (converted to OKLCH: approximately `oklch(0.499 0.252 278.7)`):

```css
/* src/app/globals.css */
@layer base {
  :root {
    --primary: oklch(0.499 0.252 278.7);     /* #7c3aed violet */
    --primary-foreground: oklch(0.985 0 0);  /* near-white */
  }
  .dark {
    --primary: oklch(0.638 0.252 278.7);     /* lighter violet for dark mode */
    --primary-foreground: oklch(0.985 0 0);
  }
}
```

The `baseColor` in `components.json` controls the neutral palette (grays). Set it to `slate` or `zinc` — the primary violet is applied separately via CSS variables. The `baseColor` cannot be changed after init without reinstalling components.

### Pattern 10: TypeScript Strict Mode

```json
// tsconfig.json — generated by create-next-app with --typescript
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,           // type-check without output
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  }
}
```

Type-check command: `npx tsc --noEmit`

### Anti-Patterns to Avoid

- **Using `middleware.ts` in Next.js 16**: The file must be `proxy.ts` with export `proxy`. Build will warn/error.
- **Synchronous `cookies()` or `headers()` access**: In Next.js 16, these are async-only. Always `await cookies()`.
- **`decimal` or `float` columns for money**: Use `integer` only. Float arithmetic causes rounding errors with pence.
- **Mutable balance columns**: Never add `current_balance` to accounts/pots. Derive from `transfer_history`.
- **`server-only` omitted from DAL**: Without it, secrets leak to the client bundle silently.
- **Custom webpack config without `--webpack` flag**: Next.js 16 defaults to Turbopack; custom webpack breaks the build unless you pass `--webpack` flag or remove the custom config.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Client boundary enforcement | Custom build plugin | `import 'server-only'` | Build-time error, zero runtime cost, official solution |
| Database migrations | Manual SQL scripts | `drizzle-kit generate` + `drizzle-kit migrate` | Handles schema diffing, timestamps, conflict detection |
| Docker image optimisation | Manually cherry-picking files | `output: 'standalone'` + official Dockerfile | Next.js traces exactly which files are needed; getting this wrong silently breaks the app |
| TypeScript path aliases in tests | Manual vite resolve config | `vite-tsconfig-paths` plugin | Single source of truth from tsconfig.json |

**Key insight:** The `server-only` package is the entire solution for client/server boundary enforcement. Adding `import 'server-only'` at the top of a file is sufficient — no custom eslint rules, no build plugins needed.

---

## Common Pitfalls

### Pitfall 1: Forgetting `output: 'standalone'` before first build
**What goes wrong:** The Docker image build looks fine but copies all of `node_modules` (1GB+) rather than the traced minimal set. The container still works but is enormous.
**Why it happens:** `output: 'standalone'` must be set before `next build` runs in the Docker build stage. Adding it after the fact requires a full rebuild.
**How to avoid:** Set it in `next.config.ts` as the very first configuration change, before installing any dependencies.
**Warning signs:** Docker image size > 500MB.

### Pitfall 2: Next.js 16 Breaking Changes Applied to v15 Patterns
**What goes wrong:** Code written for Next.js 15 patterns fails silently or with cryptic errors in Next.js 16.
**Why it happens:** Several breaking changes landed in v16:
  - `middleware.ts` → `proxy.ts` (function renamed too)
  - `cookies()`, `headers()`, `params`, `searchParams` are async-only (no sync access)
  - Turbopack is default — custom webpack config breaks `next build` unless `--webpack` flag is used
  - Node.js minimum is now 20.9.0 (affects Docker base image selection)
**How to avoid:** Use Node.js 20.9+ base image in Docker; use `proxy.ts`; always `await` dynamic request APIs.

### Pitfall 3: GitHub MCP Authentication Error
**What goes wrong:** MCP client reports "Bad credentials" or similar auth failure.
**Why it happens:** The GitHub MCP server (Docker version) requires `GITHUB_PERSONAL_ACCESS_TOKEN` environment variable with a `ghp_` prefixed PAT (not a GitHub App installation token, not `gho_`).
**How to avoid:** Create a classic PAT (not fine-grained) with `repo` scope. Set it in the shell environment before running Claude Code: `export GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxx`. Reference it via `${GITHUB_PERSONAL_ACCESS_TOKEN}` in `.mcp.json`, not hardcoded.
**Warning signs:** Error mentions "Bad credentials" or "Authorization header is badly formatted" — the latter means you used a GitHub App token instead of a PAT.

### Pitfall 4: Drizzle `integer` Overflow for Large Values
**What goes wrong:** Very large pence values exceed 32-bit integer range (~2.1B pence = ~£21M).
**Why it happens:** `integer()` in Drizzle maps to PostgreSQL `INTEGER` (32-bit). Household savings goals or debt values with large targets hit this ceiling.
**How to avoid:** For amounts that could plausibly exceed £20M (unlikely for household use), use `bigint('column', { mode: 'number' })`. For Phase 1, `integer()` is acceptable; document the limit in CLAUDE.md.
**Warning signs:** PostgreSQL `integer out of range` error.

### Pitfall 5: shadcn `baseColor` Cannot Be Changed Post-Init
**What goes wrong:** Developer wants to change the neutral palette (grays) after adding 20+ components.
**Why it happens:** `baseColor` in `components.json` bakes color variables into every generated component file. Changing it requires reinstalling all components.
**How to avoid:** Choose the neutral base color at init time. The primary violet is applied separately via CSS variable overrides in `globals.css` — this can be changed at any time without reinstalling components.
**Warning signs:** Color scheme looks wrong after changing `baseColor` post-init.

### Pitfall 6: Dev Docker Volume Mount Conflicts
**What goes wrong:** `docker compose -f docker-compose.yml -f docker-compose.dev.yml up` causes `.next/` build artifacts from host to conflict with in-container builds.
**Why it happens:** Mounting the entire source directory includes `.next/` which was built for a different OS/architecture.
**How to avoid:** Add anonymous volumes for `.next` and `node_modules` in the dev compose file to shadow the host directories. Already addressed in the docker-compose.dev.yml pattern above.

---

## Code Examples

### Drizzle Client Initialization

```typescript
// Source: https://orm.drizzle.team/docs/get-started/postgresql-new
// src/lib/db/index.ts
import 'server-only'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

export const db = drizzle(process.env.DATABASE_URL!, { schema })
```

### Running Migrations Programmatically (for Docker entrypoint)

```typescript
// scripts/migrate.ts
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'

const db = drizzle(process.env.DATABASE_URL!)

async function main() {
  await migrate(db, { migrationsFolder: './drizzle' })
  console.log('Migrations complete')
  process.exit(0)
}

main().catch((err) => {
  console.error('Migration failed', err)
  process.exit(1)
})
```

### Vitest Configuration

```typescript
// Source: https://nextjs.org/docs/app/guides/testing/vitest
// vitest.config.mts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setup.ts',
  },
})
```

### Nginx Reverse Proxy Config (Claude's Discretion)

```nginx
# nginx.conf
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` with `export function middleware()` | `proxy.ts` with `export function proxy()` | Next.js 16 (Oct 2025) | File must be renamed; old name is deprecated |
| Synchronous `cookies()`, `headers()` | Async `await cookies()`, `await headers()` | Next.js 15 (sync compat); v16 removes sync | Must `await` all dynamic request APIs |
| `next lint` command | Run ESLint CLI directly | Next.js 16 | `next lint` removed; use `eslint .` in scripts |
| `experimental.turbopack` config | `turbopack` at top level of nextConfig | Next.js 16 | Config key moved out of experimental |
| Node.js 18 support | Node.js 20.9+ minimum | Next.js 16 | Docker base image must be node:20+ or node:24 |
| shadcn CLI v3 `shadcn-ui` package | shadcn CLI v4 `shadcn` package | March 2026 | Run `pnpm dlx shadcn@latest` not `shadcn-ui` |

**Deprecated / Removed in Next.js 16:**
- `serverRuntimeConfig` / `publicRuntimeConfig`: Use env vars directly in Server Components
- AMP support: Removed entirely
- `devIndicators.buildActivity`, `appIsrStatus`: Removed
- `experimental.dynamicIO`: Renamed to `cacheComponents`

---

## Open Questions

1. **Interest rate storage precision**
   - What we know: Storing as basis points (integer) avoids float arithmetic; 25.00% = 2500
   - What's unclear: Whether the financial engine needs sub-basis-point precision (e.g. 24.99%)
   - Recommendation: Use basis points for Phase 1; the schema can be discussed in Phase 4 when the engine is built

2. **`interestRate` column type in debts table**
   - What we know: Household debt rates are typically 0-30% (0-3000 basis points)
   - What's unclear: Whether `integer` (basis points) or `real` (float percent) is better for the engine
   - Recommendation: Use `integer` basis points in Phase 1 to maintain the "no floats in schema" rule; engine converts as needed

3. **GitHub MCP Docker vs npx**
   - What we know: Official GitHub MCP server supports both Docker (`ghcr.io/github/github-mcp-server`) and npx (`@github/github-mcp-server`)
   - What's unclear: Which approach is expected in this project
   - Recommendation: Use Docker form (matches the deployment philosophy); `@github/github-mcp-server` npx variant is the alternative if Docker adds friction

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `vitest.config.mts` — does not yet exist, create in Wave 0 |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

Phase 1 is infrastructure-only. Most acceptance criteria are verified by running commands, not unit tests. The test framework is configured but no unit tests are written in Phase 1 (tests begin in Phase 4 for the engine).

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCAF-01 | TypeScript compiles with no errors | type-check | `npx tsc --noEmit` | ❌ Wave 0 (tsconfig) |
| SCAF-01 | server-only boundary enforced | build-check | `npm run build` (build fails if violated) | ❌ Wave 0 |
| SCAF-03 | Docker stack starts with health checks | smoke | `docker compose up --wait` | ❌ Wave 0 |
| SCAF-06 | Drizzle migrations run against fresh DB | manual/smoke | `npm run db:migrate` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx tsc --noEmit` (type safety gate, ~5s)
- **Per wave merge:** `npx tsc --noEmit && npm run build`
- **Phase gate:** `tsc --noEmit` green + `docker compose up --wait` succeeds + `db:migrate` runs clean

### Wave 0 Gaps

- [ ] `vitest.config.mts` — Vitest configuration (needed for Phase 2+)
- [ ] `src/tests/setup.ts` — shared test setup file
- [ ] `tsconfig.json` — generated by `create-next-app --typescript`, verify `strict: true`
- [ ] Framework install: included in initial `npm install -D vitest @vitejs/plugin-react ...`

---

## Sources

### Primary (HIGH confidence)

- npm registry live queries (2026-03-18) — all package versions verified
- https://nextjs.org/docs/app/guides/upgrading/version-16 — Next.js 16 breaking changes (lastUpdated: 2026-03-16)
- https://nextjs.org/docs/app/guides/testing/vitest — Vitest setup (lastUpdated: 2026-03-16)
- https://nextjs.org/docs/app/getting-started/deploying — Docker deployment (lastUpdated: 2026-03-16)
- https://orm.drizzle.team/docs/get-started/postgresql-new — Drizzle PostgreSQL setup
- https://orm.drizzle.team/docs/column-types/pg — Drizzle column types
- https://orm.drizzle.team/docs/drizzle-kit-generate — Migration commands
- https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile — Official Dockerfile (fetched live)
- https://github.com/github/github-mcp-server — GitHub MCP server documentation

### Secondary (MEDIUM confidence)

- https://ui.shadcn.com/docs/installation/next — shadcn init command verified
- https://ui.shadcn.com/docs/components-json — components.json schema
- https://ui.shadcn.com/docs/theming — CSS variable theming for violet
- https://context7.com/docs/resources/all-clients — Context7 MCP configuration format
- https://www.builder.io/blog/server-only-next-app-router — server-only package usage

### Tertiary (LOW confidence)

- WebSearch results for GitHub MCP auth errors — cross-referenced with official GitHub MCP README

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all versions verified against live npm registry on 2026-03-18
- Architecture: HIGH — Next.js 16 upgrade guide fetched from official docs (lastUpdated 2026-03-16)
- Pitfalls: HIGH for Next.js 16 breaking changes (from official upgrade guide); MEDIUM for Docker patterns (from official example Dockerfile)
- shadcn theming: MEDIUM — CSS variable names confirmed, exact OKLCH value for #7c3aed is an approximation that should be verified with a color converter tool during implementation

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable stack; drizzle-orm and Next.js patch versions may update but APIs are stable)

**Critical note for implementer:** Next.js 16 is current latest (not 15 as the phase description may imply). The biggest traps are: (1) file is `proxy.ts` not `middleware.ts`, (2) `await cookies()` not `cookies()`, (3) Turbopack is default so avoid custom webpack config. All other aspects of the phase plan are unaffected by the v16 change.
