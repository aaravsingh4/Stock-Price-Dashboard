# TradePulse Pro — Production Deployment Guide & Architecture Blueprint

## 1. Hosting Architecture Overview

TradePulse Pro comprises two coordinated architectural tiers:
1. **Frontend Single-Page Application (SPA)**: Built with React 18, TypeScript, Tailwind CSS, and Chart.js via Vite.
2. **Backend Gateway & Real-Time Engine**: Built with Express 5, TypeScript, WebSocket server (`ws`), Prisma ORM 6.4.1, and Finnhub market ingestion.

> [!IMPORTANT]
> **Persistent Compute Requirement:**
> TradePulse Pro cannot be hosted on purely static frontend hosts (like GitHub Pages or basic CDN object buckets) or short-lived serverless lambdas.
> The backend requires a long-running Node.js process (e.g. Render Web Service, Railway, AWS ECS / Fargate, Fly.io, Heroku) to:
> - Maintain persistent duplex WebSocket connections (`/api/stream`) with browser clients.
> - Maintain the multiplexed single upstream streaming socket with Finnhub.
> - Run background price-alert reconciliation and trade matching with exact-once database triggers.

---

## 2. Infrastructure & Environment Requirements

### Runtime Specification
- **Node.js**: `v20.x` or `v22.x` LTS.
- **Package Manager**: npm `10.x` (enforce `npm ci` with `package-lock.json`).
- **Database**: Neon Serverless PostgreSQL with Lakebase connection pooling (`-pooler.c-7.us-east-2.aws.neon.tech`).

### Required Production Environment Variables
| Variable Name | Required | Example / Description |
| :--- | :--- | :--- |
| `NODE_ENV` | Yes | `production` (enables secure cookies, strict error sanitization, proxy trust). |
| `PORT` | Yes | `5000` (or injected by hosting platform, e.g. `$PORT`). |
| `DATABASE_URL` | Yes | Pooled connection string (`postgres://...-pooler.c-7.aws.neon.tech/neondb?sslmode=require`). |
| `DIRECT_URL` | Yes | Direct connection string for Prisma migrations (non-pooled). |
| `SESSION_SECRET` | Yes | Cryptographically random string $\ge 32$ characters (`openssl rand -hex 32`). |
| `FINNHUB_API_KEY`| Yes | Production Finnhub API Key for live market quote ingestion. |

---

## 3. Build & Startup Execution Commands

### Build Phase
```bash
# Clean install using lockfile
npm ci

# Generate Prisma Client models
npm run db:generate

# Build both client bundle and server transpilation
npm run build
```

The build outputs:
- Client bundle: `dist/` (static HTML, CSS, JS chunks).
- Server build: `server/dist/` (compiled Node.js JavaScript).

### Production Startup Command
```bash
# Using tsx or node directly from compiled build:
npm run start:server
```
*(In production container setups, set `node server/dist/index.js` or `tsx server/src/index.ts` with `NODE_ENV=production`)*.

---

## 4. Production Routing & Reverse Proxy Configuration

### Vite Proxy vs. Production Routing
- **Development**: Vite's dev server (`http://localhost:3000`) proxies `/api` and `/api/stream` to Express (`http://localhost:5000`).
- **Production Option A (Unified Express Service - Recommended)**:
  Express serves the static assets from `dist/` and falls back to `dist/index.html` for unknown GET routes, while handling all `/api` routes and the `/api/stream` WebSocket upgrade on the same port.
- **Production Option B (Split Ingress / Nginx Reverse Proxy)**:
  An ingress controller or CDN serves static files and proxies `/api/*` to the Node.js backend with WebSocket upgrade headers:
  ```nginx
  location /api/stream {
      proxy_pass http://tradepulse-backend:5000;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "Upgrade";
      proxy_set_header Host $host;
      proxy_read_timeout 86400s;
  }
  ```

---

## 5. Security & Session Cookie Hardening

1. **HTTPS Enforcement**:
   - `sessionMiddleware` dynamically sets `cookie.secure = true` and `cookie.sameSite = 'strict'` when `NODE_ENV === 'production'`.
   - `app.set('trust proxy', 1)` is enabled in production to correctly process `X-Forwarded-Proto` and secure cookies behind reverse proxies.
2. **CSRF Mitigation**:
   - All mutating endpoints enforce strict CSRF validation through the `checkCsrf` middleware (`X-Requested-With: TradePulse-Client` header or matching `Origin`/`Host`).
3. **Session Store Pruning**:
   - PostgreSQL table `session` is maintained via `connect-pg-simple` with automated background pruning every 15 minutes (`pruneSessionInterval: 900`).
4. **Error Sanitization**:
   - Public API endpoints never return stack traces, database schema details, or connection credentials. 500 errors return sanitized generic payloads: `{"error":{"message":"Internal server error","code":"SERVER_ERROR"}}`.

---

## 6. Neon PostgreSQL Migration & Database Operations

### Safe Migration Procedure
> [!CAUTION]
> **Strict Production Guardrails:**
> Never run `prisma migrate dev` or `prisma db push` directly against production during development.
> The automated guardrail `scripts/verify-db-target.js` actively blocks any migration command if the target is identified as the production compute branch.

To apply migrations to the production branch:
1. Verify production schema compatibility in the `tradepulse-dev` branch.
2. Review the migration SQL files under `prisma/migrations/`.
3. Set temporary deployment credentials targeting production `DIRECT_URL`.
4. Run `npx prisma migrate deploy` in the deployment pipeline.
5. Inspect table indices on `users`, `watchlists`, `price_alerts`, and `session`.

---

## 7. Health Checks, Logging & Monitoring

### Health Endpoint
- **URL**: `GET /api/health`
- **Response Format**:
  ```json
  {
    "status": "ok",
    "service": "TradePulse Pro Market Data Gateway",
    "version": "1.0.0",
    "provider": { "name": "finnhub", "configured": true, "mode": "provider" },
    "database": { "provider": "neon-postgres", "configured": true, "branch": "tradepulse-dev" },
    "uptimeSeconds": 1420
  }
  ```

### Operational Logging
- WebSocket connection/disconnection cycles and subscription ref-counts.
- Cloud alert evaluations and exact-once transactional triggers.
- In-memory cache hit/miss telemetry for Finnhub REST calls.
- Upstream 429 rate limit errors (fallback to transparent cached state without fabricating quotes).
