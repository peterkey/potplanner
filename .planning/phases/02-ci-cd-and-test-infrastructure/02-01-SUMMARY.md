---
phase: 02-ci-cd-and-test-infrastructure
plan: 01
subsystem: infra
tags: [eslint, vitest, eslint-config-next, linting, testing, quality-gates]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Next.js 16 app scaffold, package.json, vitest.config.mts

provides:
  - ESLint 9 flat config (eslint.config.mjs) with eslint-config-next/core-web-vitals
  - npm run lint script (eslint .)
  - npm run test script (vitest run)
  - passWithNoTests: true in vitest config for CI compatibility

affects:
  - 02-ci-cd-and-test-infrastructure (plan 02 calls these scripts in CI workflow)
  - all future phases (lint and test gates active on every commit)

# Tech tracking
tech-stack:
  added:
    - eslint@9.39.4
    - eslint-config-next@16.1.7
  patterns:
    - ESLint 9 flat config format (eslint.config.mjs with defineConfig from eslint/config)
    - Fixed react version string in settings to avoid eslint-plugin-react ESLint 9 API incompatibility

key-files:
  created:
    - eslint.config.mjs
  modified:
    - package.json (added lint and test scripts, eslint devDependencies)
    - vitest.config.mts (added passWithNoTests: true)
    - package-lock.json

key-decisions:
  - "Use eslint@9 not eslint@10: eslint-plugin-react@7.37.x (bundled in eslint-config-next) calls context.getFilename() removed in ESLint 10; ESLint 9 is compatible"
  - "Set settings.react.version to 19.2.3 in eslint.config.mjs: prevents eslint-plugin-react from calling detectReactVersion which uses the removed getFilename API"
  - "Add passWithNoTests: true to vitest.config.mts: Vitest exits code 1 with no test files by default; CI must pass before tests are written"

patterns-established:
  - "Lint config: eslint.config.mjs at repo root, flat config format, core-web-vitals ruleset, explicit react version in settings"
  - "Test script: vitest run (single-run mode for CI); passWithNoTests: true allows CI to pass before test files exist"

requirements-completed:
  - SCAF-04

# Metrics
duration: 4min
completed: 2026-03-24
---

# Phase 2 Plan 01: ESLint + Lint/Test Scripts Summary

**ESLint 9 flat config with eslint-config-next/core-web-vitals, lint and test npm scripts, and vitest passWithNoTests — all three quality gate commands exit 0**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-24T10:15:20Z
- **Completed:** 2026-03-24T10:19:23Z
- **Tasks:** 1
- **Files modified:** 4

## Accomplishments

- ESLint installed (v9.39.4) with eslint-config-next@16.1.7 and flat config created
- `npm run lint` (eslint .) passes cleanly against the full codebase
- `npm run test` (vitest run) passes with no test files present
- `npm run type-check` continues to pass after all changes

## Task Commits

Each task was committed atomically:

1. **Task 1: Install ESLint dependencies and create flat config** - `46eb81c` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `eslint.config.mjs` - ESLint 9 flat config with core-web-vitals ruleset and react version override
- `package.json` - Added `lint` and `test` scripts; eslint and eslint-config-next devDependencies
- `vitest.config.mts` - Added `passWithNoTests: true` to allow CI to pass before tests exist
- `package-lock.json` - Updated lockfile for new ESLint dependencies

## Decisions Made

- **Use eslint@9 not eslint@10:** The research noted `eslint@10.1.0` as the target, but `eslint-plugin-react@7.37.x` (bundled inside `eslint-config-next`) calls `context.getFilename()` which was removed in ESLint 10's flat config API. ESLint 9 retains this compatibility shim. Downgraded to `eslint@9.39.4`.
- **Fixed react version in config:** Set `settings.react.version: '19.2.3'` in `eslint.config.mjs` to prevent `eslint-plugin-react` from calling `detectReactVersion` (which calls the removed `getFilename` API). Without this, ESLint 9 also crashes when `version: 'detect'` triggers version resolution.
- **passWithNoTests in vitest:** Vitest 4.x exits with code 1 when no test files are found. CI would fail from the start without `passWithNoTests: true`. Added to `vitest.config.mts` rather than the npm script to keep the setting explicit and configurable.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Downgraded eslint from 10 to 9 due to eslint-plugin-react API incompatibility**
- **Found during:** Task 1 (Install ESLint and create flat config)
- **Issue:** `eslint@10.1.0` removed the `context.getFilename()` API used by `eslint-plugin-react@7.37.x` bundled in `eslint-config-next`. Running `npm run lint` threw `TypeError: contextOrFilename.getFilename is not a function`.
- **Fix:** Installed `eslint@^9.0.0` (resolved to 9.39.4) which still has the compatibility layer. Added `settings.react.version: '19.2.3'` to skip version auto-detection which also triggers the failing API.
- **Files modified:** package.json, package-lock.json, eslint.config.mjs
- **Verification:** `npm run lint` exits 0 with no errors
- **Committed in:** 46eb81c (Task 1 commit)

**2. [Rule 2 - Missing Critical] Added passWithNoTests: true to vitest.config.mts**
- **Found during:** Task 1 (running npm test verification)
- **Issue:** `vitest run` with no test files exits code 1, causing CI to fail before any tests are written.
- **Fix:** Added `passWithNoTests: true` to `vitest.config.mts` test config block.
- **Files modified:** vitest.config.mts
- **Verification:** `npm test` exits 0 with "No test files found, exiting with code 0"
- **Committed in:** 46eb81c (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug/incompatibility, 1 missing critical config)
**Impact on plan:** Both fixes necessary for the quality gates to function. No scope creep. ESLint 9 is the correct peer-compatible version for eslint-config-next@16.1.7.

## Issues Encountered

- ESLint 10 incompatibility with `eslint-plugin-react@7.37.x` bundled in `eslint-config-next` — the `getFilename()` API was removed in ESLint 10 flat config. Research noted eslint@10.1.0 as the target version but this is not compatible. ESLint 9 is the correct choice given the bundled plugin versions.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `npm run lint` and `npm test` scripts are in place and working — Plan 02 (GitHub Actions CI workflow) can now reference these scripts in CI steps
- All three quality gate commands pass: lint, test, type-check
- No blockers for Plan 02

---
*Phase: 02-ci-cd-and-test-infrastructure*
*Completed: 2026-03-24*
