# Domain Pitfalls

**Domain:** Personal finance / budgeting web app (Next.js full-stack, PostgreSQL + Redis, Docker Compose)
**Researched:** 2026-03-18
**Sources:** Next.js official docs (v16.1.7, current), Node.js security docs, OWASP guidance, MDN, domain knowledge

---

## Critical Pitfalls

Mistakes that cause rewrites, data corruption, or security breaches.

---

### Pitfall 1: Floating-Point Arithmetic in Money Calculations

**What goes wrong:** JavaScript's native `number` type uses IEEE 754 double-precision floating point. Classic example: `0.1 + 0.2 === 0.30000000000000004`. In a budgeting app this compounds: summing dozens of transactions produces balances that are off by fractions of a cent, rounding errors accumulate across reports, and `toFixed(2)` behaves unexpectedly (`(2.55).toFixed(1) === "2.5"` — rounds down, not up). Once financial data is stored with float errors, correcting historical records is painful and trust-eroding.

**Why it happens:** Developers treat money as a floating-point decimal when it is a fixed-precision integer (cents, not dollars). The bug is invisible during development (small samples, no edge amounts) and surfaces when real user data accumulates.

**Consequences:** Wrong account balances, incorrect budget totals, reports that don't reconcile, and potential user financial decisions made on wrong data.

