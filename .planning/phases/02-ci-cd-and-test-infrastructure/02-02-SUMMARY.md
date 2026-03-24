---
phase: 02-ci-cd-and-test-infrastructure
plan: 02
subsystem: testing
tags: [playwright, github-actions, ci, e2e, chromium, firefox, postgres, redis]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Next.js app scaffold with output:standalone, login page, Docker compose with postgres:16 and redis:7

provides:
  - Playwright configured with Chromium and Firefox for E2E testing
  - Smoke test proving app boots and login page renders
  - GitHub Actions CI pipeline with test and e2e jobs
  - Build artifact sharing between CI jobs (no redundant builds)

affects:
  - 03-auth (e2e smoke test will be updated when login form is added)
  - all future phases (CI gates all PRs to main)

# Tech tracking
tech-stack:
  added: ["@playwright/test"]
  patterns:
    - "Playwright webServer uses node .next/standalone/server.js with PORT=3000 HOSTNAME=0.0.0.0 (required for output:standalone)"
    - "E2E smoke test navigates directly to /login (proxy.ts not yet present; redirect test added in Phase 3)"
    - "CI test job uploads .next/ artifact; e2e job downloads it to avoid rebuilding"
    - "actions/setup-node@v6 with cache: npm for hashFiles-based caching"

key-files:
  created:
    - playwright.config.ts
    - e2e/smoke.spec.ts
    - .github/workflows/ci.yml
  modified:
    - package.json (added @playwright/test devDependency)
    - .gitignore (added test-results/ and playwright-report/)

key-decisions:
  - "Playwright webServer command uses node .next/standalone/server.js not npm run start — output:standalone incompatible with next start"
  - "Chromium + Firefox only, no WebKit — too flaky on Linux CI"
  - "reuseExistingServer: !process.env.CI ensures CI always gets a fresh server"
  - "Smoke test navigates directly to /login since proxy.ts not yet present; will be updated in Phase 3"
  - "CI e2e job downloads pre-built .next/ artifact from test job — no redundant build"
  - "Both CI jobs include Postgres 16 and Redis 7 service containers for future phases to use immediately"

patterns-established:
  - "E2E tests live in e2e/ directory, Playwright config at repo root"
  - "webServer.command must use standalone server for output:standalone Next.js apps"

requirements-completed: [SCAF-04, SCAF-07]

# Metrics
duration: 7min
completed: 2026-03-24
---

# Phase 02 Plan 02: CI/CD and E2E Infrastructure Summary

**Playwright E2E infrastructure with Chromium/Firefox smoke test and two-job GitHub Actions CI pipeline sharing a pre-built .next/ artifact**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-24T10:21:27Z
- **Completed:** 2026-03-24T10:28:34Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Playwright installed with Chromium and Firefox; smoke test verifies login page renders in 160ms
- playwright.config.ts configured with standalone server start, 120s timeout, CI-aware settings
- GitHub Actions CI workflow with two jobs: test (lint+type-check+vitest+build) and e2e (Playwright)
- Both CI jobs wire Postgres 16-alpine and Redis 7-alpine service containers with health checks
- Build artifact sharing from test to e2e job eliminates redundant builds

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Playwright and create config + smoke test** - `423e669` (feat)
2. **Task 2: Create GitHub Actions CI workflow** - `715631b` (feat)

**Plan metadata:** (docs commit — see final_commit step)

## Files Created/Modified

- `playwright.config.ts` - Playwright config with Chromium+Firefox, standalone webServer, CI-aware settings
- `e2e/smoke.spec.ts` - Smoke test verifying login page heading renders
- `.github/workflows/ci.yml` - Two-job CI pipeline (test + e2e) with service containers
- `package.json` - Added @playwright/test devDependency
- `.gitignore` - Added test-results/ and playwright-report/ exclusions

## Decisions Made

- `webServer.command` uses `PORT=3000 HOSTNAME=0.0.0.0 node .next/standalone/server.js` — `npm run start` (which calls `next start`) does not work with `output: 'standalone'`; Next.js warns that standalone output requires the standalone server directly
- Smoke test navigates to `/login` directly — `proxy.ts` does not exist yet (added in Phase 3 with auth); redirect test will be added then
- No WebKit/Safari in Playwright projects — too flaky on Linux CI runners; only Chromium and Firefox

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed webServer command incompatible with output:standalone**
- **Found during:** Task 1 (Playwright config creation and smoke test run)
- **Issue:** Plan specified `command: 'npm run start'` but Next.js 16 warns that `next start` does not work with `output: 'standalone'`. The standalone build requires `node .next/standalone/server.js` directly.
- **Fix:** Changed `command` to `PORT=3000 HOSTNAME=0.0.0.0 node .next/standalone/server.js` and verified the server starts and responds on port 3000.
- **Files modified:** `playwright.config.ts`
- **Verification:** `npx playwright test --project=chromium` passes (1 passed in 3.1s, no timeout)
- **Committed in:** `423e669` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — webServer command)
**Impact on plan:** Fix necessary for correctness. Without it, the webServer would time out in CI and fail all E2E tests. No scope creep.

## Issues Encountered

- Initial `npx playwright install --with-deps` failed due to sudo requirement in local environment — installed browsers without `--with-deps` locally; CI workflow uses `--with-deps` as specified (runs with appropriate permissions on GitHub Actions runners).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CI pipeline is ready to gate all PRs to main once the repo is pushed to GitHub
- E2E smoke test will need updating in Phase 3 when proxy.ts is added (replace direct `/login` navigation with redirect assertion from `/`)
- Both CI jobs already wire Postgres and Redis service containers, so Phase 3 auth tests can add DB calls immediately

---
*Phase: 02-ci-cd-and-test-infrastructure*
*Completed: 2026-03-24*

## Self-Check: PASSED

All files verified present:
- playwright.config.ts: FOUND
- e2e/smoke.spec.ts: FOUND
- .github/workflows/ci.yml: FOUND
- 02-02-SUMMARY.md: FOUND

All commits verified:
- 423e669: FOUND
- 715631b: FOUND
