# PotPlanner — Project Conventions

> **CRITICAL RULES** (breaking these causes cascading failures):
> 1. All money is integer pence — NEVER float/decimal
> 2. `transfer_history` is append-only — NEVER update/delete rows
> 3. `verifySession()` in EVERY DAL function — `proxy.ts` is NOT a security gate
> 4. `import 'server-only'` in ALL db/dal/auth/server files
> 5. Use `proxy.ts` NOT `middleware.ts` (Next.js 16)

---

## Stack

| Layer | Library | Version | Rationale |
|-------|---------|---------|-----------|
| Framework | Next.js (App Router) | 16.1.7 | Full-stack TypeScript; `proxy.ts` (not `middleware.ts`) in v16 |
| UI Runtime | React | 19.2.3 | Required by Next.js 16 |
| Language | TypeScript | 5.x (strict) | Type safety; `strict: true` in tsconfig |
| ORM | Drizzle ORM | 0.45.1 | Type-safe SQL; no runtime overhead; pairs with `drizzle-kit` |
| Database | PostgreSQL | 16 | Proven in v1; `integer` type for monetary pence values |
| Cache / Sessions | Redis 7 via ioredis | 5.10.0 | Session blacklist for JWT invalidation; rate limiting |
| Components | shadcn/ui + Tailwind CSS | 4.x | Primary colour `#7c3aed` (violet); `baseColor` cannot change after init |
| Unit Tests | Vitest | 4.1.0 | `vitest.config.mts` at repo root |
| E2E Tests | Playwright MCP | latest | Browser automation; configured in Phase 2 |
| Bundler | Turbopack | (default) | Next.js 16 default; do NOT add custom webpack config without `--webpack` flag |
| Deployment | Docker Compose | — | Self-hosted; `output: 'standalone'` in next.config.ts is non-negotiable |

**Next.js 16 breaking changes to remember:**
- `middleware.ts` → `proxy.ts` (export function named `proxy`, not `middleware`)
- `cookies()`, `headers()`, `params`, `searchParams` are **async only** — always `await` them
- Turbopack is now the default bundler — custom webpack config breaks `next build` unless you pass `--webpack` flag
- Node.js 20.9+ minimum (Docker base image: `node:24-slim`)
- `next lint` removed — use `eslint .` directly

---

## Architecture

### Directory Structure

```
src/
├── app/
│   ├── (app)/              # Authenticated app pages (layout has session check)
│   │   └── layout.tsx
│   ├── (auth)/             # Login page (unauthenticated)
│   │   └── login/
│   │       └── page.tsx
│   ├── api/                # Route handlers (POST /api/auth/login, etc.)
│   ├── globals.css         # Tailwind + shadcn CSS variables (violet theme)
│   └── layout.tsx          # Root layout
├── components/
│   ├── ui/                 # shadcn generated components (git-tracked, owned by project)
│   └── (app-specific components)
├── lib/
│   ├── db/
│   │   ├── index.ts        # Drizzle client (import 'server-only')
│   │   └── schema.ts       # All 8 table definitions (import 'server-only')
│   ├── dal/                # Data access layer — ALL files: import 'server-only'
│   ├── auth/               # JWT helpers, session verification (import 'server-only')
│   └── engine/             # Pure financial functions — NO I/O, NO async, NO imports from db/dal
└── server/                 # Absolute server-only utilities
proxy.ts                    # src/proxy.ts — redirect-only layer (NOT a security gate)
drizzle/                    # Migration SQL files (drizzle-kit output — do not hand-edit)
drizzle.config.ts           # Drizzle Kit configuration
next.config.ts              # output: 'standalone' — non-negotiable
vitest.config.mts           # Vitest configuration
docker-compose.yml          # Production stack (app + db + redis + nginx)
docker-compose.dev.yml      # Development overrides (hot-reload, no nginx)
.env.example                # Committed template
.env                        # Gitignored secrets
.mcp.json                   # MCP server configuration (gitignored — may expand env vars)
.mcp.json.example           # Template MCP config (committed, no real tokens)
CLAUDE.md                   # This file — source of truth for all contributors
```

### Route Groups

- `src/app/(app)/` — Authenticated app pages. The `layout.tsx` here verifies the session.
- `src/app/(auth)/` — Unauthenticated pages (login). No session required.
- Route group folders `(app)` and `(auth)` do not appear in the URL.

### Server-Only Boundaries

The following directories contain files that must NEVER be bundled for the client:

