# TradePulse Pro — Render Environment Setup & Production Configuration

## 1. Overview

This document provides step-by-step instructions for configuring the production environment on **Render** for **TradePulse Pro**, adhering strictly to security best practices and database safety boundaries.

---

## 2. Production Environment Variables Matrix

Enter these environment variables in the **Environment** tab of your Render Web Service dashboard (`Dashboard -> tradepulse-pro -> Environment`):

| Variable Name | Required | Example / Format | Purpose | Security Guidance |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | **Yes** | `production` | Enables Express proxy trust (`trust proxy: 1`), secure cookies (`Secure; SameSite=Strict`), and sanitized 500 error responses. | Never set to `development` in hosted environment. |
| `PORT` | **Yes** | `10000` | Port assigned by Render for inbound traffic routing. | Bound to `0.0.0.0` by server runtime. |
| `DATABASE_URL` | **Yes** | `postgres://user:pass@ep-...-pooler.c-7.aws.neon.tech/neondb?sslmode=require` | Pooled Neon PostgreSQL connection string for Prisma ORM queries and session store (`connect-pg-simple`). | **Must target production branch (`production`) compute endpoint**. Never hardcode in Git. |
| `DIRECT_URL` | **Yes** | `postgres://user:pass@ep-...c-7.aws.neon.tech/neondb?sslmode=require` | Non-pooled connection string used for schema migrations. | Kept secret; never expose client-side. |
| `SESSION_SECRET` | **Yes** | 64-character random hex string | Signs and verifies Express session cookies (`tradepulse_sid`). | Generate with `openssl rand -hex 32`. Render Blueprint automatically generates this if using `generateValue: true`. |
| `FINNHUB_API_KEY` | **Yes** | `c...` | Finnhub REST and WebSocket live streaming API access. | Required for live trade feeds and quote queries. |

> [!CAUTION]
> **No Frontend Secrets (`VITE_`):**
> None of the above environment variables should ever be prefixed with `VITE_`. All database credentials, session keys, and Finnhub tokens are restricted strictly to the Node.js backend runtime.

---

## 3. Cookie & Proxy Configuration for Render

1. **Reverse Proxy Architecture**:
   - Render automatically terminates SSL at its cloud edge proxy and routes decrypted HTTP requests to your container on the specified `$PORT`.
   - In [server/src/app.ts](file:///c:/Users/HP/Stock-Price-Dashboard/server/src/app.ts#L16), `app.set('trust proxy', 1)` is enabled when `NODE_ENV === 'production'`, allowing Express to correctly identify the original client protocol (`X-Forwarded-Proto: https`).
2. **Session Cookies**:
   - In [server/src/middleware/session.ts](file:///c:/Users/HP/Stock-Price-Dashboard/server/src/middleware/session.ts#L36-L39):
     - `httpOnly: true` (prevents JavaScript access to session cookie).
     - `secure: true` (cookie only transmitted over HTTPS).
     - `sameSite: 'strict'` (defends against cross-site request forgery).
3. **Same-Origin CSRF Validation**:
   - Mutating routes (`POST`, `PUT`, `DELETE`, `PATCH`) enforce `checkCsrf`. Because the frontend and backend share the identical origin (`https://tradepulse-pro.onrender.com`), client fetch requests seamlessly transmit same-origin headers and the custom header `X-Requested-With: TradePulse-Client`.

---

## 4. Neon Database Production Branch Setup

### Neon Branch Status Verification
To verify the branch state from the CLI:
```bash
neon branch list
```
Current branches:
- `tradepulse-dev` (`br-rough-dust-b5jd6f91`): Active development branch.
- `production` (`br-lucky-frog-b5fczvmx`): Default production branch.

### Retrieving Production Connection Strings
1. In the Neon Console, switch to the `production` branch.
2. Under **Connection Details**:
   - Copy the **Pooled connection** string for `DATABASE_URL`.
   - Copy the **Direct connection** string for `DIRECT_URL`.
3. Add these credentials directly into Render's Environment settings.

### Explicit Migration Execution Procedure
> [!IMPORTANT]
> The Render Web Service build and start commands (`buildCommand` and `startCommand`) do **not** run database migrations. This ensures zero risk of automated schema modifications during frontend compilation or container restarts.

When releasing a schema change to production:
1. Review pending migration files under [prisma/migrations/](file:///c:/Users/HP/Stock-Price-Dashboard/prisma/migrations).
2. From an authorized administrative environment with production `DIRECT_URL` configured, run:
   ```bash
   npx prisma migrate deploy
   ```
3. Verify table status and indices.

---

## 5. Render WebSockets & Health Checks

1. **WebSocket Protocol**:
   - Client connections automatically upgrade to `wss://` based on `window.location.protocol`:
     ```typescript
     const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
     const url = `${protocol}//${window.location.host}/api/stream`;
     ```
   - Render natively supports persistent WebSocket streaming on web services without additional proxy plugins.
2. **Health Check Endpoint**:
   - Configured path: `/api/health`.
   - Responds with `HTTP 200` and service telemetry without leaking credentials or internal hostnames.
