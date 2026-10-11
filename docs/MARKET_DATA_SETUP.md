# TradePulse Pro — Market Data Setup Guide (Finnhub API)

This guide provides instructions for configuring and securely integrating the **Finnhub Stock Market API** into TradePulse Pro.

---

## 1. Security Architecture & Principles

TradePulse Pro enforces strict security controls to protect API credentials:
* **Backend Gateway Exclusivity:** The Finnhub API key is exclusively loaded in the Node/Express backend (`server/src/config/env.ts`). It is **never** bundled into the client React code, HTML, or Vite environment variables.
* **Header Authentication:** Upstream requests to `https://finnhub.io/api/v1` authenticate using the `X-Finnhub-Token` HTTP header. The token is never exposed in URL query parameters, client responses, or error logs.
* **Local `.env` Exclusion:** `.env` files are tracked in `.gitignore` and must never be committed to Git.
* **Graceful Demo Fallback:** If `FINNHUB_API_KEY` is omitted or unconfigured, the server boots normally, reports `configured: false` on `/api/health`, and the application automatically runs in explicitly labeled **SIMULATED** demo mode.

---

## 2. Setting Up Your Finnhub API Key Privately

### Step 1: Obtain a Free Finnhub API Key
1. Visit [https://finnhub.io/](https://finnhub.io/) and create a free developer account.
2. Navigate to your Finnhub dashboard to copy your generated personal API key.

> **Security Advisory:**
> Never paste your real API key into public chats, pull requests, issue trackers, or terminal commands that write to persistent shell history.

### Step 2: Create Your Local `.env` File
In the project root directory, copy `.env.example` to `.env`:

```bash
# Windows PowerShell
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

### Step 3: Populate Your API Key Privately
Open the `.env` file on your local machine using your preferred code editor and enter your key:

```env
PORT=5000
NODE_ENV=development

# Paste your personal Finnhub API key here:
FINNHUB_API_KEY=your_actual_finnhub_key_here
```

Save and close the file. Verify that `git status` does not show `.env` as an untracked file (it is ignored by `.gitignore`).

---

## 3. Running the Application

### Start Both Backend & Frontend Concurrently
```bash
npm run dev
```
* **Frontend:** [http://localhost:3000](http://localhost:3000)
* **Backend Gateway:** [http://localhost:5000](http://localhost:5000)
* **API Proxy:** Vite automatically proxies `/api` requests from port 3000 to port 5000.

### Separate Service Commands
* Run Backend only: `npm run dev:server`
* Run Frontend only: `npm run dev:client`
* Production Server: `npm run start:server`

---

## 4. Market Data API Endpoints

All market data endpoints are served under `/api`:

| Method | Endpoint | Query Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | None | Returns gateway health, uptime, and provider configuration status. |
| `GET` | `/api/market/quote` | `symbol` (e.g. `AAPL`) | Returns real-time or cached stock quote normalized from Finnhub `/quote`. |
| `GET` | `/api/market/candles` | `symbol`, `range` (`1D`, `1W`, `1M`, `3M`, `6M`, `1Y`, `ALL`) | Returns chronological OHLCV candle series normalized from Finnhub `/stock/candle`. |
| `GET` | `/api/market/search` | `q` (e.g. `apple`) | Returns autocomplete search results normalized from Finnhub `/search`. |
| `GET` | `/api/market/status` | None | Returns provider health and in-memory cache hit/miss statistics. |

---

## 5. Caching and Rate-Limit Protection

Finnhub's free tier has an upstream rate limit of **60 requests per minute**. To ensure stability and prevent rate-limit throttling:
* **Quote Cache (30s TTL):** Frequent quote queries for the same symbol are served from in-memory cache.
* **Candles Cache (5m TTL):** Historical chart candles are cached to allow smooth switching between time ranges.
* **Search Cache (1h TTL):** Symbol search queries are cached in memory.
* **In-Flight Deduplication:** Concurrent identical requests are coalesced into a single upstream request.
* **Stale Fallback:** In the event of transient upstream network errors, the gateway returns stale cached data clearly stamped with `dataStatus: "stale"`.

---

## 6. Dashboard Data Transparency

TradePulse Pro maintains honest, visible data badges across all views:

* <span style="color:#00b386">**LIVE**</span>: Real-time price or candle series retrieved directly from Finnhub.
* <span style="color:#0284c7">**CACHED**</span>: Verified Finnhub market data served from gateway cache within its freshness window.
* <span style="color:#6366f1">**SIMULATED**</span>: Deterministic simulation model data. Used when:
  - `FINNHUB_API_KEY` is not configured.
  - Market index benchmarks (S&P 500, Dow Jones, NASDAQ, Russell 2000) require premium exchange licensing not available on free plans.
  - Secondary unqueried equities in the table to prevent spamming upstream rate limits.
* <span style="color:#f59e0b">**STALE**</span>: Cached copy retained during temporary network disruption or rate-limiting.
* <span style="color:#94a3b8">**UNAVAILABLE**</span>: Upstream market data could not be retrieved and no fallback is faked.
