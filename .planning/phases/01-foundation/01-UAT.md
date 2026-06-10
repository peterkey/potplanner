---
status: testing
phase: 01-foundation
source: [01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md, 01-04-SUMMARY.md]
started: 2026-03-18T17:47:16Z
updated: 2026-03-18T17:47:16Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 4
name: TypeScript Compiles Clean
expected: |
  Run `npm run type-check` in the project root. The command exits with code 0
  and prints no errors.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running server/service. Start the Docker dev stack from scratch: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up app db redis`. The app service should boot without errors, PostgreSQL and Redis health checks pass, and navigating to http://localhost:3000 returns a page (not a connection error).
result: pass

### 2. Homepage Loads
expected: With the dev server running (Docker or `npm run dev`), navigate to http://localhost:3000. The page loads and shows "PotPlanner" text (the placeholder page). No blank screen, no 500 error.
result: pass

### 3. Violet Theme Applied
expected: On the PotPlanner homepage, any text using the primary colour class (`text-primary`) should appear violet/purple — approximately the colour #7c3aed. Not the default blue/green of the shadcn defaults.
result: pass

### 4. TypeScript Compiles Clean
expected: Run `npm run type-check` in the project root. The command exits with code 0 and prints no errors. (It may print nothing, or just the tsc version — both are fine.)
result: [pending]

### 5. Vitest Runs Without Errors
expected: Run `npx vitest run` in the project root. The command exits 0. Output shows "0 tests" or similar — no configuration errors, no "Cannot find module" errors, no missing plugin errors.
result: [pending]

### 6. .env.example Is Committed and Complete
expected: Open `.env.example` in the project root. The file exists and documents at minimum: `DATABASE_URL`, `REDIS_URL`, and `JWT_SECRET`. It should be readable as a template (values are placeholders, not real secrets).
result: [pending]

### 7. CLAUDE.md Has the 5 Critical Rules
expected: Open `CLAUDE.md` at the project root. Near the top there is a "CRITICAL RULES" section listing all 5 rules: (1) money is integer pence, (2) transfer_history is append-only, (3) verifySession() in every DAL function, (4) import 'server-only' in all db/dal/auth/server files, (5) use proxy.ts not middleware.ts.
result: [pending]

### 8. .mcp.json.example Exists with MCP Servers
expected: Open `.mcp.json.example` at the project root. The file exists and references three MCP servers: context7, github, and playwright. The github server entry shows `ghp_YOUR_TOKEN_HERE` as a placeholder (not a real token).
result: [pending]

## Summary

total: 8
passed: 3
issues: 0
pending: 5
skipped: 0

## Gaps

[none yet]
