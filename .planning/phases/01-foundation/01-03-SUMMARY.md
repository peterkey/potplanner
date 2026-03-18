---
phase: 01-foundation
plan: 03
subsystem: infra
tags: [docker, docker-compose, nginx, nextjs-standalone, postgresql, redis]

# Dependency graph
requires:
  - phase: 01-foundation plan 01
    provides: "next.config.ts with output: standalone, package.json scripts (dev, build, start)"
  - phase: 01-foundation plan 02
    provides: ".env.example with POSTGRES_*, REDIS_URL, JWT_SECRET variable names"
provides:
  - "Three-stage Dockerfile (dependencies, builder, runner) producing Next.js standalone image"
  - "docker-compose.yml: production stack with app, db, redis, nginx + health checks + dependency ordering"
  - "docker-compose.dev.yml: development override with source volume mounts, hot-reload, no Nginx"
  - "nginx.conf: reverse proxy to app:3000 with WebSocket upgrade headers"
  - ".dockerignore: excludes node_modules, .next, .git, secrets from Docker build context"
affects: [02-cicd, all-phases-using-docker]

# Tech tracking
tech-stack:
  added:
    - "postgres:16-alpine (Docker image)"
    - "redis:7-alpine (Docker image)"
    - "nginx:alpine (Docker image)"
    - "node:24-slim (Docker base image)"
  patterns:
    - "Multi-stage Docker build: dependencies → builder → runner for minimal production image"
    - "Two-file compose approach: docker-compose.yml (prod) + docker-compose.dev.yml (dev override)"
    - "Anonymous volumes /app/node_modules and /app/.next prevent host/container binary conflicts in dev"
    - "Health checks on db and redis with depends_on condition: service_healthy prevents race conditions"

key-files:
  created:
    - "Dockerfile"
    - "docker-compose.yml"
    - "docker-compose.dev.yml"
    - "nginx.conf"
    - ".dockerignore"
  modified: []

key-decisions:
  - "Used ARG NODE_VERSION=24-slim in Dockerfile for easy version bumps without editing FROM lines"
  - "Dev compose targets: dependencies stage only — no production build overhead during development"
  - "nginx service absent from docker-compose.dev.yml — dev accesses port 3000 directly"
  - "JWT_SECRET forwarded through app environment in docker-compose.yml from .env substitution"

patterns-established:
  - "Pattern: docker compose -f docker-compose.yml -f docker-compose.dev.yml up app db redis (skip nginx in dev)"
  - "Pattern: standalone Dockerfile produces node server.js runner, not next start"

requirements-completed: [SCAF-03]

# Metrics
duration: 2min
completed: 2026-03-18
---

# Phase 1 Plan 03: Docker Infrastructure Summary

**Three-stage standalone Dockerfile with production 4-service Compose (health-checked), Nginx reverse proxy, and hot-reload dev override using anonymous volume isolation**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-18T17:32:28Z
- **Completed:** 2026-03-18T17:34:12Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Three-stage Dockerfile (dependencies/builder/runner) produces a minimal Next.js standalone image running `node server.js` on port 3000
- Production Docker Compose defines all 4 services (app, db, redis, nginx) with health checks on db and redis; app waits via `condition: service_healthy`
- Development override mounts source code for hot-reload, uses anonymous volumes for node_modules/.next to prevent cross-platform binary conflicts, exposes port 3000 directly

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Dockerfile and Docker Compose production stack** - `989949e` (feat)
2. **Task 2: Create Docker Compose development override** - `63d583e` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `Dockerfile` - Three-stage build: dependencies (npm ci with cache mount), builder (npm run build), runner (standalone output, USER node)
- `docker-compose.yml` - Production stack: postgres:16-alpine, redis:7-alpine, nginx:alpine, app (build from Dockerfile); health checks with pg_isready and redis-cli ping; named volumes postgres_data and redis_data
- `docker-compose.dev.yml` - Development override: stops at dependencies stage, mounts .:/app with anonymous node_modules/.next volumes, runs npm run dev on port 3000
- `nginx.conf` - Reverse proxy to http://app:3000 with WebSocket upgrade headers (Upgrade, Connection) and forwarded-for headers
- `.dockerignore` - Excludes node_modules, .next, .git, .planning, .env, .env.local, docker-compose files, nginx.conf, drizzle/

## Decisions Made

- ARG-based `NODE_VERSION=24-slim` in Dockerfile allows single-point version bumps across all three stages
- Dev compose `target: dependencies` stops the multi-stage build early — no Next.js production build needed for development
- Nginx is not overridden in docker-compose.dev.yml; to skip it in dev, run: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up app db redis`
- JWT_SECRET passed through app service environment using `${JWT_SECRET}` substitution from .env

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Copy `.env.example` to `.env` and set real values before running.

## Next Phase Readiness

- Docker infrastructure complete; `docker compose up` will start all 4 production services once a `.env` file exists
- Dev stack ready: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up app db redis`
- Phase 2 (CI/CD) can now validate Docker builds in GitHub Actions using these compose files
- CLAUDE.md (plan 04) should document the dev stack startup command pattern

## Self-Check: PASSED

All files confirmed present on disk. Both task commits verified in git log.

---
*Phase: 01-foundation*
*Completed: 2026-03-18*
