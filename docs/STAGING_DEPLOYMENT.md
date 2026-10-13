# TradePulse Pro — Render Staging Deployment Workflow

## 1. Overview & Strategy

This document outlines the workflow and safety constraints for deploying **TradePulse Pro** to an isolated **staging environment** on Render ([https://render.com/docs/blueprint-spec](https://render.com/docs/blueprint-spec)).

### Staging Specifications
- **Service Name**: `tradepulse-pro-staging`
- **Render Blueprint**: [`render.staging.yaml`](file:///c:/Users/HP/Stock-Price-Dashboard/render.staging.yaml)
- **Git Branch**: `staging` (completely separate from `main`)
- **Hosting Plan**: `plan: free` (non-billable for initial staging evaluation)
- **Deploy Trigger**: `autoDeployTrigger: off` (preventing unreviewed continuous deployments)
- **Database Context**: Neon development branch **`tradepulse-dev`** (`br-rough-dust-b5jd6f91`).

> [!CAUTION]
> **Production Branch Protection:**
> The staging environment must **NEVER** connect to or interact with the Neon production branch (`production` / `br-lucky-frog-b5fczvmx`). All staging database credentials must target `tradepulse-dev`.

---

## 2. Render Free Tier Behavioral Constraints

The staging service utilizes Render's `free` compute plan. Be aware of the following expected runtime characteristics:
1. **Idle Spin-Down**:
   - Render free web services spin down to 0 instances after **15 minutes of inactivity**.
   - Incoming HTTP requests will wake the service, but may incur a cold-start delay of 30–50 seconds.
2. **WebSocket & Background Alert Impact**:
   - While the service is spun down or asleep, **background market data ingestion and continuous server-side price-alert evaluations are paused**.
   - WebSocket client connections (`/api/stream`) will be terminated when the container goes to sleep and reconnect when the application wakes up.
   - For 24/7 uninterrupted real-time trade monitoring without spin-downs, the production deployment will use an active plan (`starter` or higher), whereas `free` is tailored specifically for non-billable staging validation.

---

## 3. Step-by-Step Render Dashboard Configuration

Follow these steps in the Render dashboard:
1. Log into [Render Dashboard](https://dashboard.render.com).
2. Click **New +** and select **Blueprint**.
3. Select your GitHub repository: `aaravsingh4/Stock-Price-Dashboard`.
4. In the **Blueprint Configuration** screen:
   - Set **Branch** to: `staging`.
   - Set **Blueprint Path** to: `render.staging.yaml`.
5. Review the service definition (`tradepulse-pro-staging`).
6. Click **Apply**.

---

## 4. Manual Environment Variables Checklist

Before launching the service, configure these variables in the Render dashboard (`tradepulse-pro-staging -> Environment`):

| Variable Name | Staging Value / Source | Purpose |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production security behaviors (`trust proxy: 1`, `Secure; SameSite=Strict` cookies, sanitized errors). |
| `APP_ENV` | `staging` | Identifies the staging runtime tier. |
| `PORT` | `10000` | Port assigned by Render for inbound traffic routing. |
| `DATABASE_URL` | Neon `tradepulse-dev` pooled connection string | Extracted from Neon Console -> `tradepulse-dev` branch -> Pooled. |
| `DIRECT_URL` | Neon `tradepulse-dev` direct connection string | Extracted from Neon Console -> `tradepulse-dev` branch -> Direct. |
| `SESSION_SECRET` | Auto-generated 64-char string | Handled automatically by Render Blueprint `generateValue: true`. |
| `FINNHUB_API_KEY`| Finnhub API Key | Free/sandbox API key for market data streaming. |

---

## 5. Publishing the Staging Branch to GitHub

To push the staging branch to your GitHub repository without modifying `main`:
```bash
git push origin staging
```
*(Never force-push or overwrite the remote `main` branch).*
