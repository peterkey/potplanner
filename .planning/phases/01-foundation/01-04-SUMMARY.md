---
phase: 01-foundation
plan: "04"
subsystem: documentation
tags: [claude-md, mcp, conventions, security-rules, integer-pence, append-only-ledger]
dependency_graph:
  requires: ["01-02", "01-03"]
  provides: ["CLAUDE.md", ".mcp.json"]
  affects: ["all-future-phases"]
tech_stack:
  added: []
  patterns:
    - integer-pence-mandate
    - append-only-ledger
    - verify-session-in-dal
    - server-only-boundaries
    - proxy-ts-redirect-only
key_files:
  created:
    - CLAUDE.md
    - .mcp.json.example
  modified:
    - .gitignore
decisions:
  - "CLAUDE.md is the single source of truth for all project conventions; enshrines rules that are expensive to undo"
  - "GitHub MCP requires classic PAT (ghp_) not fine-grained token; documented with exact setup steps"
  - ".mcp.json gitignored (may contain expanded env vars); .mcp.json.example committed as template"
metrics:
  duration_seconds: 150
  completed_date: "2026-03-18"
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 1
---

# Phase 1 Plan 4: CLAUDE.md and MCP Configuration Summary

**One-liner:** CLAUDE.md with 7 sections enshrining integer pence, append-only ledger, verifySession() convention, and proxy.ts rules; MCP configuration for Context7, GitHub, and Playwright with GitHub classic PAT auth fix documented.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create CLAUDE.md with all required sections | ca92485 | CLAUDE.md (350 lines) |
| 2 | Configure MCP servers and document GitHub auth fix | 9d9d09a | .mcp.json.example, .gitignore |

## What Was Built

### CLAUDE.md (350 lines, 7 sections)

A comprehensive project conventions document at repo root covering:

1. **Stack** — exact versions table; Next.js 16 breaking changes (proxy.ts, async cookies/headers, Turbopack default, Node.js 20.9+ minimum)
2. **Architecture** — directory structure diagram, route groups `(app)` and `(auth)`, server-only boundary table
3. **Database Rules** — INTEGER PENCE MANDATE (never decimal/float), APPEND-ONLY LEDGER (transfer_history rows never updated/deleted), basis-point interest rates, schema reference table, migration commands
4. **Security Rules** — verifySession() in every DAL function with code example, proxy.ts is redirect-only (not a security gate) with code example, JWT in httpOnly cookie only, server-only import enforcement
5. **Coding Conventions** — TypeScript strict mode, import alias `@/`, kebab-case file naming, async request APIs requirement, no custom webpack without `--webpack` flag
6. **Testing** — layer-by-layer test guidance table, running commands, quality gates per task/wave/phase
7. **Development Workflow** — local dev with and without Docker, GSD commands, MCP tools table, GitHub PAT auth fix with exact setup instructions

### MCP Configuration

- `.mcp.json` — Context7 (npx), GitHub (Docker), Playwright (npx); references `${GITHUB_PERSONAL_ACCESS_TOKEN}` env var
- `.mcp.json.example` — template with `ghp_YOUR_TOKEN_HERE` placeholder; committed for all contributors
- `.gitignore` — `.mcp.json` added (gitignored as it may expand env vars to real token values)

## Verification Results

```
grep -c "integer pence" CLAUDE.md   → 1 (mandate section + critical rules box)
grep -c "verifySession" CLAUDE.md   → 9 (rule, example code, DAL guidance)
grep -c "server-only" CLAUDE.md     → 14 (boundary table, import examples, rule)
grep -c "proxy.ts" CLAUDE.md        → 11 (rule, code example, redirect-only explanation)
grep -c "#7c3aed" CLAUDE.md         → 1 (violet primary colour in Stack section)
CLAUDE.md line count                → 350 (requirement: 100+)
.mcp.json servers                   → ['context7', 'github', 'playwright']
.mcp.json gitignored                → true
.mcp.json.example committed         → true with ghp_YOUR_TOKEN_HERE
```

## Deviations from Plan

None — plan executed exactly as written.

## Key Decisions Made

1. **CLAUDE.md structure:** Used a prominent critical rules box at the very top (before any section headers) so it is impossible to miss. All 5 critical rules are bullet-pointed with exact technical references.

2. **GitHub MCP documentation:** Documented in the Development Workflow section under "MCP Tools" as a subsection called "GitHub MCP Authentication Fix" — covers token format, required scope, common error messages, and exact shell setup command.

3. **`.mcp.json` gitignore entry:** Used `\.mcp\.json$` pattern to match the exact file (not `.mcp.json.example`) even though a simple `.mcp.json` line would also work — the regex pattern is clearer about intent.

## Self-Check

- CLAUDE.md exists at `/home/peter/Documents/Git/PotPlanner/CLAUDE.md`: FOUND
- .mcp.json.example exists at `/home/peter/Documents/Git/PotPlanner/.mcp.json.example`: FOUND
- .mcp.json gitignored in `/home/peter/Documents/Git/PotPlanner/.gitignore`: FOUND
- Commit ca92485 (Task 1): FOUND
- Commit 9d9d09a (Task 2): FOUND

## Self-Check: PASSED
