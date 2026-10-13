# TradePulse Pro — Render Deployment Specification & Blueprint Architecture

## 1. Overview & Architecture Strategy

This document defines the deployment architecture for **TradePulse Pro** on **Render** ([https://render.com/docs/web-services](https://render.com/docs/web-services)).

### Unified Web Service (Same-Origin Model)
To ensure optimal reliability and avoid cross-origin cookie/session degradation, TradePulse Pro deploys as a **single Render Web Service**:
- **Compute Tier**: Docker / Node.js native runtime executing the Express 5 server.
- **Frontend Serving**: The compiled Vite single-page application (`dist/`) is served statically by Express with SPA fallback (`dist/index.html`).
- **API Endpoints**: Handled under `/api/*` on the identical host origin.
- **WebSocket Streaming Gateway**: Managed on `/api/stream` via native HTTP upgrade handling. In production on Render, TLS termination is performed at the Render edge proxy, and client connections seamlessly upgrade to `wss://<service-name>.onrender.com/api/stream`.

---

## 2. Render Blueprint Specification (`render.yaml`)

The application deployment is declared via an Infrastructure-as-Code Blueprint (`render.yaml`):

```yaml
services:
  - type: web
    name: tradepulse-pro
    runtime: node
    plan: starter
    region: ohio # Close to AWS us-east-2 (Neon region)
    buildCommand: npm ci && npm run db:generate && npm run build
    startCommand: npm run start:server
    healthCheckPath: /api/health
    autoDeploy: true
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: DATABASE_URL
        sync: false
      - key: DIRECT_URL
        sync: false
      - key: SESSION_SECRET
        generateValue: true
      - key: FINNHUB_API_KEY
        sync: false
```

### Plan Recommendation & Background Processing
- **Render Starter (or higher)**: Recommended for continuous market streaming and alert evaluation. Render Free tier web services spin down after 15 minutes of inactivity, which pauses background trade ingestion and WebSocket connections until the next HTTP wake-up request. For 24/7 server-side alert execution, an active (non-sleeping) instance is required.

---

## 3. Build & Runtime Execution Pipeline

1. **Dependency Installation**: `npm ci` strictly utilizes `package-lock.json`.
2. **Prisma Generation**: `npm run db:generate` generates schema bindings for PostgreSQL.
3. **Compilation**: `npm run build` runs `build:client` (`vite build` to `dist/`) and `build:server` (`tsc -p server/tsconfig.json` to `dist/server/`).
4. **Service Startup**: `npm run start:server` starts `dist/server/index.js` binding to `0.0.0.0:${PORT}`.
5. **Health Check**: Render's ingress verifies `/api/health` before routing live production traffic.

---

## 4. Neon Branch Isolation & Migration Safety

- **Development Branch (`tradepulse-dev`)**: Used for local coding and integration tests.
- **Production Branch (`production`)**: Used exclusively by the deployed Render service.
- **Automated Guardrail**: Migrations are strictly separated from service build/start commands. Running `prisma migrate dev` or automated migrations on boot is disallowed. Production migrations must be explicitly reviewed and deployed via `npx prisma migrate deploy` targeting `DIRECT_URL`.
