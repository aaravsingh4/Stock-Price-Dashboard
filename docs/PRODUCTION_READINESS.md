# TradePulse Pro — Production Readiness Checklist & Audit Matrix

## 1. Executive Summary & Verification Scope

This document defines the production readiness criteria, security audit specifications, reliability requirements, and verification matrix for **TradePulse Pro** — an enterprise-grade financial analytics and real-time stock monitoring dashboard.

### Core Architecture Components
- **Client (Frontend)**: React 18, TypeScript, Vite, Tailwind CSS, Chart.js.
- **Server (Backend)**: Node.js, Express 5, TypeScript.
- **Data Persistence**: Neon Serverless PostgreSQL with Prisma ORM 6.4.1.
- **Upstream Data Ingestion**: Finnhub REST API (throttled & cached) & Finnhub WebSocket (multiplexed & connection-managed).
- **Client Real-Time Layer**: Persistent WebSocket gateway (`/api/stream`) with individual client isolation.
- **Alert Execution Engine**: Server-side transactional alert evaluation with exact-once triggering semantics and persistent audit history.

---

## 2. Security Audit Matrix

| Category | Security Standard / Requirement | Current Implementation Status | Validation Strategy |
| :--- | :--- | :--- | :--- |
| **Authentication** | Passwords hashed using bcrypt (cost factor $\ge 12$). | Enforced in `AuthService` (`SALT_ROUNDS = 12`). | Unit & integration test verification. |
| **Authentication** | Password validation: minimum 8 characters. | Enforced in `AuthService.validatePassword()`. | Test invalid/short password rejections. |
| **Authentication** | Login rate limiting: 5 attempts / 60 seconds per IP. | In-memory sliding window in `loginRateLimiter`. | Automated integration test with burst attempts. |
| **Authentication** | Generic failure responses to prevent user enumeration. | Returns `"Invalid email or password"` for all failures. | Inspect HTTP response codes and messages. |
| **Session Mgmt** | Session ID regeneration on login & registration. | `req.session.regenerate()` called before setting `userId`. | End-to-end authentication test. |
| **Session Mgmt** | Invalidation on logout. | `req.session.destroy()` and cookie clear. | Verify subsequent session access returns 401. |
| **Session Mgmt** | PostgreSQL session store with automatic pruning. | `connect-pg-simple` with `pruneSessionInterval: 900s`. | Verify `session` table migration and schema. |
| **Cookie Security** | `HttpOnly`, `SameSite: strict` (production) / `lax` (dev), `Secure` (production). | Enforced in `sessionMiddleware`. | Inspect cookie headers. |
| **CSRF Defense** | Strict header validation (`X-Requested-With: TradePulse-Client`) or origin matching. | `checkCsrf` middleware active on mutating endpoints. | Send mutating requests without header/origin and assert 403. |
| **Authorization** | Strict user-isolation for watchlists. | All database queries filtered by `userId = req.session.userId`. | Cross-user query testing with foreign ID. |
| **Authorization** | Strict user-isolation for price alerts. | Query & deletion scoped to `userId`. | Cross-user manipulation testing. |
| **Real-Time Isolation** | WebSockets cannot leak private data or cross-user alerts. | Streaming gateway broadcasts public ticker trades only; alert triggers emitted to user context. | Verify payload inspection. |
| **Data Sanitation** | Input validation and regex sanitization on symbols and names. | Validated in `validate.ts`, `watchlistRoutes.ts`, `alertRoutes.ts`. | Fuzzing with malformed payloads. |
| **Secrets Protection** | No API keys, database connection strings, or secrets in code or logs. | Validated `.env`, `.gitignore`, and error handlers. | Static audit of build artifacts and repositories. |

---

## 3. Reliability & Real-Time Ingestion Standards

1. **Multiplexed Upstream Connection**:
   - Only 1 single shared connection to Finnhub WebSocket is established across all server instances.
   - Dynamic reference-counting for ticker subscriptions: ticker is subscribed when $\ge 1$ client or active alert requires it, and unsubscribed immediately when ref count hits 0.
2. **Honest Data States**:
   - Quotes and candles must explicitly declare data provenance: `LIVE`, `CACHED`, `SIMULATED`, `STALE`, or `UNAVAILABLE`.
   - Never generate fake live prices when upstream APIs fail or return 429.
3. **Exact-Once Alert Triggers**:
   - Alert evaluation occurs in a PostgreSQL transaction with optimistic locking (`WHERE status = 'ACTIVE'`).
   - Duplicate or replayed market trades must never result in duplicate user alerts.
4. **Resilient Local Migration**:
   - If importing guest watchlists/alerts from browser localStorage fails, original client storage must remain intact without data loss.

---

## 4. End-to-End Verification Journeys

- **Journey A (Authentication)**: Register -> Auto-provision default list -> Logout -> Login -> Check profile -> Reject invalid -> Protect private routes.
- **Journey B (Cloud Watchlists)**: Login -> Create custom list -> Add stock -> Rename list -> Remove stock -> Re-login and verify persistence -> Block cross-user access.
- **Journey C (Price Alerts)**: Login -> Create ABOVE/BELOW alerts -> Feed deterministic trades -> Assert exact-once trigger -> Assert trigger history persisted -> Assert duplicate trades ignored.
- **Journey D (Local Data Migration)**: Guest entries in localStorage -> Login -> Import prompt -> Partial/valid import -> Simulated failure preserve data -> Idempotent retry.
- **Journey E (Dashboard & Screener)**: Default light theme -> Dark theme toggle persistence -> Search & detail view -> Screener filters -> Watchlist addition -> Honest error handling.

---

## 5. Deployment Readiness Criteria

- **Compute Runtime**: Long-running Node.js process (e.g. Render, Railway, AWS ECS, Fly.io). Static hosting (e.g. Vercel static, GitHub Pages) cannot maintain persistent WebSocket connections.
- **Database**: Neon Serverless PostgreSQL with connection pooling (`-pooler` endpoint) for Express session store and Prisma queries, and direct connection for migrations.
- **Production Guardrails**: Automated branch check (`verify-db-target.js`) ensuring migrations cannot accidentally target production branch during development.
