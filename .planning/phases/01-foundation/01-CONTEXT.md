# Phase 1: Foundation - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Project scaffold, Docker Compose stack, Drizzle schema with integer pence and append-only ledger, CLAUDE.md, MCP configuration. The app must run locally and in Docker with all health checks passing. No features, no auth, no business logic — just the correct foundation that all subsequent phases build on.

</domain>

<decisions>
## Implementation Decisions

### Project Directory Structure
- Use `src/` directory to separate app code from config files at repo root
- Route groups: `src/app/(app)/` for authenticated app pages, `src/app/(auth)/` for login page
- Library organization by concern:
  - `src/lib/db/` — Drizzle client and schema
  - `src/lib/dal/` — Data access layer (all DAL files marked `server-only`)
  - `src/lib/auth/` — JWT utilities, session helpers (marked `server-only`)
  - `src/lib/engine/` — Pure financial calculation functions (no I/O, no async)
- Components: `src/components/ui/` for shadcn components, `src/components/` for app-specific components
- `src/server/` for anything that must never reach the client (DB connection, session verification)

### Docker Compose Design
- Two compose files: `docker-compose.yml` (production) and `docker-compose.dev.yml` (development override)
- Services: `app` (Next.js standalone), `db` (PostgreSQL 16), `redis` (Redis 7), `nginx` (Nginx reverse proxy — prod only)
- Next.js output: `standalone` mode required for Docker packaging (`output: 'standalone'` in next.config.ts)
- Named volumes for PostgreSQL data persistence (`postgres_data`) and Redis persistence (`redis_data`)
- Health checks on all services; `app` service `depends_on` db and redis with `condition: service_healthy`
- Dev: volume mount source code for hot-reload; no Nginx (access app directly on port 3000)
- Prod: Nginx terminates HTTP, proxies to app container; no source volume mounts
- Environment variables via `.env` file at repo root (`.env.example` committed, `.env` gitignored)

### Drizzle Schema Scope
- Define ALL domain tables in Phase 1 — monetary columns must use integer pence from the start
- Tables to scaffold in `src/lib/db/schema.ts`:
  - `users` — email, password_hash (single household login)
  - `accounts` — bank accounts with balance in integer pence
  - `pots` — budget categories with allocated_pence, rollover flag (v2-ready)
  - `bills` — recurring bills with amount_pence, frequency enum, pot_id (nullable for potless)
  - `bill_splits` — joint split percentages per bill
  - `transfer_history` — append-only ledger: source, destination, amount_pence, timestamp, description
  - `debts` — debt entries with balance_pence, interest_rate, minimum_payment_pence
  - `savings_goals` — goal name, target_pence, linked pot_id (nullable)
- Monetary columns: always `integer` (pence), never `decimal`, never `float`
- No mutable `current_balance` columns — balances derived from transfer_history ledger entries
- Drizzle migration tooling: `drizzle-kit` for generating and running migrations; `npm run db:migrate` script

### CLAUDE.md Coverage
- Comprehensive inline rules — all architectural decisions that are expensive to undo must be documented
- Required sections:
  1. **Stack** — exact versions and rationale for key choices
  2. **Architecture** — file structure diagram, route groups, server-only boundaries
  3. **Database Rules** — integer pence mandate, append-only ledger pattern, no mutable balances
  4. **Security Rules** — `verifySession()` in every DAL function, proxy.ts is redirect-only not a gate, JWT in httpOnly cookie only
  5. **Coding Conventions** — naming, import patterns, TypeScript strictness
  6. **Testing** — Vitest for unit tests, Playwright for E2E, what to test at each layer
  7. **Claude Code Workflow** — how to use GSD, when to run /gsd:plan-phase, what each MCP does
- CLAUDE.md lives at repo root and is committed — it is the source of truth for all contributors (human and AI)

### MCP Configuration
- Context7 MCP: configured in `.mcp.json` at repo root — used for fetching live library docs during development
- GitHub MCP: configured and auth error resolved; document the fix in CLAUDE.md for future reference
- Playwright MCP: configured for E2E test automation (wired to CI in Phase 2)
- Configuration file: `.mcp.json` at repo root (gitignored if it contains tokens; template committed)

### Claude's Discretion
- Exact Nginx configuration (proxy_pass, headers, buffer sizes) — standard Next.js standalone proxy config
- Docker health check intervals and retry counts — sensible defaults
- Exact Drizzle migration file naming and folder structure
- `.env.example` variable names and groupings
- Package manager choice (pnpm recommended for monorepo speed, but npm is fine for single app)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture decisions
- `.planning/PROJECT.md` — Core value, stack decisions, constraints, key decisions table
- `.planning/REQUIREMENTS.md` — SCAF-01 through SCAF-06, exact acceptance criteria for Foundation phase

### Database rules (critical — cannot be changed after Phase 1)
- `.planning/STATE.md` — Accumulated decisions: integer pence mandate, append-only ledger pattern, verifySession() convention, Redis blacklist design

No external specs — requirements are fully captured in decisions above and in PROJECT.md/REQUIREMENTS.md/STATE.md.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project. No existing components, hooks, or utilities.

### Established Patterns
- None yet — Phase 1 establishes the patterns that all subsequent phases follow.

### Integration Points
- Phase 2 (CI/CD) will consume: `package.json` scripts (`lint`, `type-check`, `test`, `build`), Docker Compose files, and `.github/workflows/`
- Phase 3 (Auth) will consume: `src/lib/db/schema.ts` (users table), `src/lib/auth/` directory, Redis client
- Phase 4 (Financial Engine) will consume: `src/lib/engine/` directory structure, Vitest configuration
- Phase 5+ (Features) will consume: DAL pattern from `src/lib/dal/`, all domain tables in schema

</code_context>

<specifics>
## Specific Ideas

- Next.js `output: 'standalone'` is non-negotiable for Docker — must be in next.config.ts from day one
- Integer pence mandate is the single most important architectural decision — CLAUDE.md must make it impossible to accidentally use floats
- The `verifySession()` pattern in every DAL function protects against auth bypass even if proxy.ts is misconfigured
- Primary colour `#7c3aed` (violet) should be set in the shadcn theme from Phase 1 so it propagates to all subsequent phases

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-18*
