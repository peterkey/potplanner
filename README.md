# PotPlanner

A self-hosted household budgeting app. Income flows into pots, bills are tracked, and the financial engine tells you exactly where you stand each month.

Built with Next.js 16, Drizzle ORM, PostgreSQL, and Redis. Runs entirely in Docker.

---

## Quick Start (Production)

### Prerequisites

- Docker and Docker Compose v2

### 1. Clone and configure

```bash
git clone https://github.com/your-username/potplanner.git
cd potplanner
cp .env.example .env
```

Edit `.env` and set a strong `JWT_SECRET` and your preferred database credentials:

```env
POSTGRES_DB=potplanner
POSTGRES_USER=potplanner
POSTGRES_PASSWORD=your-secure-password
JWT_SECRET=your-secret-key-min-32-chars
```

### 2. Start the stack

```bash
docker compose up --build -d
```

This builds the app, runs database migrations automatically, then starts everything. The app is available at **http://localhost**.

### 3. Create your household account

On first run, visit http://localhost and register your household email and password. This is the shared login for all household members.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Database | PostgreSQL 16 |
| Cache / Sessions | Redis 7 |
| ORM | Drizzle ORM |
| Reverse Proxy | Nginx |

---

## Development

### With Docker (recommended)

```bash
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

The dev override mounts your local source into the container for hot reload. App is at **http://localhost:3000**.

### Without Docker

Requires local PostgreSQL and Redis matching the connection strings in `.env`.

```bash
npm install
npm run db:migrate
npm run dev
```

### Useful commands

```bash
npm run type-check      # TypeScript check
npm test                # Vitest unit tests
npm run db:generate     # Generate a new migration after schema changes
npm run db:migrate      # Apply pending migrations
npm run db:studio       # Drizzle Studio (DB browser) at localhost:4983
```

---

## Configuration

All configuration is via environment variables. See `.env.example` for the full list.

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | Secret key for JWT signing — use a random 32+ char string |
| `DATABASE_URL` | Yes | PostgreSQL connection URL |
| `POSTGRES_DB` | Yes | Database name (used by Docker Compose) |
| `POSTGRES_USER` | Yes | Database user (used by Docker Compose) |
| `POSTGRES_PASSWORD` | Yes | Database password (used by Docker Compose) |
| `REDIS_URL` | Yes | Redis connection URL |

---

## Architecture notes

- All monetary values are stored as **integer pence** — never floats
- `transfer_history` is an **append-only ledger** — balances are derived by summing entries
- Sessions use JWT in an httpOnly cookie, invalidated via Redis blacklist on logout
- Every data access function calls `verifySession()` — the proxy layer is redirect-only, not a security gate

See [CLAUDE.md](CLAUDE.md) for full project conventions.