| Directory | Rule |
|-----------|------|
| `src/lib/db/` | DB client and schema — `import 'server-only'` in every file |
| `src/lib/dal/` | Data access layer — `import 'server-only'` in every file |
| `src/lib/auth/` | JWT and session helpers — `import 'server-only'` in every file |
| `src/server/` | Server-only utilities — `import 'server-only'` in every file |

`src/lib/engine/` is the exception: pure TypeScript functions with no I/O, safe to import anywhere.

---

## Database Rules

### INTEGER PENCE MANDATE

**All monetary values are stored as `integer` (pence).** This is non-negotiable and cannot be retrofitted after Phase 1.

- Use `integer()` Drizzle column type — maps to PostgreSQL `INTEGER` (32-bit, max ~2.1 billion pence = ~£21M)
- NEVER use `decimal()`, `numeric()`, `real()`, or `float()` for any monetary column
- Column naming convention: `*_pence` suffix — e.g. `amount_pence`, `balance_pence`, `target_pence`
- Convert to pounds/currency only at the **UI display layer** (e.g. `(pence / 100).toFixed(2)`)
- 32-bit limit: ~£21M maximum — sufficient for household budgeting; if a value could exceed this, use `bigint`

### APPEND-ONLY LEDGER

**The `transfer_history` table is append-only.** Rows are NEVER updated or deleted.

- Balances are derived by summing ledger entries, never stored as a mutable column
- No table may have a `current_balance` column that is updated in place
- To "reverse" a transfer, insert a compensating entry — never update or delete the original

### Interest Rates

Stored as integer basis points: `2500` = 25.00%. Divide by `10000` for decimal representation.

```typescript
const rateDecimal = interestRate / 10000  // 2500 / 10000 = 0.25
```

### Schema Reference

Tables in `src/lib/db/schema.ts`:
- `users` — email, password_hash
- `accounts` — bank accounts; `initial_balance_pence` integer
- `pots` — budget categories; `allocated_pence` integer; `rollover` boolean (v2-ready)
- `bills` — recurring bills; `amount_pence` integer; `frequency` enum; `pot_id` nullable
- `bill_splits` — joint bill percentages; `percentage` integer (0–100)
- `transfer_history` — **append-only ledger**; `amount_pence` integer
- `debts` — `balance_pence` integer; `interest_rate` integer (basis points); `minimum_payment_pence` integer
- `savings_goals` — `target_pence` integer; `pot_id` nullable

### Migrations

```bash
npm run db:generate   # creates SQL migration files in drizzle/
npm run db:migrate    # applies pending migrations to the database
npm run db:studio     # opens Drizzle Studio (local DB browser)
```

Always run `npm run db:generate` after editing `src/lib/db/schema.ts`, then commit the generated migration file alongside the schema change.

---

## Security Rules

### `verifySession()` in Every DAL Function

Every function in `src/lib/dal/` MUST call `verifySession()` before touching the database. This is the real security gate.

```typescript
// src/lib/dal/accounts.ts
import 'server-only'
import { verifySession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { accounts } from '@/lib/db/schema'

export async function getAccounts() {
  const session = await verifySession()  // REQUIRED — throws if no valid session
  return db.select().from(accounts)
}
```

If `verifySession()` is missing from a DAL function, that function has NO authorization protection.

### `proxy.ts` is Redirect-Only

`src/proxy.ts` (NOT `middleware.ts`) checks for a session cookie and redirects unauthenticated users to `/login`. It does NOT validate JWT tokens or enforce authorization.

- `proxy.ts` is a UX convenience (prevents flashing the app for logged-out users)
- `proxy.ts` is NOT a security gate
- Security enforcement happens in the DAL via `verifySession()`
- A misconfigured `proxy.ts` would degrade UX but NOT create a security hole — because the DAL still calls `verifySession()`

```typescript
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

### JWT in httpOnly Cookie Only

- **Never** expose JWT to JavaScript
- **Never** send JWT in a response body
- Always set `httpOnly: true`, `secure: true` (in production), `sameSite: 'lax'`
- Redis blacklist handles logout/invalidation — check blacklist in `verifySession()`

### `server-only` Import Everywhere

Every file in `src/lib/db/`, `src/lib/dal/`, `src/lib/auth/`, and `src/server/` must have `import 'server-only'` as its first import. This causes a **build-time error** if the file is accidentally bundled for the client:

```
Error: This module cannot be imported from a Client Component module.
```

---

## Coding Conventions

### TypeScript

- **Strict mode** — `strict: true` in `tsconfig.json`; no `any`, no `// @ts-ignore` without an explanation comment
- Import alias: `@/` maps to `src/` (configured in `tsconfig.json` `paths`)
- Always `await` dynamic request APIs: `await cookies()`, `await headers()`, `await params`, `await searchParams` (Next.js 16 async-only requirement)

