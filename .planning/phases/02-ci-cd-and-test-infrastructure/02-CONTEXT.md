# Phase 2: CI/CD and Test Infrastructure - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

GitHub Actions CI pipeline that runs lint, type-check, Vitest unit tests, and Next.js build on every push/PR. Playwright E2E infrastructure installed, configured, and wired to CI with a smoke test. No features, no auth — just the quality gates that protect all future work.

</domain>

<decisions>
## Implementation Decisions

### Lint Setup
- Use `eslint-config-next` only — no TypeScript-aware rules (simpler, no tsconfig integration required)
- Add `"lint": "eslint ."` script to package.json (matches CLAUDE.md convention: `eslint .` not `next lint`)
- Lint failures **block CI** — lint is a required status check before merge

### Test Script
- Add `"test": "vitest run"` to package.json — standard npm convention, matches CI command

### CI Trigger Strategy
- Workflow triggers on: **PRs targeting main** + **direct pushes to main**
- Not every branch — avoids noise and preserves Actions minutes

### CI Job Structure
- **Two parallel jobs**: `test` (lint + type-check + vitest + build) and `e2e` (Playwright)
- `e2e` job depends on a successful `test` job build artifact — no point running E2E if unit tests fail
- Both jobs use `hashFiles()` cache keys for node_modules caching

### Database Services in CI
- Wire up **Postgres 16** and **Redis 7** as GitHub Actions service containers now — future phases can write DB tests immediately without workflow changes
- Run `npm run db:migrate` before Vitest tests — catches migration errors early in CI

### Playwright Smoke Test
- Navigate to `/`, assert redirect to `/login`, assert the login form is present
- Proves: app boots, Next.js routing works, proxy.ts redirect is functioning
- CI uses Playwright's **`webServer`** config: builds the app (`next build`), starts `next start`, then runs E2E against the real production server
- **Browsers: Chromium + Firefox** (not WebKit — too flaky on Linux CI)
- Playwright runs as the `e2e` job (parallel to unit test job)

### Claude's Discretion
- Exact GitHub Actions runner version (`ubuntu-latest` is fine)
- Node.js version in CI (match Docker: Node 24)
- Exact cache key structure for node_modules
- Playwright timeout values
- ESLint config file format (`.eslintrc.json` vs `eslint.config.mjs`)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project conventions
- `CLAUDE.md` — Stack table (exact versions), test commands, `eslint .` convention, `next lint` removal note
- `.planning/REQUIREMENTS.md` — SCAF-04 (GitHub Actions CI), SCAF-07 (Playwright E2E)
- `.planning/PROJECT.md` — "CI/CD from day one" principle, self-hosted Docker deployment context

### Existing infrastructure
- `vitest.config.mts` — Existing Vitest config (jsdom, react plugin, setup.ts, tsconfigPaths)
- `src/tests/setup.ts` — Existing Vitest setup file (@testing-library/jest-dom)
- `docker-compose.yml` — Service definitions for Postgres 16 and Redis 7 (match these versions in CI service containers)
- `next.config.ts` — `output: 'standalone'` setting (affects build artifact in CI)

No external specs — requirements are fully captured in decisions above and in REQUIREMENTS.md.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `vitest.config.mts`: Already configured with jsdom, @vitejs/plugin-react, vite-tsconfig-paths, and setupFiles — no changes needed, just add `test` script
- `src/tests/setup.ts`: @testing-library/jest-dom already imported — test infrastructure is ready

### Established Patterns
- Package scripts use `npm run` convention (not pnpm/yarn) — CI should use npm
- `type-check` script exists: `tsc --noEmit` — CI reuses this directly
- No `lint` or `test` scripts exist yet — both must be added in this phase

### Integration Points
- `.github/workflows/` directory must be created (doesn't exist yet)
- `package.json` needs `lint` and `test` scripts added
- Playwright config (`playwright.config.ts`) must be created at repo root
- Phase 3 (Auth) will immediately benefit from service containers being wired — no workflow changes needed then

</code_context>

<specifics>
## Specific Ideas

- E2E smoke test checks login form presence (not just HTTP 200) — proves proxy.ts redirect and login page render, not just "server responds"
- CI build step produces the Next.js standalone output that the `e2e` job starts with `next start` — keeps E2E tests production-equivalent
- Chromium + Firefox in CI — covers real-world browser diversity without the WebKit flakiness on Linux

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-ci-cd-and-test-infrastructure*
*Context gathered: 2026-03-24*
