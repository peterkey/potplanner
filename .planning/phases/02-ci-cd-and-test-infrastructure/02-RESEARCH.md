# Phase 2: CI/CD and Test Infrastructure - Research

**Researched:** 2026-03-24
**Domain:** GitHub Actions CI/CD, Playwright E2E, ESLint flat config
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Lint setup:** Use `eslint-config-next` only — no TypeScript-aware rules. Add `"lint": "eslint ."` script. Lint failures block CI.
- **Test script:** Add `"test": "vitest run"` to package.json.
- **CI triggers:** PRs targeting main + direct pushes to main only.
- **CI job structure:** Two parallel jobs — `test` (lint + type-check + vitest + build) and `e2e` (Playwright). `e2e` depends on `test` completing successfully.
- **Both jobs use `hashFiles()` cache keys** for node_modules caching.
- **Database services:** Wire up Postgres 16 and Redis 7 as GitHub Actions service containers. Run `npm run db:migrate` before Vitest tests.
- **Playwright smoke test:** Navigate to `/`, assert redirect to `/login`, assert the login form is present.
- **CI uses Playwright `webServer`:** Builds the app (`next build`), starts `next start`, runs E2E against the production server.
- **Browsers: Chromium + Firefox** (not WebKit — too flaky on Linux CI).
- **Playwright runs as the `e2e` job** (parallel to unit test job, depends on `test` success).

### Claude's Discretion

- Exact GitHub Actions runner version (`ubuntu-latest` is fine)
- Node.js version in CI (match Docker: Node 24)
- Exact cache key structure for node_modules
- Playwright timeout values
- ESLint config file format (`.eslintrc.json` vs `eslint.config.mjs`)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCAF-04 | GitHub Actions CI/CD runs lint, type-check, Vitest unit tests, and build on every push/PR | GitHub Actions workflow with two parallel jobs, npm caching, service containers, and all four quality gate steps documented |
| SCAF-07 | Playwright E2E test infrastructure configured and connected to CI/CD | Playwright 1.58.2 webServer config, Chromium+Firefox projects, smoke test pattern, and CI integration pattern documented |
</phase_requirements>

---

## Summary

Phase 2 establishes the quality gate infrastructure that protects all future development. It has two deliverables: a GitHub Actions workflow and Playwright E2E configuration. Neither involves application logic — this is purely infrastructure.

The key decisions are already locked: two parallel CI jobs (`test` and `e2e`), Postgres 16 + Redis 7 service containers wired now (future phases benefit immediately), and a Playwright smoke test that proves proxy.ts redirect and login page render using the production `next start` server.

Research confirmed all tooling versions, ESLint flat config format (ESLint 9 / `eslint.config.mjs` is the correct approach for Next.js 16), and the exact `actions/setup-node@v6` cache mechanism. No surprises — the locked decisions are well-supported by current official documentation.

**Primary recommendation:** Use `actions/setup-node@v6` with `cache: 'npm'` for automatic hashFiles-based caching; use `eslint.config.mjs` with `eslint-config-next/core-web-vitals` flat config; use Playwright `webServer` with `next build && next start` for production-equivalent E2E.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@playwright/test` | 1.58.2 | E2E test runner + browser automation | Official Playwright test runner; includes all browsers, fixtures, and CI helpers |
| `eslint` | 10.1.0 | JavaScript/TypeScript linter | Peer dependency of eslint-config-next; ESLint 9 flat config is required for Next.js 16 |
| `eslint-config-next` | 16.2.1 | Next.js lint rules | Official Next.js ESLint config; includes React, React Hooks, and @next/eslint-plugin-next rules |

### Supporting (GitHub Actions)

| Action | Version | Purpose | When to Use |
|--------|---------|---------|-------------|
| `actions/checkout` | v4 | Checkout repo | Every job |
| `actions/setup-node` | v6 | Set up Node.js + npm cache | Every job; built-in npm caching via `cache: 'npm'` |
| `actions/upload-artifact` | v4 | Share build artifact between jobs | `test` job uploads `.next/`; `e2e` job downloads it |

**Version verification (confirmed 2026-03-24):**
```bash
npm view @playwright/test version   # 1.58.2
npm view eslint version             # 10.1.0
npm view eslint-config-next version # 16.2.1
```

**Installation:**
```bash
npm install -D @playwright/test eslint eslint-config-next
npx playwright install chromium firefox --with-deps
```

---

## Architecture Patterns

### Recommended File Structure (new files this phase)

```
.github/
└── workflows/
    └── ci.yml                # Single workflow: test + e2e jobs
