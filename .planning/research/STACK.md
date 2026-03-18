# Technology Stack

**Project:** PotPlanner v2
**Researched:** 2026-03-18
**Note:** Web research tools unavailable in this session. Recommendations are based on training data (cutoff August 2025) plus ecosystem knowledge of the 2025/2026 Next.js full-stack space. Confidence levels reflect this limitation — verify pinned versions before locking in.

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 15.x | Full-stack framework | App Router is stable, Server Actions reduce API boilerplate, single container deployment, strong TypeScript support. The project already decided this — confirmed correct for 2025/2026. |
| TypeScript | 5.x | Type safety | Non-negotiable for a financial engine. TS 5.x strict mode catches calculation errors at compile time. |
| Node.js | 22.x LTS | Runtime | LTS stream, performance improvements over 20.x, built-in fetch stable. |

**Confidence:** HIGH (core framework already decided; Node.js 22 LTS confirmed active in 2025)

---

### ORM / Database Access

**Recommendation: Drizzle ORM**

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Drizzle ORM | ^0.36 | Database access, schema management | SQL-first, TypeScript-native, zero-overhead query builder. Migrations via `drizzle-kit`. Excellent PostgreSQL support. |
| drizzle-kit | ^0.27 | Migrations CLI | Generates and runs schema migrations. |
| postgres (npm) | ^3.4 | PostgreSQL driver | The `postgres` package (not `pg`) is the recommended driver for Drizzle — async-first, better TypeScript ergonomics. |

**Why Drizzle over Prisma:**
- Drizzle generates raw SQL with full type inference — no Prisma Client abstraction layer to debug
- Schema defined in TypeScript files, not `.prisma` DSL — one language in the repo
- No code generation step in dev/CI — simpler Docker builds
- Significantly faster query performance (no ORM overhead for simple queries)
- Prisma's `accelerate` feature pushes toward Prisma's cloud — incompatible with self-hosted philosophy
- Drizzle is the consensus recommendation in the Next.js ecosystem as of 2025

**Why NOT raw SQL:**
- Financial queries (pot allocations, debt calculations, bill forecasting) will be complex
- Drizzle gives type-safe query results without sacrificing SQL expressiveness
- Raw SQL means manually typing result shapes — error-prone for financial data

**Confidence:** MEDIUM-HIGH (Drizzle momentum is clear from training data; version numbers should be verified against npm before locking in)

---

### Auth Implementation

**Recommendation: Custom JWT with `jose`**

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| jose | ^5.x | JWT sign/verify/encode | JOSE standard implementation, Edge-compatible, no Node.js-specific crypto dependencies. Used by Auth.js internally. |
| bcryptjs | ^2.4 | Password hashing | Pure JS bcrypt, works in all environments. |

**Why custom JWT over Auth.js (next-auth v5):**
- Auth.js is designed for OAuth providers and multi-user session management — this app has a single shared household login with no OAuth
- The Redis blacklist pattern (JWT + invalidation list) requires custom session logic that Auth.js would work against, not with
- Auth.js adds ~200KB+ of dependencies for features not needed (OAuth dance, provider callbacks)
- `jose` is what Auth.js uses internally — using it directly gives full control with no overhead
- Custom implementation is ~150 lines of code for this use case; the complexity is justified by the simplicity of the auth model

**Implementation pattern:**
```
POST /api/auth/login → verify password (bcryptjs) → sign JWT (jose) → return token
Middleware → verify JWT (jose) → check Redis blacklist → attach user to request
POST /api/auth/logout → add JWT jti to Redis blacklist with TTL = token expiry
```

**Confidence:** HIGH (jose is the standard Web Crypto JWT library; bcryptjs is unchanged; the custom pattern is appropriate for this auth model)

---

### Form Validation

**Recommendation: Zod + React Hook Form**

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| zod | ^3.23 | Schema validation | Runtime type validation for forms AND API inputs. Single source of truth for data shapes. Works identically client and server. |
| react-hook-form | ^7.52 | Form state management | Minimal re-renders, excellent TypeScript integration, uncontrolled inputs. |
| @hookform/resolvers | ^3.9 | zod ↔ RHF bridge | Connects zod schemas to react-hook-form validation. |

