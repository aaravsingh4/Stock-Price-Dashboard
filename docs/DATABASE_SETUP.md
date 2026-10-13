# Neon PostgreSQL Database Setup & Development Branch Architecture

TradePulse Pro uses **Neon Lakebase PostgreSQL** with copy-on-write branching for server-side persistence and secure state management.

---

## 1. Neon Branch Topology

- **Project**: `stock market` (`quiet-dawn-96765050`)
- **Organization**: `Aarav` (`org-muddy-mode-25884383`)
- **Production Branch**: `production` (`br-lucky-frog-b5fczvmx`) — **Protected / Untouched**. Zero test or development migrations are executed against this branch.
- **Development Branch**: `tradepulse-dev` (`br-rough-dust-b5jd6f91`) — Dedicated copy-on-write development branch derived from `production`.

### Safety Guard Mechanism
The repository includes an automatic pre-migration target check script: [`scripts/verify-db-target.js`](../scripts/verify-db-target.js).
Before any migration or schema deployment runs, this script inspects `.neon` and the active `DATABASE_URL` / `DIRECT_URL`. If they identify the production branch or the production compute endpoint (`ep-ancient-glade`), the command immediately rejects execution with exit code `1`.

```bash
# Verify database target safety
npm run db:verify

# Safe migration script (always verifies target before calling prisma migrate)
npm run db:migrate
```

---

## 2. Environment Variables & SSL Configuration

All database credentials remain server-side and are **never** prefixed with `VITE_` or sent to the browser.

| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | Pooled connection string (`ep-wild-pond-...-pooler`) used by Express and runtime Prisma queries for connection efficiency. SSL required. |
| `DIRECT_URL` | Direct connection string (`ep-wild-pond-...`) required by Prisma for schema migrations and DDL statements. SSL required. |
| `SESSION_SECRET` | 32+ character entropy secret key used to sign Express session cookies. |

---

## 3. Database Schema Overview

The database schema is defined in [`prisma/schema.prisma`](../prisma/schema.prisma):

- **`users`**: User identities, unique normalized emails, bcrypt password hashes, and timestamps.
- **`watchlists`**: Custom user watchlists with a boolean `is_default` flag. Automatically cascades deletions to items.
- **`watchlist_items`**: Equities in watchlists. Enforces a compound unique index `(watchlist_id, symbol)` to prevent duplicates.
- **`price_alerts`**: Server-side price alerts with `ABOVE` / `BELOW` conditions, precise numeric Decimal targets, and statuses (`ACTIVE`, `TRIGGERED`, `DISABLED`).
- **`price_alert_history`**: Audit trail of every triggered alert with observed price, timestamp, and deduplication identifier (`dedup_id`).
- **`session`**: Dedicated PostgreSQL table utilized by `connect-pg-simple` for session management and cookie authentication.

---

## 4. Prisma Migration Commands

```bash
# Validate schema
npx prisma validate

# Generate Prisma Client
npm run db:generate

# Apply migrations safely to development branch
npm run db:migrate
```