playwright.config.ts          # Playwright config at repo root
e2e/
└── smoke.spec.ts             # Smoke test: / → /login redirect + login form
eslint.config.mjs             # ESLint flat config (ESLint 9 format)
```

**Modified files:**
```
package.json                  # Add "lint" and "test" scripts
```

### Pattern 1: GitHub Actions Workflow — Two Parallel Jobs

**What:** A single `ci.yml` with two jobs: `test` (lint + type-check + vitest + build) and `e2e` (Playwright). The `e2e` job declares `needs: test` so it only starts when `test` succeeds.

**When to use:** Always. This is the entire CI structure for this phase.

```yaml
# Source: https://docs.github.com/en/actions/writing-workflows
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
          POSTGRES_DB: potplanner
          POSTGRES_USER: potplanner
          POSTGRES_PASSWORD: potplanner
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    env:
      DATABASE_URL: postgresql://potplanner:potplanner@localhost:5432/potplanner
      REDIS_URL: redis://localhost:6379
      JWT_SECRET: ci-test-secret
      NODE_ENV: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v6
        with:
          node-version: 24
          cache: 'npm'
      - run: npm ci
      - run: npm run db:migrate
      - run: npm run lint
      - run: npm run type-check
      - run: npm test
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: next-build
          path: .next/
          retention-days: 1

  e2e:
    needs: test
    runs-on: ubuntu-latest
    env:
      DATABASE_URL: postgresql://potplanner:potplanner@localhost:5432/potplanner
      REDIS_URL: redis://localhost:6379
      JWT_SECRET: ci-test-secret
      NODE_ENV: production
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v6
        with:
          node-version: 24
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install chromium firefox --with-deps
      - uses: actions/download-artifact@v4
        with:
          name: next-build
          path: .next/
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

**Critical notes on service containers:**
- Service containers only work when the job runs on `ubuntu-latest` (not inside a container itself). The runner host exposes service ports on `localhost`.
- Port must be mapped explicitly (`ports: - 5432:5432`) for `ubuntu-latest` runner-host jobs — otherwise the port is only reachable by container-mode jobs.
- The `options:` health check syntax uses `--health-cmd` flags, not the Docker Compose `test:` array syntax.

### Pattern 2: npm Caching with actions/setup-node@v6

**What:** `actions/setup-node@v6` has built-in npm caching when `cache: 'npm'` is set. It automatically uses `hashFiles('**/package-lock.json')` as part of the cache key — no manual `actions/cache` step needed.

**When to use:** On every job that runs `npm ci`.

```yaml
# Source: https://github.com/actions/setup-node README
- uses: actions/setup-node@v6
  with:
    node-version: 24
    cache: 'npm'
```

The action caches `~/.npm` (the npm global cache). The cache key includes runner OS + hashFiles of package-lock.json automatically. This satisfies the CONTEXT.md requirement for `hashFiles()` cache keys.

### Pattern 3: ESLint Flat Config (eslint.config.mjs)

**What:** Next.js 16 removed `next lint`. ESLint is now configured via `eslint.config.mjs` using ESLint 9 flat config format. The correct import is `eslint-config-next/core-web-vitals`.

**When to use:** This is the only supported format for Next.js 16 + ESLint 10.

```javascript
// Source: https://nextjs.org/docs/app/api-reference/config/eslint (v16.2.1, 2026-03-20)
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = defineConfig([
  ...nextVitals,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])

export default eslintConfig
```

**IMPORTANT:** `defineConfig` and `globalIgnores` are imported from `'eslint/config'` (ESLint 9 API), NOT from `eslint-config-next`. The CONTEXT.md decision says "no TypeScript-aware rules" — use `core-web-vitals` only, not `eslint-config-next/typescript`.

### Pattern 4: Playwright Config with webServer

**What:** `playwright.config.ts` at repo root configures the test framework, browsers, and the webServer that CI starts before tests run.