**Why this combination:**
- Zod schemas defined once, used for both client-side form validation AND server-side API route validation — no duplication
- Financial inputs (amounts, percentages) need strict runtime validation — zod's `.refine()` handles business rules
- react-hook-form has minimal re-render overhead; important for forms with many fields (debt tracker, pot allocation editor)
- This is the de-facto standard pairing in 2025 Next.js projects

**Why NOT Formik:** Slower, more re-renders, losing community mindshare to react-hook-form.
**Why NOT yup:** zod is TypeScript-first; yup requires manual type annotation alongside schema.

**Confidence:** HIGH (this stack is well-established and unchanged from 2024/2025)

---

### UI Component Library

**Recommendation: shadcn/ui**

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| shadcn/ui | latest (CLI-installed) | Component library | Components are copied into your codebase — no version lock, full customization. Built on Radix UI + Tailwind CSS. |
| Tailwind CSS | ^3.4 | Utility CSS | Required by shadcn/ui; excellent for dashboard-style layouts. |
| Radix UI | (via shadcn) | Accessible primitives | Dialogs, dropdowns, tooltips — accessible by default. |
| tailwind-merge | ^2.x | Class merging utility | Required for clean Tailwind component composition. |
| class-variance-authority | ^0.7 | Component variants | Used by shadcn components for size/variant props. |

**Why shadcn/ui:**
- No dependency to upgrade — components live in `components/ui/`, fully editable
- Violet (`#7c3aed`) maps exactly to shadcn's `violet` theme preset — matches PotPlanner branding with zero customization
- Dashboard-oriented component set: tables, cards, dialogs, forms, badges — all needed for budget app
- Radix primitives provide ARIA-compliant dialogs and dropdowns for free
- The dominant component strategy for Next.js App Router projects in 2025

**Why NOT Material UI / Chakra UI / Mantine:**
- All impose design systems that fight against custom branding
- Large bundle size for components you can't tree-shake effectively
- shadcn gives identical result with less overhead and full ownership

**Confidence:** HIGH (shadcn/ui is the clear community consensus for 2025/2026 Next.js projects)

---

### Chart Library

**Recommendation: Recharts**

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Recharts | ^2.12 | Charts (spending donut, trends) | React-native, composable, TypeScript support. shadcn/ui's chart component wraps Recharts — seamless integration. |

**Why Recharts:**
- shadcn/ui ships a `Chart` component that wraps Recharts — using them together means charts inherit shadcn theming automatically
- PotPlanner needs: donut/pie chart (spending by pot), possibly bar charts (monthly trends) — Recharts covers both cleanly
- SVG-based, no canvas complexity, works in SSR context
- Smaller than Chart.js for React use cases

**Why NOT Chart.js:**
- Not React-native — requires react-chartjs-2 wrapper, adding abstraction
- Canvas-based — more complex for responsive layouts
- Larger bundle for the same output

**Why NOT Tremor / Victory:**
- Tremor is being deprecated in favour of shadcn chart components
- Victory is heavier and less common in 2025

**Confidence:** MEDIUM-HIGH (Recharts + shadcn chart integration is well-established; verify Recharts v2 vs v3 migration status before starting)

---

### Testing

**Recommendation: Vitest + React Testing Library + Playwright**

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vitest | ^2.x | Unit + integration tests | Vite-powered, Jest-compatible API, significantly faster than Jest, native TypeScript + ESM support. |
| @testing-library/react | ^16.x | Component testing | Standard for testing React components by user behavior. |
| @testing-library/user-event | ^14.x | User interaction simulation | Realistic input simulation (better than fireEvent). |
| Playwright | ^1.44 | E2E browser tests | Best-in-class E2E, reliable selectors, cross-browser. MCP integration available. |
| @vitejs/plugin-react | ^4.x | React transform for Vitest | Needed for JSX in Vitest. |

**Why Vitest over Jest:**
- 5-10x faster on cold starts — critical for a 48-test financial engine
- Zero config for TypeScript and ESM — no `ts-jest` or Babel pipeline needed
- Jest-compatible API — any Jest knowledge transfers directly
- Active development; Jest is largely in maintenance mode in 2025

