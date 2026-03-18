---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [nextjs, typescript, tailwind, shadcn, vitest, drizzle-orm, ioredis, server-only]

# Dependency graph
requires: []
provides:
  - Next.js 16 project scaffold with App Router and src/ directory
  - Route groups src/app/(app)/ and src/app/(auth)/
  - Library directories src/lib/{db,dal,auth,engine}/ and src/server/
  - output: standalone in next.config.ts
  - shadcn/ui initialized with violet #7c3aed primary theme
  - Vitest 4.1.0 configured with jsdom environment and tsconfigPaths
  - All production and dev dependencies installed
affects: [02-cicd, 03-auth, 04-engine, 05-features]

# Tech tracking
tech-stack:
  added:
    - next@16.1.7
    - react@19.2.3
    - drizzle-orm@0.45.1
    - postgres@3.4.8
    - ioredis@5.10.0
    - server-only@0.0.1
    - shadcn@4.0.8 (radix-nova preset)
    - vitest@4.1.0
    - "@vitejs/plugin-react@6.0.1"
    - vite-tsconfig-paths@6.1.1
    - "@testing-library/react@16.3.2"
    - "@testing-library/jest-dom"
    - jsdom@29.0.0
    - drizzle-kit@0.31.10
    - tailwindcss@4
    - class-variance-authority, clsx, tailwind-merge, lucide-react (shadcn deps)
  patterns:
    - Next.js App Router with route groups (app) and (auth)
    - src/ directory layout with lib/db, lib/dal, lib/auth, lib/engine, server/
    - output: standalone for Docker image optimisation
    - shadcn/ui CSS variable theming with violet OKLCH override

key-files:
  created:
    - next.config.ts
    - tsconfig.json
    - package.json
    - vitest.config.mts
    - src/tests/setup.ts
    - components.json
    - src/app/(app)/layout.tsx
    - src/app/(auth)/login/page.tsx
    - src/app/page.tsx
    - src/lib/db/.gitkeep
    - src/lib/dal/.gitkeep
    - src/lib/auth/.gitkeep
    - src/lib/engine/.gitkeep
    - src/server/.gitkeep
    - .gitignore
  modified:
    - src/app/globals.css
    - src/app/layout.tsx

key-decisions:
  - "shadcn init chose Nova preset (Radix/Lucide/Geist) — violet theme applied via CSS variable override on top, not through baseColor"
  - "create-next-app could not run in PotPlanner/ directory (npm name restriction) — scaffolded in /tmp then copied to project root"
  - "src/components/.gitkeep not needed — shadcn init created src/components/ui/button.tsx automatically"

patterns-established:
  - "Pattern 1: output: standalone in next.config.ts — must remain for all Docker builds"
  - "Pattern 2: Violet primary via CSS variable --primary: oklch(0.499 0.252 278.7) — override shadcn defaults in globals.css"
  - "Pattern 3: Vitest config with tsconfigPaths plugin — ensures @/ path aliases resolve in test files"

requirements-completed: [SCAF-01]

# Metrics
duration: 11min
completed: 2026-03-18
---

# Phase 1 Plan 01: Project Scaffold Summary

**Next.js 16 app scaffolded with App Router, Tailwind v4, shadcn/ui violet theme (#7c3aed), Vitest 4.1 configured, and all production/dev dependencies installed**

## Performance

- **Duration:** 11 min
- **Started:** 2026-03-18T17:14:25Z
- **Completed:** 2026-03-18T17:25:08Z
- **Tasks:** 2
- **Files modified:** 18

## Accomplishments

- Next.js 16.1.7 with TypeScript strict mode, App Router, src/ directory, route groups (app) and (auth)
- All production deps installed: drizzle-orm, postgres, ioredis, server-only; all dev deps installed including vitest, testing-library, drizzle-kit
- shadcn/ui Nova preset initialized; violet primary (#7c3aed) applied via OKLCH CSS variable overrides in globals.css
- Vitest 4.1.0 configured with jsdom environment, tsconfigPaths plugin, and @testing-library/jest-dom setup file
- `output: 'standalone'` in next.config.ts; `type-check` and db:* scripts in package.json

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js 16 project with dependencies and directory structure** - `a4ccd43` (feat)
2. **Task 2: shadcn/ui init with Nova preset (auto-commit by shadcn CLI)** - `b07b60c` (feat)
3. **Task 2: Violet theme override and Vitest configuration** - `149323c` (feat)

## Files Created/Modified

- `next.config.ts` - Next.js config with output: standalone
- `tsconfig.json` - TypeScript strict mode with @/* path alias
- `package.json` - All dependencies + db:generate/migrate/studio/type-check scripts
- `vitest.config.mts` - Vitest with jsdom, tsconfigPaths, setupFiles
- `src/tests/setup.ts` - @testing-library/jest-dom/vitest matchers
- `components.json` - shadcn/ui config with aliases (radix-nova preset)
- `src/app/globals.css` - Violet primary OKLCH overrides for :root and .dark
- `src/app/layout.tsx` - Metadata updated to PotPlanner/Household budgeting app
- `src/app/(app)/layout.tsx` - Authenticated app route group layout
- `src/app/(auth)/login/page.tsx` - Auth route group login placeholder
- `src/app/page.tsx` - Minimal PotPlanner placeholder with text-primary class
- `src/lib/{db,dal,auth,engine}/.gitkeep` - Library directory structure
- `src/server/.gitkeep` - Server-only utilities directory
- `.gitignore` - node_modules, .next/, .env*, *.tsbuildinfo

## Decisions Made

- shadcn init selected Nova preset (Radix/Lucide/Geist) via interactive prompt — violet theme is applied via CSS variable override on top, which is independent of the baseColor/preset choice and can be changed at any time
- create-next-app could not run directly in `PotPlanner/` (npm naming restriction: no capital letters) — scaffolded in `/tmp/potplanner-scaffold/potplanner` then copied to project root, `.planning` and `.claude` moved temporarily
- `src/components/.gitkeep` was not needed — shadcn init automatically created `src/components/ui/button.tsx`, confirming the directory structure is correct

## Deviations from Plan

None - plan executed exactly as written. The scaffold approach (temp directory workaround) was anticipated by the plan's note about handling non-empty directories.

## Issues Encountered

- `npx create-next-app@latest . --yes` failed because the parent directory is named `PotPlanner` (capital letters violate npm package naming rules). Resolved by scaffolding in a temp directory and copying files back — anticipated in the plan.
- shadcn `--yes` flag triggered an interactive library selection prompt regardless. Resolved by piping `yes` through the command; Nova preset was automatically selected as the first option.
- shadcn init auto-committed its own changes (`b07b60c feat: initial commit`) — this is normal behavior. Task 2 commit (`149323c`) captures the violet theme override and Vitest config on top.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- TypeScript compiles clean (`npx tsc --noEmit` exits 0)
- Vitest starts without configuration errors (0 tests, expected for Phase 1)
- All directory structure in place for Phase 2 (CI/CD), Phase 3 (Auth), Phase 4 (Engine)
- No blockers for next plans in Phase 1 (01-02: CLAUDE.md, 01-03: Docker Compose, 01-04: Drizzle schema)

---
*Phase: 01-foundation*
*Completed: 2026-03-18*

## Self-Check: PASSED

- All 13 key files found on disk
- All 3 task commits (a4ccd43, b07b60c, 149323c) verified in git log