**Prevention:**
- Store all monetary values in the database as integer cents (PostgreSQL `INTEGER` or `BIGINT`), never `DECIMAL` or `FLOAT` columns.
- In application code, use [decimal.js](https://github.com/MikeMcl/decimal.js/) or [dinero.js](https://dinerojs.com/) for any arithmetic that crosses the integer boundary (display formatting, percentage calculations).
- Establish a rule: money enters the app as cents, stays as cents throughout the stack, and is only converted to dollars for display at the UI layer.
- Write property-based tests that verify `sum(transactions) === balance` for randomly generated datasets.

**Detection:** Any `DECIMAL`, `FLOAT`, or `NUMERIC` column for money in the schema. Any arithmetic using native `/` or `*` on currency values without a precision library.

**Phase:** Address in Phase 1 (database schema design) and enforce in Phase 2 (financial calculation logic).

---

### Pitfall 2: Relying Solely on Next.js Proxy (Middleware) for Auth Security

**What goes wrong:** Next.js Proxy (formerly `middleware.js`, renamed to `proxy.js` in Next.js v16) runs on every route and is the natural place to redirect unauthenticated users. However, the official Next.js docs explicitly state: "Proxy is not your only line of defense in protecting your data." Partial rendering means layout auth checks do **not** re-run on client-side navigation. If a developer puts auth only in Proxy and layouts, individual pages and Server Actions remain unprotected.

**Why it happens:** The middleware/Proxy redirect pattern is the most visible auth example in tutorials. Developers implement it and believe auth is handled. Server Actions and Route Handlers are never checked.

**Consequences:** Direct API calls to `/api/...` or invoked Server Actions bypass Proxy checks entirely and return sensitive financial data to unauthenticated users.

**Prevention:**
- Implement a `verifySession()` function in a Data Access Layer (`lib/dal.ts`) that checks the session close to the data source.
- Call `verifySession()` inside every Server Action, Route Handler, and any page that fetches user-specific data.
- Use Proxy / middleware only for UX redirects (send unauthenticated users to `/login`), never as the sole security gate.
- Mark DAL files with `import 'server-only'` to prevent accidental client-side use.

**Detection:** Any Server Action or Route Handler that fetches user data but does not call `verifySession()` or an equivalent check.

**Phase:** Address in Phase 2 (authentication implementation). Enforce as a code review checklist item for all subsequent phases.

---

### Pitfall 3: Environment Variables Baked Into Docker Build (Build-Time vs. Runtime)

**What goes wrong:** Next.js inlines `NEXT_PUBLIC_*` variables at build time into the JS bundle. If a developer passes non-public secrets (database URLs, JWT secrets, Redis passwords) via Docker build args, those values can end up in the image layer history or the compiled output. More commonly, teams rebuild Docker images for each environment (dev/staging/prod) rather than using a single image promoted through environments, multiplying build time and introducing environment drift.

**Why it happens:** The distinction between build-time and runtime env vars is non-obvious. Docker build args look identical to runtime env vars in Compose files.

**Consequences:** Secrets leaked in image history, forced rebuilds per environment, or the app failing to connect to databases because `DATABASE_URL` was baked in as an empty string at build time.

**Prevention:**
- Never pass database credentials, JWT secrets, or Redis passwords as Docker build args.
- Use `output: "standalone"` in `next.config.js` — the standalone server reads `process.env` at startup, not build time.
- Inject all secrets as environment variables at container start via `docker-compose.yml` `environment:` section or a `.env` file excluded from version control.
- For multi-container deployments, set `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` consistently across all instances to prevent Server Action decryption failures.
- Use `docker secrets` or a secrets manager (e.g. Doppler, Vault) rather than `.env` files in production.

**Detection:** Any `ARG` in Dockerfile for database/auth secrets. Any `NEXT_PUBLIC_` prefix on secrets. Missing `output: "standalone"` when targeting Docker.

**Phase:** Address in Phase 4 (Docker / infrastructure setup). Must be correct before any staging deployment.

---

### Pitfall 4: JWT Logout Without Token Invalidation

**What goes wrong:** Standard JWTs are stateless — once issued, they are valid until expiry regardless of what the server does. If a user logs out, changes their password, or is suspended, previously issued tokens remain valid. Without a server-side invalidation mechanism (blacklist or session table), an attacker who steals a JWT retains access until the token expires.

**Why it happens:** The appeal of JWTs is statelessness. Developers implement the stateless path, discover logout does nothing, then bolt on a blacklist later — often incorrectly.

**Consequences:** Stolen tokens remain exploitable after logout. Compromised accounts cannot be force-logged-out. Password changes don't terminate existing sessions.

**Prevention:**
- Store a session identifier in Redis with TTL matching the JWT expiry. On logout, delete the Redis key.
- On every authenticated request, verify both the JWT signature AND the Redis session key existence.
- Keep JWT expiry short (15 minutes) and use refresh tokens with Redis for session extension. Refresh token rotation (issue new refresh token on each use, invalidate old) prevents replay attacks.
- For a personal app where a single-user or small-user model is acceptable, database sessions (storing session ID in PostgreSQL) are simpler and equally effective.
- Use `httpOnly`, `secure`, `sameSite: 'lax'` cookie flags for all session cookies.

**Detection:** A logout action that only clears the client cookie without any server-side record invalidation. JWTs with multi-hour or multi-day expiry without a blacklist mechanism.

**Phase:** Address in Phase 2 (authentication). Redis integration for session management must be planned alongside JWT implementation, not added later.

---

### Pitfall 5: Storing Running Balances as Computed State in the Database

**What goes wrong:** It is tempting to store a `current_balance` column on an account that is updated with every transaction. This creates a consistency problem: if a transaction insert succeeds but the balance update fails (network glitch, crash), the balance is wrong. Retroactive transaction edits (correct a past amount, change a date, mark as reconciled) require recalculating every balance that follows, and if the column is the source of truth, the recalculation becomes complex. Alternatively, deriving balances entirely by summing all transactions on every request becomes slow as history grows.

**Why it happens:** Running balances feel natural from a banking UI perspective. Developers mirror what they see rather than modeling the domain correctly.

**Consequences:** Balance drift over time, reconciliation failures, inability to edit historical transactions correctly, or O(n) balance queries that degrade performance.

**Prevention:**
- Treat transactions as the source of truth (append-only ledger pattern). Do not store running balance on account rows.
- Calculate balances with a database query: `SELECT SUM(amount) FROM transactions WHERE account_id = $1 AND date <= $2`.
- Add appropriate indices on `(account_id, date)` to keep balance queries fast.
- If read performance becomes a concern at scale, use a materialized view or a periodic snapshot table — but only after the append-only model is working correctly.
- Use PostgreSQL transactions (ACID) to ensure transaction insert and any derived updates are atomic.

**Detection:** A `balance` or `current_balance` column on an account table that is updated by application code (not just a view or computed column).

**Phase:** Address in Phase 1 (database schema). This is a foundational schema decision that is very expensive to change later.

---

## Moderate Pitfalls

---

### Pitfall 6: Accidentally Importing Server Code into Client Components (Environment Poisoning)

**What goes wrong:** In Next.js App Router, all components are Server Components by default. If a file imports a database client, secret key, or other server-only module without the `'use client'` boundary being carefully managed, that code can be bundled into the client JavaScript. Next.js replaces non-`NEXT_PUBLIC_` env vars with empty strings in client bundles, so the symptom is usually silent failures (DB connection with empty URL) rather than an obvious error.

**Prevention:**
- Add `import 'server-only'` to any file that touches the database, Redis, or secrets.
- Never put database/Redis client instantiation in files that components on both sides import.
- Use `import 'client-only'` for browser-API-dependent modules (localStorage wrappers, etc.) to catch accidental server imports.
- Structure code so `lib/db.ts`, `lib/redis.ts`, and `lib/session.ts` all have `import 'server-only'` at the top.

**Detection:** Build warnings about missing modules in client bundle. Runtime errors about `process.env.DATABASE_URL` being undefined on the client.

**Phase:** Establish this pattern in Phase 1 (project setup / scaffolding).

---

### Pitfall 7: Next.js Caching Serving Stale Financial Data

**What goes wrong:** Next.js App Router aggressively caches by default. A statically rendered page or a `fetch` call without `{ cache: 'no-store' }` will serve cached data. For a budgeting app where users expect their transaction list and balances to reflect the latest state after adding a transaction, this is a serious UX failure. The Router Cache also caches RSC payloads client-side for 5 minutes for static pages.

**Prevention:**
- All pages that display user-specific financial data must be dynamically rendered. Use `cookies()` or `headers()` in the page (which auto-opts into dynamic rendering), or explicitly set `export const dynamic = 'force-dynamic'`.
- After a Server Action that mutates data (add transaction, edit budget), call `revalidatePath('/dashboard')` or `revalidateTag('transactions')` to flush the cache.
- Use `{ cache: 'no-store' }` on any `fetch` call within financial data-fetching functions.
- Be aware that `router.refresh()` invalidates the Router Cache but NOT the Data Cache — use `revalidatePath` in Server Actions for complete invalidation.

**Detection:** After adding a transaction, the dashboard still shows the old balance after navigation (no hard refresh). Pages that display balances but have no `cookies()`, `headers()`, or `dynamic = 'force-dynamic'` export.

**Phase:** Address in Phase 3 (dashboard and transaction features). Establish cache invalidation strategy before building the first mutation.

---

### Pitfall 8: Docker Compose Health Checks and Startup Order

**What goes wrong:** `depends_on` in Docker Compose only waits for the container to start, not for the service inside to be ready. A Next.js container that starts before PostgreSQL is accepting connections (or before migrations have run) will fail to connect, and Docker will not automatically retry. The app appears to start but is broken.

**Prevention:**
- Use `depends_on` with `condition: service_healthy` in `docker-compose.yml` for Next.js → PostgreSQL and Next.js → Redis dependencies.
- Define `healthcheck` on the PostgreSQL service using `pg_isready -U $POSTGRES_USER`.
- Define `healthcheck` on the Redis service using `redis-cli ping`.
- Run database migrations as a separate init container or as a startup step within the Next.js entrypoint, after confirming the DB is reachable.
- For CI, use `docker compose --wait` or explicit health check loops in GitHub Actions steps.

**Detection:** `docker compose up` succeeds but app shows database connection errors on first request after cold start.

**Phase:** Address in Phase 4 (Docker / infrastructure). Fix before setting up CI/CD.

---

### Pitfall 9: GitHub Actions Cache Invalidation for Next.js Builds

**What goes wrong:** Caching `node_modules` in GitHub Actions without a proper cache key causes two opposite problems: stale cache serving old `node_modules` after `package-lock.json` changes (subtle dependency bugs), or cache never hitting because the key is too granular. The Next.js `.next/cache` directory should also be cached across runs to dramatically speed up incremental builds, but is often omitted.

**Prevention:**
- Cache key for `node_modules`: `${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}`.
- Also cache `.next/cache` with key: `${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}-${{ hashFiles('**/*.ts', '**/*.tsx') }}` with a restore-key fallback.
- Store secrets in GitHub repository Secrets, not in workflow env blocks or hardcoded.
- Use `npm ci` (not `npm install`) in CI to enforce lockfile integrity.
- For Docker image builds in CI, use `docker/build-push-action` with `cache-from: type=gha` and `cache-to: type=gha,mode=max` to cache Docker layer builds.

**Detection:** CI builds taking 5+ minutes consistently on unchanged code. `node_modules` being reinstalled despite no `package-lock.json` changes.

**Phase:** Address in Phase 5 (CI/CD setup).

---

### Pitfall 10: Not Protecting Server Actions from CSRF and Unauthorized Access

**What goes wrong:** Next.js Server Actions are exposed as POST endpoints. While Next.js provides some built-in CSRF protection for same-origin requests, Server Actions that perform financial mutations (create transaction, delete budget, transfer between pots) must still verify the session. The documentation explicitly warns: "Treat Server Actions with the same security considerations as public-facing API endpoints."

**Prevention:**
- Call `verifySession()` (from the DAL) at the top of every Server Action that reads or mutates user data.
- Never trust user-supplied IDs in Server Actions without verifying ownership: check `WHERE id = $actionId AND user_id = $sessionUserId`.
- Return `null` early (not an error that leaks data) if the user is not authorized.
- Log failed authorization attempts for audit purposes.

**Detection:** Server Actions that accept a record ID but do not verify the session user owns that record. Any Server Action without a `verifySession()` call.

**Phase:** Enforce from Phase 2 onward. Add to code review checklist.

---

### Pitfall 11: PostgreSQL Connection Pool Exhaustion in Docker

**What goes wrong:** Each Next.js server instance creates a database connection pool. In Docker Compose with a single PostgreSQL container, the default pool size (typically 10 connections per app instance) combined with multiple app instances or heavy traffic can exceed PostgreSQL's `max_connections` (default 100). The symptom is intermittent "too many connections" errors that are hard to reproduce in development.

**Prevention:**
- Configure `DATABASE_URL` with an explicit pool size appropriate for the deployment: `?connection_limit=5` for a single-container deployment.
- For production multi-replica setups, add PgBouncer as a connection pooler between Next.js and PostgreSQL.
- Set `max_connections` in `postgresql.conf` or via environment variable in the Docker service.
- Use Drizzle's or Postgres.js's pool configuration options rather than relying on defaults.

**Detection:** Intermittent "FATAL: sorry, too many clients already" in PostgreSQL logs during load testing or after prolonged uptime.

**Phase:** Address in Phase 4 (infrastructure). Confirm pool sizing before load testing in Phase 6.

---

## Minor Pitfalls

---

### Pitfall 12: Layouts Do Not Re-Run Auth Checks on Client Navigation

**What goes wrong:** Because of Next.js partial rendering, layout components are not re-rendered on every client-side navigation. An auth check in a layout (`app/dashboard/layout.tsx`) runs on initial load but not when the user navigates between dashboard sub-routes. If the session expires mid-session, the layout will not redirect the user.

**Prevention:**
- Do not rely on layouts for session validation. Place `verifySession()` in individual page components or in the DAL functions they call.
- The Proxy layer handles initial redirect for unauthenticated users. The DAL handles per-request validation for data access.

**Phase:** Phase 2 (auth design).

---

### Pitfall 13: Third-Party UI Library Components Lacking "use client"

**What goes wrong:** Many UI component libraries (chart libraries, date pickers, modal systems) use browser APIs (`window`, `addEventListener`, `localStorage`) but do not include the `"use client"` directive in their exports. Importing them directly into Server Components throws a runtime error. The fix requires wrapping them.

**Prevention:**
- When integrating a UI library for charts or date inputs, immediately check whether it requires client-side rendering.
- Create thin wrapper files (`components/ui/chart-wrapper.tsx` with `'use client'` at the top) that re-export the third-party component.
- Budget time for this wrapping work in the feature phase where the library is introduced.

**Detection:** "You're importing a component that needs ... It only works in a Client Component" build error.

**Phase:** Phase 3 (UI features). Wrap components at introduction time.

---

### Pitfall 14: React Context Not Available in Server Components

**What goes wrong:** Developers coming from Next.js Pages Router or SPAs reach for React Context for shared state (current user, theme, selected currency). Context providers are Client Components and their values are not available in Server Components. This causes confusion when trying to pass auth state or preferences into Server Components.

**Prevention:**
- For auth state in Server Components: read from the session cookie directly via the DAL (`verifySession()`), not from a context provider.
- For UI state (theme, preferences): use cookies (readable server-side) or pass as props from a parent Server Component.
- Context providers are appropriate for Client Component trees only (e.g., a toast notification system, a modal manager).

**Phase:** Phase 2–3 (auth and UI). Establish the pattern in Phase 2 before building any context-dependent UI.

---

### Pitfall 15: CLAUDE.md Scope Creep Leading to Ignored Instructions

**What goes wrong:** CLAUDE.md files that grow beyond 200-300 lines become noise. Developers (and AI assistants) stop reading them carefully. Key constraints — "never use floats for money," "always call verifySession() in Server Actions" — get buried and ignored.

**Prevention:**
- Keep CLAUDE.md focused on: project structure, critical domain rules (money as cents), environment setup, and commands to run.
- Move detailed architectural decisions to `docs/` or `.planning/`.
- Include a short "MUST KNOW" section at the top with 3-5 non-negotiable rules (e.g., money precision, auth pattern, migration workflow).
- Update CLAUDE.md whenever a new critical constraint is established, remove resolved or irrelevant notes.

**Detection:** CLAUDE.md exceeding ~250 lines without a clear "top 5 rules" section.

**Phase:** Phase 1 (project setup). Maintain throughout all phases.

---

### Pitfall 16: MCP Tool Availability Assumptions

**What goes wrong:** Context7 MCP and GitHub MCP availability varies by environment and configuration. Code or workflows that assume a specific MCP is always available will fail silently or confusingly when the MCP is not configured.

**Prevention:**
- Treat MCP tools as optional accelerators, not required dependencies. All tasks must be completable without them.
- Document in CLAUDE.md which MCPs are configured and what they are used for (`context7` for library docs, `github` for PR/issue management).
- GitHub MCP requires authentication; document the setup steps clearly so any contributor can configure it.
- Context7 does not require auth but requires the server to be running; document how to start it.

**Phase:** Phase 1 (project setup / CLAUDE.md).

---

### Pitfall 17: Testing Financial Logic Without Boundary Isolation

**What goes wrong:** Financial calculation functions (balance computation, budget allocation, pot transfers) are tested against a live database or mixed with UI logic. Tests are slow, brittle (depend on seed data order), and fail to cover edge cases (zero balance, negative amounts, multiple currencies, large integer values that approach integer overflow).

**Prevention:**
- Extract all financial calculation logic into pure functions in `lib/finance/` that take plain data and return plain data (no database calls, no React).
- Unit test these functions with Vitest in isolation: no mocks needed, fast execution.
- Specifically test: `sum of credits minus debits equals balance`, `transfer reduces source by X and increases destination by X`, `integer overflow for very large amounts`.
- For async Server Actions and Route Handlers, use integration tests (Playwright or Next.js test utilities) against a test database, not a production database.
- Next.js recommends E2E tests for `async` Server Components since unit testing them is not yet fully supported by the React ecosystem.

**Detection:** Financial logic functions that accept a database connection as a parameter. Test files that call `process.env.DATABASE_URL` for unit tests.

**Phase:** Phase 2–3 (financial logic). Establish the pure-function pattern before implementing complex calculations.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| Phase 1: Schema design | Storing money as float/decimal; mutable running balance | Integer cents only; append-only ledger |
| Phase 1: Project scaffolding | No `server-only` guards on DAL files | Add `import 'server-only'` to all lib files on creation |
| Phase 1: CLAUDE.md | Too long, critical rules buried | "MUST KNOW" section with max 5 rules at the top |
| Phase 2: Auth | Middleware as sole auth gate; stateless JWT logout | DAL `verifySession()` everywhere; Redis session invalidation |
| Phase 2: Auth | React Context for auth state in Server Components | Read session from cookie in DAL, not Context |
| Phase 3: Financial features | Caching serving stale balances post-mutation | `revalidatePath` in every mutating Server Action |
| Phase 3: Financial features | Untestable financial logic | Pure functions in `lib/finance/`, tested with Vitest |
| Phase 3: UI | Third-party chart/picker library without `use client` | Wrapper components on introduction |
| Phase 4: Docker | Secrets in build args; no health checks | Runtime env injection; `depends_on: condition: service_healthy` |
| Phase 4: Docker | Connection pool exhaustion | Explicit pool limit in `DATABASE_URL`; PgBouncer for multi-replica |
| Phase 5: CI/CD | Stale or missing build cache; secrets in workflow | `hashFiles()` cache keys; GitHub Secrets for all credentials |
| Phase 5: CI/CD | Every env rebuilds Docker image | `output: standalone`; promote single image across envs |
| All phases | Server Actions without ownership verification | `WHERE id = $1 AND user_id = $sessionUserId` on all mutations |

---

## Sources

- Next.js official docs v16.1.7 (March 2026): Authentication, Caching, Proxy/Middleware, Self-Hosting, Server/Client Components
  - https://nextjs.org/docs/app/guides/authentication
  - https://nextjs.org/docs/app/guides/caching
  - https://nextjs.org/docs/app/api-reference/file-conventions/proxy
  - https://nextjs.org/docs/app/guides/self-hosting
  - https://nextjs.org/docs/app/getting-started/server-and-client-components
- MDN: Number.prototype.toFixed — floating point precision issues
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toFixed
- Node.js Security Best Practices: timing attacks, prototype pollution in JWT payloads
  - https://nodejs.org/en/learn/getting-started/security-best-practices
- OWASP JWT Security Cheat Sheet (referenced via Node.js docs): token invalidation patterns
- Domain knowledge (HIGH confidence): ledger pattern, cents-as-integer, append-only transaction log — well-established fintech patterns not specific to any single source