**When to use:** This config drives all E2E tests in this phase and all future phases.

```typescript
// Source: https://playwright.dev/docs/test-configuration
// Source: https://nextjs.org/docs/app/api-reference/config/testing/playwright (v16.2.1)
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    // WebKit intentionally excluded — too flaky on Linux CI
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
```

**Note on webServer + CI build:** The CONTEXT.md decision says CI builds the app first (`next build`), then E2E starts `next start`. This means the `e2e` job downloads the `.next/` build artifact from the `test` job and runs `next start` — the `webServer.command` is `npm run start` (which calls `next start`). The build itself is NOT done inside the webServer command.

### Pattern 5: Playwright Smoke Test

**What:** A single test that navigates to `/` and asserts the redirect to `/login` with the login form visible. Proves: app boots, Next.js routing works, proxy.ts is redirecting.

```typescript
// e2e/smoke.spec.ts
import { test, expect } from '@playwright/test'

test('unauthenticated root redirects to login with form', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL('/login')
  await expect(page.getByRole('form')).toBeVisible()
  // OR: await expect(page.locator('input[type="email"]')).toBeVisible()
})
```

**Note:** The exact form selector depends on what Phase 3 (Auth) builds. For this phase, a placeholder that asserts the page reached `/login` and contains `input[type="email"]` or similar is sufficient. The selector can be refined once the login form exists.

### Anti-Patterns to Avoid

- **Using `next lint` in CI:** Removed in Next.js 16. Use `eslint .` directly.
- **Using `.eslintrc.json` format:** ESLint 9 flat config (`eslint.config.mjs`) is the required format for Next.js 16. The legacy `.eslintrc` format may still work but is deprecated.
- **Running Playwright against `next dev`:** Always use `next build` + `next start` in CI. Dev server has different behaviour, HMR overhead, and is not representative of production.
- **Skipping health checks on service containers:** Without `--health-cmd` options, the `npm run db:migrate` step may run before Postgres is ready, causing intermittent failures.
- **Port mapping omission for ubuntu-latest jobs:** Service containers on ubuntu-latest runner host require explicit `ports: - 5432:5432`. Without this mapping, the service is unreachable on `localhost`.
- **Using `actions/cache` manually:** `actions/setup-node@v6` with `cache: 'npm'` handles this automatically with correct hashFiles keys. Manual caching is redundant and error-prone.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| npm cache invalidation | Custom cache key logic | `actions/setup-node@v6` with `cache: 'npm'` | Automatically hashes package-lock.json; handles OS-specific keys, restore-keys fallback |
| Browser management in CI | Install browsers manually | `npx playwright install chromium firefox --with-deps` | Installs browsers + system dependencies in one command |
| Test server lifecycle | Manual start/stop scripts | Playwright `webServer` config | Playwright starts the server, waits for it, and tears it down automatically |
| ESLint Next.js rules | Custom rule configuration | `eslint-config-next/core-web-vitals` | Bundles React, React Hooks, and @next/eslint-plugin-next recommended rules |

**Key insight:** CI infrastructure has significant "known gotchas" (service container networking, cache key correctness, browser deps). Use the official actions and Playwright's own mechanisms — they handle the edge cases.

---

## Common Pitfalls

### Pitfall 1: Service Container Port Mapping (ubuntu-latest vs container jobs)

**What goes wrong:** The `db:migrate` step gets `ECONNREFUSED` connecting to `localhost:5432` even though the service container is defined.

**Why it happens:** When the job runs on `ubuntu-latest` (runner host), service container ports are NOT automatically exposed on `localhost` — they require explicit `ports:` mapping in the workflow. This is different from jobs that run inside a container, where service names are used as hostnames.

**How to avoid:** Always add `ports: - 5432:5432` and `ports: - 6379:6379` under each service when using `ubuntu-latest` runner.

**Warning signs:** `ECONNREFUSED 127.0.0.1:5432` in CI but services appear healthy.

### Pitfall 2: ESLint Config Format Mismatch

**What goes wrong:** `eslint .` fails with parse errors or "config not found" errors.

**Why it happens:** `eslint-config-next` in Next.js 16 expects ESLint 9 flat config format. Using `.eslintrc.json` or the old `extends` format triggers deprecation errors or silent misconfigurations.