### File Naming

- `kebab-case` for all files and directories (e.g. `get-accounts.ts`, `pot-card.tsx`)
- `PascalCase` for React component function names and TypeScript interfaces/types
- Test files: `*.test.ts` or `*.test.tsx` colocated with the file under test, or in `src/tests/`

### Import Order

1. `import 'server-only'` (if applicable — must be first)
2. Node.js built-ins
3. External packages (`next`, `react`, `drizzle-orm`, etc.)
4. Internal absolute imports (`@/lib/...`, `@/components/...`)
5. Relative imports (`./`, `../`)

### Bundler

Next.js 16 uses **Turbopack** by default for `next dev` and `next build`. Do NOT add a custom `webpack()` function to `next.config.ts` — it will break the build. If custom webpack is genuinely required, pass `--webpack` to the CLI command.

---

## Testing

### Framework

- **Vitest 4.x** for unit tests — config in `vitest.config.mts`
- **Playwright MCP** for E2E tests — configured in Phase 2
- Type-check: `npm run type-check` (`tsc --noEmit`)

### What to Test at Each Layer

| Layer | Test with | What to test | What NOT to test |
|-------|-----------|--------------|-----------------|
| `src/lib/engine/` | Vitest | All pure functions — high coverage | Nothing to skip; these are pure TS |
| `src/app/api/` | Vitest | Request/response contracts, error codes | Implementation details |
| `src/lib/dal/` | Vitest (test DB) | Query correctness, auth enforcement | ORM internals |
| React components | Vitest + Testing Library | Only if business logic is embedded | Pure rendering/layout |
| User flows | Playwright | Login, navigation, CRUD actions | Already covered by unit tests |

### Running Tests

```bash
npx vitest run             # unit tests (single run)
npx vitest                 # unit tests (watch mode)
npx vitest run --coverage  # with coverage report
npx playwright test        # E2E tests
npm run type-check         # TypeScript check (run before every commit)
```

### Test Quality Gates

- Per task commit: `npm run type-check` must pass
- Per wave merge: `npm run type-check && npm run build` must pass
- Phase gate: all of the above plus `docker compose up --wait` and `npm run db:migrate` succeed

---

## Development Workflow

### Local Development

```bash
# Without Docker (requires local PostgreSQL and Redis):
npm run dev

# With Docker (recommended — matches production):
docker compose -f docker-compose.yml -f docker-compose.dev.yml up app db redis
```

### Production Build

```bash
docker compose up --build
```

### Database

```bash
npm run db:generate   # after editing src/lib/db/schema.ts — creates migration file
npm run db:migrate    # apply pending migrations
npm run db:studio     # Drizzle Studio — visual DB browser at localhost:4983
```

### Type Safety

```bash
npm run type-check    # runs tsc --noEmit; run before every commit
```

### GSD Workflow (Claude Code)

This project uses the `get-shit-done` (GSD) workflow for AI-assisted development:

- `/gsd:plan-phase` — research and plan the next phase; produces PLAN.md files
- `/gsd:execute-phase` — execute a PLAN.md file atomically; commits each task
- `/gsd:verify-work` — verify completed work against acceptance criteria

State is tracked in `.planning/STATE.md`. Each phase has a directory under `.planning/phases/`.

### MCP Tools

| MCP | Purpose | How to use |
|-----|---------|-----------|
| Context7 | Live library documentation lookup | Ask Claude to "use context7 to look up [library] docs" |
| GitHub MCP | Repository operations, PR management | Ask Claude to create PRs, review issues, etc. |
| Playwright MCP | Browser automation and E2E testing | Ask Claude to run browser tests |

#### GitHub MCP Authentication Fix

The GitHub MCP server requires a **classic PAT** (Personal Access Token), NOT a fine-grained token.

- Token format: starts with `ghp_` (classic PAT)
- Required scope: `repo` (minimum)
- **Do NOT use** GitHub App tokens (`gho_`) or fine-grained tokens — these cause auth failures
- Common errors: `"Bad credentials"` or `"Authorization header is badly formatted"` → wrong token type

Setup:

```bash
export GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxx   # set in shell before running Claude Code
```

The `.mcp.json` references the token via `${GITHUB_PERSONAL_ACCESS_TOKEN}` — it does NOT store the token directly. The `.mcp.json` file is gitignored. Use `.mcp.json.example` as the template.

---

*Last updated: Phase 1 — Foundation (2026-03-18)*