**Why Playwright over Cypress:**
- Faster, more reliable, better for multi-tab or complex navigation scenarios
- Official MCP server available (listed in PROJECT.md as a plugin) — integrates directly with Claude Code workflow
- Better CI/Docker support with built-in container images

**Testing priorities for PotPlanner:**
1. Unit tests for financial engine (pot allocation, debt calculations, bill forecasting) — pure functions, Vitest
2. Integration tests for API routes (auth flow, CRUD endpoints) — Vitest with test database
3. E2E tests for critical user flows (login, add pot, add bill, view dashboard) — Playwright

**Confidence:** HIGH (Vitest is the established winner for Next.js in 2025; Playwright is stable)

---

### Redis Client

**Recommendation: ioredis**

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| ioredis | ^5.4 | Redis client (JWT blacklist, caching) | Full-featured, battle-tested, built-in cluster/sentinel support, TypeScript types included. |

**Why ioredis over node-redis:**
- ioredis has been the production standard for Node.js Redis longer
- Slightly better TypeScript ergonomics; promise-based by default
- Cluster support if you ever scale (node-redis added cluster support later and it's less mature)
- More community examples and Stack Overflow answers for ioredis

**Why NOT node-redis v4:**
- node-redis v4 modernized the API and closed the gap significantly
- Either works — but ioredis has more production pedigree and the ecosystem leaned toward it historically
- If team already knows node-redis, switching cost is low; but for greenfield, ioredis is safer bet

**For the JWT blacklist pattern:**
```typescript
// Store jti on logout with TTL = remaining token lifetime
await redis.set(`blacklist:${jti}`, '1', 'EX', secondsUntilExpiry)
// Check on every authenticated request
const isBlacklisted = await redis.exists(`blacklist:${jti}`)
```

**Confidence:** MEDIUM (both ioredis and node-redis are solid; this is a preference call; verify ioredis v5 maintenance status)

---

### Docker / Container Setup

**Recommendation: Multi-stage Dockerfile + Docker Compose**

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Docker (multi-stage) | — | Next.js container | Build stage + runtime stage; output: ~200MB image vs ~1.5GB naive |
| Docker Compose | v2.x | Service orchestration | next-app + postgres + redis + nginx in one compose file |
| Nginx | alpine | Reverse proxy | Static asset caching, SSL termination, compression |

**Next.js Dockerfile pattern (standalone output):**

`next.config.ts` must set:
```typescript
output: 'standalone'
```

This tells Next.js to bundle only what's needed for runtime. The multi-stage Dockerfile then:
1. `FROM node:22-alpine AS builder` — install deps, run `next build`
2. `FROM node:22-alpine AS runner` — copy `.next/standalone` + `.next/static` + `public`
3. Result: minimal image with no devDependencies

**Docker Compose structure:**
```yaml
services:
  app:        # Next.js standalone
  postgres:   # postgres:16-alpine
  redis:      # redis:7-alpine
  nginx:      # nginx:alpine
```

**Key practices:**
- Health checks on postgres and redis; app depends_on with condition: service_healthy
- Environment variables via `.env` file (never commit); `.env.example` committed
- Nginx handles SSL via Let's Encrypt or self-signed for local
- Database migrations run as a separate `migrate` service (one-shot) before `app` starts, OR as an entrypoint script

**Why NOT Traefik:** Overkill for a single self-hosted app; Nginx is simpler and well-understood.

**Confidence:** HIGH (Next.js standalone output + multi-stage Docker is the documented official pattern)

---

### CI/CD (GitHub Actions)

| Technology | Purpose | Why |
|------------|---------|-----|
| GitHub Actions | CI pipeline | Already decided; standard for GitHub repos |
| Node.js 22 action | Runtime | Match production Node version |
| `actions/cache` | npm cache | Speeds up installs significantly |
| Docker buildx + GHCR | Build + push container | GitHub Container Registry is free; buildx for multi-platform builds |

**Recommended pipeline stages:**
1. `lint` — ESLint (next/core-web-vitals preset) + Prettier check
2. `type-check` — `tsc --noEmit`
3. `test` — Vitest unit + integration (with postgres:16 + redis:7 service containers)
4. `build` — `next build` to validate no build errors
5. `docker` — Build and push to GHCR (main branch only)

**Service containers in Actions for tests:**
```yaml
services:
  postgres:
    image: postgres:16-alpine
    env: { POSTGRES_PASSWORD: test }
  redis:
    image: redis:7-alpine
```

**Confidence:** HIGH (GitHub Actions pattern is stable and well-documented)

---

### Supporting / Utility Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | ^3.6 | Date manipulation | Bill due date calculations, forecasting. Smaller than dayjs, tree-shakeable. |
| decimal.js | ^10.4 | Precise decimal arithmetic | ALL financial calculations — never use native floats for money. |
| lucide-react | ^0.400 | Icons | Ships with shadcn/ui; consistent icon set. |
| clsx | ^2.1 | Conditional class names | Works with tailwind-merge for clean component styling. |
| zod | (see Forms) | API input validation | Also use in Server Actions and Route Handlers, not just forms. |

**Critical: decimal.js for money**
JavaScript floats are binary fractions. `0.1 + 0.2 === 0.30000000000000004`. For a budgeting app handling pot allocations, debt calculations, and bill splits, this will cause visible bugs. Use `decimal.js` for all monetary arithmetic in the financial engine.

**Confidence:** HIGH for decimal.js requirement. MEDIUM for date-fns vs dayjs (both fine; date-fns v3 tree-shakes better).

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| ORM | Drizzle ORM | Prisma | Code generation overhead, DSL outside TypeScript, cloud-push stance |
| ORM | Drizzle ORM | Raw SQL (pg) | No type-safe results, manual typing of complex financial query shapes |
| Auth | Custom jose | Auth.js v5 | Over-engineered for single shared session; fights the Redis blacklist pattern |
| Auth | Custom jose | Passport.js | Designed for Express; awkward in Next.js App Router context |
| Forms | RHF + Zod | Formik | More re-renders, losing community momentum |
| Forms | RHF + Zod | Tanstack Form | Newer, less ecosystem coverage, no proven shadcn integration |
| UI | shadcn/ui | MUI (Material UI) | Google design language; fights custom violet branding; large bundle |
| UI | shadcn/ui | Mantine | Good alternative, but shadcn + Tailwind is more aligned with 2025 Next.js community |
| Charts | Recharts | Chart.js | Canvas-based, requires wrapper, larger bundle for React |
| Charts | Recharts | Tremor | Being deprecated in favour of shadcn chart components |
| Tests (unit) | Vitest | Jest | Slower, needs more config for ESM/TS, largely maintenance mode |
| Tests (E2E) | Playwright | Cypress | Playwright is faster, has MCP integration, better CI support |
| Redis | ioredis | node-redis v4 | Both valid; ioredis has more production pedigree |
| Container | Multi-stage Docker | Single-stage | 7x larger image, includes devDependencies in production |

---

## Installation

```bash
# Core framework (already scaffolded)
npx create-next-app@latest potplanner --typescript --tailwind --app --src-dir --import-alias "@/*"

# ORM + database driver
npm install drizzle-orm postgres
npm install -D drizzle-kit

# Auth
npm install jose bcryptjs
npm install -D @types/bcryptjs

# Forms + validation
npm install zod react-hook-form @hookform/resolvers

# UI components (shadcn CLI installs components individually)
npx shadcn@latest init
npx shadcn@latest add button card dialog form input label select table badge

# Charts
npm install recharts

# Redis
npm install ioredis
npm install -D @types/ioredis  # (check if needed — ioredis v5 ships types)

# Financial utilities
npm install decimal.js date-fns lucide-react clsx tailwind-merge class-variance-authority

# Testing
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event jsdom
npm install -D playwright @playwright/test
```

---

## Sources

- Training data (knowledge cutoff August 2025) — all recommendations
- PROJECT.md — PotPlanner v2 constraints and context
- Note: Web fetch and web search tools were unavailable during this research session. The following claims are MEDIUM confidence and should be version-verified before locking in:
  - Drizzle ORM `^0.36` / drizzle-kit `^0.27` — verify on npmjs.com
  - Recharts v2 vs v3 — check if v3 released and whether shadcn chart integration updated
  - ioredis v5 — verify maintenance status; node-redis v4 is a valid alternative
  - Next.js 15 stable vs canary status for any App Router features used