**How to avoid:** Always use `eslint.config.mjs` with `import { defineConfig } from 'eslint/config'` and `import nextVitals from 'eslint-config-next/core-web-vitals'`.

**Warning signs:** ESLint exits 0 but doesn't actually check files; or ESLint throws "Configuration for rule X is invalid".

### Pitfall 3: Playwright webServer Timing

**What goes wrong:** Playwright tests start before `next start` is ready, causing connection refused errors on the first test.

**Why it happens:** `next start` (standalone mode) can take 3-8 seconds to be ready after the process starts.

**How to avoid:** Set `webServer.url: 'http://localhost:3000'` — Playwright polls this URL until it responds before running tests. Set `timeout: 120_000` for CI where startup is slower. Always set `reuseExistingServer: !process.env.CI` so CI always gets a fresh server.

**Warning signs:** First test fails with "net::ERR_CONNECTION_REFUSED" and retries pass.

### Pitfall 4: Build Artifact Sharing

**What goes wrong:** The `e2e` job runs `next build` again, wasting time (2-4 minutes) and potentially getting a different build than what unit tests ran against.

**Why it happens:** If the `.next/` directory is not passed between jobs, Playwright's webServer can't start `next start` without a prior build.

**How to avoid:** The `test` job uploads `.next/` as an artifact; the `e2e` job downloads it before running Playwright. Set `retention-days: 1` — this artifact is ephemeral.

**Warning signs:** `e2e` job takes as long as `test` job; `next start` fails with "missing build".

### Pitfall 5: `next build` with `output: 'standalone'` and Playwright

**What goes wrong:** Playwright's webServer `next start` works but static assets (CSS/JS) fail to load in E2E tests.

**Why it happens:** `output: 'standalone'` produces a self-contained server that does NOT serve static files from `.next/static/` unless those files are in the expected location. When downloading the artifact, the `public/` and `.next/static/` directories may be missing.

**How to avoid:** For the smoke test (which only checks routing and form presence, not asset loading), this is not an issue. For visual tests in later phases, the standalone server setup will need attention. This is flagged for future phases.

**Warning signs:** Styles missing in Playwright screenshots; network errors for `/_next/static/` assets.

---

## Code Examples

### package.json scripts additions

```json
{
  "scripts": {
    "lint": "eslint .",
    "test": "vitest run"
  }
}
```

### Complete eslint.config.mjs

```javascript
// Source: https://nextjs.org/docs/app/api-reference/config/eslint (Next.js 16.2.1)
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = defineConfig([
  ...nextVitals,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])

export default eslintConfig
```

### Complete playwright.config.ts

```typescript
// Source: https://playwright.dev/docs/test-configuration
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
```

### Smoke test skeleton

```typescript
// e2e/smoke.spec.ts
import { test, expect } from '@playwright/test'

test('unauthenticated root redirects to login page', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL('/login')
  // Login form presence — selector to be confirmed against Phase 3 login page
  await expect(page.locator('input[type="email"]')).toBeVisible()
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `next lint` command | `eslint .` with `eslint.config.mjs` | Next.js 16.0.0 | `next lint` is removed; flat config is required |
| `.eslintrc.json` extends format | `eslint.config.mjs` flat config | ESLint 9 / Next.js 15+ | Old format still works but deprecated; new projects must use flat config |
| `actions/setup-node@v3` + manual `actions/cache` | `actions/setup-node@v6` with `cache: 'npm'` | actions/setup-node v4+ | Built-in caching eliminates manual cache step |
| Playwright `--legacy-peer-deps` install issues | `npx playwright install --with-deps` | Playwright 1.20+ | `--with-deps` handles all system library deps on Linux |

**Deprecated/outdated:**
- `next lint`: Removed in Next.js 16.0.0. Use `eslint .` directly.
- `.eslintrc.json` / `eslintConfig` field in package.json: Deprecated in ESLint 9. Will cause warnings.
- `actions/setup-node@v2` and v3: Current is v6. Old versions do not have built-in caching parity.

---

## Open Questions

1. **Smoke test login form selector**
   - What we know: The smoke test needs to assert the login form is present at `/login`
   - What's unclear: The exact DOM structure of the login form (built in Phase 3)
   - Recommendation: Use a broad selector (`input[type="email"]`) as a placeholder. The smoke test task should note it may need updating after Phase 3.

2. **`output: 'standalone'` and static assets in E2E**
   - What we know: Standalone mode produces a self-contained server; `next start` works for serving pages
   - What's unclear: Whether static assets are correctly served when `.next/` is downloaded as a CI artifact without the public/ directory
   - Recommendation: Scope the smoke test to routing and form presence only (no asset assertions). Flag for Phase 9 (UX Polish) when visual testing matters.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `vitest.config.mts` (exists) |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run --coverage` |
