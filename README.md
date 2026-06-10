# PotPlanner

A self-hosted household budgeting app. Income flows into pots, bills are tracked, and the financial engine tells you exactly where you stand each month.

---

## Self-hosting

You only need Docker. No git clone required.

### 1. Create a folder and add two files

```
mkdir potplanner && cd potplanner
```

**`docker-compose.yml`**

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  migrate:
    image: ghcr.io/peterkey/potplanner:migrate
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
    depends_on:
      db:
        condition: service_healthy
    restart: "no"

  app:
    image: ghcr.io/peterkey/potplanner:latest
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      REDIS_URL: redis://redis:6379
      NODE_ENV: production
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "${PORT:-80}:3000"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
      migrate:
        condition: service_completed_successfully

volumes:
  postgres_data:
  redis_data:
```

**`.env`**

```env
POSTGRES_DB=potplanner
POSTGRES_USER=potplanner
POSTGRES_PASSWORD=change-me
JWT_SECRET=change-me-use-a-long-random-string

# Optional: change the port the app listens on (default 80)
# PORT=8080
```

### 2. Start

```bash
docker compose up -d
```

Migrations run automatically before the app starts. Open **http://localhost** and create your account.

---

## Development

### With Docker (recommended)

```bash
git clone https://github.com/peterkey/potplanner.git
cd potplanner
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

App runs at **http://localhost:3000** with hot reload.

### Without Docker

Requires local PostgreSQL and Redis.

```bash
npm install
npm run db:migrate
npm run dev
```

### Useful commands

```bash
npm run type-check      # TypeScript check
npm test                # Vitest unit tests
npm run db:generate     # Generate migration after schema changes
npm run db:migrate      # Apply pending migrations
npm run db:studio       # Drizzle Studio at localhost:4983
```

---

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | Secret key for signing sessions — use a long random string |
| `POSTGRES_DB` | Yes | Database name |
| `POSTGRES_USER` | Yes | Database user |
| `POSTGRES_PASSWORD` | Yes | Database password |
| `PORT` | No | Port to expose (default `80`) |

---

## Architecture notes

- All monetary values are stored as **integer pence** — never floats
- `transfer_history` is an **append-only ledger** — balances are derived by summing entries
- Sessions use JWT in an httpOnly cookie, invalidated via Redis blacklist on logout
- Every data access function calls `verifySession()` — the proxy layer is redirect-only, not a security gate

See [CLAUDE.md](CLAUDE.md) for full project conventions.