| E2E framework | Playwright 1.58.2 |
| E2E run command | `npx playwright test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCAF-04 | Lint passes on codebase | CI (lint step) | `npm run lint` | ❌ Wave 0: `eslint.config.mjs` + `lint` script |
| SCAF-04 | Type-check passes | CI (type-check step) | `npm run type-check` | ✅ script exists |
| SCAF-04 | Vitest unit tests pass | CI (test step) | `npm test` | ❌ Wave 0: `test` script in package.json |
| SCAF-04 | Next.js build succeeds | CI (build step) | `npm run build` | ✅ script exists |
| SCAF-07 | Playwright smoke test passes | E2E smoke | `npx playwright test` | ❌ Wave 0: `playwright.config.ts` + `e2e/smoke.spec.ts` |
| SCAF-07 | Smoke test: `/` redirects to `/login` | E2E assertion | `npx playwright test` | ❌ Wave 0 |
| SCAF-07 | Smoke test: login form is present | E2E assertion | `npx playwright test` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run type-check`
- **Per wave merge:** `npm run type-check && npm run build`
- **Phase gate:** All of the above + `npm run lint && npm test && npx playwright test`

### Wave 0 Gaps

- [ ] `eslint.config.mjs` — ESLint flat config; enables `npm run lint`
- [ ] `package.json` `lint` script — `"lint": "eslint ."`
- [ ] `package.json` `test` script — `"test": "vitest run"`
- [ ] `playwright.config.ts` — Playwright configuration at repo root
- [ ] `e2e/smoke.spec.ts` — smoke test covering SCAF-07
- [ ] Playwright install: `npx playwright install chromium firefox --with-deps`
- [ ] ESLint install: `npm install -D eslint eslint-config-next`
- [ ] Playwright install: `npm install -D @playwright/test`
- [ ] `.github/workflows/ci.yml` — GitHub Actions workflow

---

## Sources

### Primary (HIGH confidence)

- Next.js official docs (nextjs.org/docs/app/api-reference/config/eslint, v16.2.1, dated 2026-03-20) — ESLint flat config format, `eslint-config-next/core-web-vitals` usage, `next lint` removal
- Playwright official docs (playwright.dev/docs/test-configuration, playwright.dev/docs/ci) — `webServer` config, browser projects, CI setup
- npm registry (2026-03-24) — confirmed `@playwright/test@1.58.2`, `eslint@10.1.0`, `eslint-config-next@16.2.1`
- `actions/setup-node` README (github.com/actions/setup-node) — `cache: 'npm'` built-in hashFiles caching, v6.2.0

### Secondary (MEDIUM confidence)

- GitHub Actions example-services (github.com/actions/example-services) — PostgreSQL and Redis service container patterns with health checks
- WebSearch: GitHub Actions service container networking (multiple GitHub Docs sources) — port mapping requirement for ubuntu-latest jobs

### Tertiary (LOW confidence)

- WebSearch: `output: 'standalone'` + Playwright artifact sharing — no official source found; flagged as open question

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions confirmed from npm registry 2026-03-24
- ESLint flat config: HIGH — fetched directly from Next.js 16.2.1 official docs (dated 2026-03-20)
- GitHub Actions structure: HIGH — confirmed via official action README and example-services
- Playwright config: HIGH — fetched from playwright.dev official docs
- Service container networking: MEDIUM — GitHub Docs confirmed, but practical port-mapping requirement verified from community sources
- Standalone + artifact sharing: LOW — flagged as open question; smoke test scope avoids the risk

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable tooling; ESLint/Playwright release frequently but breaking changes in config format are rare)
