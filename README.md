# TradePulse Pro — Real-Time Stock Market Intelligence Platform

[![Build & Typecheck](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![UI Framework](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![Backend](https://img.shields.io/badge/Node.js-Express%205-green.svg)](https://expressjs.com/)
[![Market Data](https://img.shields.io/badge/Provider-Finnhub%20API-emerald.svg)](https://finnhub.io/)
[![Styling](https://img.shields.io/badge/TailwindCSS-v3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Test Suite](https://img.shields.io/badge/Vitest-65%20Passing-success.svg)](https://vitest.dev/)
[![Theme](https://img.shields.io/badge/Theme-Light%20Default-amber.svg)](#theme-system)

TradePulse Pro is an institutional-grade, full-stack stock market analytics and intelligence platform designed to showcase production-oriented software engineering, clean modular architecture, and financial data integrity.

---

## 1. Project Overview

TradePulse Pro bridges the gap between basic stock price tickers and professional financial terminals (such as Bloomberg Terminal or FactSet). It is built with:
- **Light-Mode-First Design Philosophy:** Institutional FinTech interfaces default to high-contrast, clean light palettes for daytime trading efficiency. Dark mode is available as a secondary, persistent user preference.
- **Strict Data Transparency:** Every price quote and metric clearly communicates its lifecycle status (`LIVE`, `DELAYED`, `CACHED`, `SIMULATED`, `STALE`, or `UNAVAILABLE`).
- **Secure Backend Gateway Architecture:** Upstream market provider credentials never touch the browser. A high-performance Express 5 gateway handles rate-limiting, deduplication, caching, validation, and error normalization.
- **Incremental, Atomic Development:** Built with small, verified Git commits adhering to the Conventional Commits specification.

---

## 2. Integrated Features

- [x] **Express 5 Market Data Gateway:** Node.js + TypeScript gateway with validation middleware, in-memory caching, and request deduplication.
- [x] **Finnhub Market Data Provider:** Secure upstream adapter authenticating with `X-Finnhub-Token` headers.
- [x] **Stock Quote API:** Real-time quote retrieval and normalization (`/api/market/quote?symbol=AAPL`).
- [x] **Historical Chart Candles API:** OHLCV candle feed supporting `1D`, `1W`, `1M`, `3M`, `6M`, `1Y`, and `ALL` ranges (`/api/market/candles`).
- [x] **Symbol Autocomplete Search API:** Bounded, debounced symbol and company search (`/api/market/search?q=apple`).
- [x] **Health Check & Telemetry API:** Endpoint reporting service status, provider configuration, and cache statistics (`/api/health`, `/api/market/status`).
- [x] **Interactive Historical Stock Chart:** Chart.js line and area charts with multi-timeframe controls, loading states, and live vs. simulated provenance labels.
- [x] **Equities Watchlist Table & Detail Modal:** Synchronized real-time and cached quotes, interactive sorting, sector filtering, and detailed inspection modal.
- [x] **Graceful Simulation Demo Mode:** When `FINNHUB_API_KEY` is omitted, the application runs seamlessly in explicitly labeled demo mode without throwing errors.
- [x] **Comprehensive Test Suite:** 65 automated tests across 11 test suites covering backend validation, provider adapters, caching, routes, formatters, and UI interactions.

---

## 3. Technology Stack

### Frontend
- **Framework:** React 18 (TypeScript)
- **Bundler & Server:** Vite 5 (with `/api` proxy to backend)
- **Data Visualization:** Chart.js & `react-chartjs-2`
- **Styling:** Tailwind CSS (`darkMode: 'class'`)
- **Icons:** Lucide React

### Backend
- **Server:** Node.js + Express 5 (TypeScript)
- **Runtime:** `tsx` for high-speed TypeScript execution and development watching
- **Security & Networking:** `cors`, `dotenv`
- **Data Provider:** Finnhub Stock API (`https://finnhub.io/api/v1`)

### Quality & Tooling
- **Test Runner:** Vitest + React Testing Library + Supertest + JSDOM
- **Type Checking:** TypeScript (`tsc --noEmit` & `tsc -p server/tsconfig.json --noEmit`)
- **Linter:** ESLint (`--max-warnings 0`)
- **Process Orchestration:** `concurrently`

---

## 4. Prerequisites

- **Node.js:** v18.0.0 or higher (Tested on Node.js `v24.21.0`)
- **npm:** v9.0.0 or higher (Tested on npm `v11.19.0`)
- **Git:** v2.30.0 or higher

> [!NOTE]
> On Windows PowerShell systems with restricted script execution policies, run commands using `npm.cmd` (e.g. `npm.cmd run dev`).

---

## 5. Local Setup & Finnhub Configuration

### Step 1: Clone the repository
```bash
git clone https://github.com/aaravsingh4/Stock-Price-Dashboard.git
cd Stock-Price-Dashboard
```

### Step 2: Install dependencies
```bash
npm install
# Or on Windows PowerShell:
npm.cmd install
```

### Step 3: Configure Environment Variables Privately
Copy `.env.example` to `.env`:
```bash
# Windows PowerShell
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

Open `.env` in your editor and enter your personal Finnhub API key:
```env
PORT=5000
NODE_ENV=development

# Obtain your free API key at https://finnhub.io/
FINNHUB_API_KEY=your_actual_finnhub_key_here
```

> **Security Requirements:**
> - Never commit `.env` to Git (it is tracked in `.gitignore`).
> - Never paste real API keys in public pull requests or chat messages.
> - Detailed instructions are available in [docs/MARKET_DATA_SETUP.md](docs/MARKET_DATA_SETUP.md).

---

## 6. Development & Operational Commands

| Command | Description |
|---|---|
| `npm run dev` / `npm.cmd run dev` | Starts both the Express backend (`http://localhost:5000`) and Vite frontend (`http://localhost:3000`) concurrently. |
| `npm run dev:client` | Launches Vite frontend development server only. |
| `npm run dev:server` | Launches Express backend server with hot-reload via `tsx watch`. |
| `npm run test` / `npm.cmd run test` | Runs the full Vitest test suite (both client and server tests). |
| `npm run test:client` | Runs frontend unit and integration tests only. |
| `npm run test:server` | Runs backend API, provider, validation, and cache tests only. |
| `npm run typecheck` | Validates TypeScript across both frontend and server codebases. |
| `npm run lint` | Runs ESLint across the codebase with zero-warning tolerance. |
| `npm run build` | Compiles client production bundle (`dist/`) and compiles server TypeScript. |
| `npm run preview` | Spins up a local static server to preview the production build. |

---

## 7. API Routes & Expected Responses

All endpoints return structured JSON with consistent envelope formats:

### `GET /api/health`
Health check and provider configuration status without revealing secrets.
```json
{
  "status": "ok",
  "service": "TradePulse Pro Market Data Gateway",
  "version": "1.0.0",
  "timestamp": "2026-10-11T23:50:00.000Z",
  "provider": {
    "name": "finnhub",
    "configured": true,
    "mode": "provider"
  },
  "uptimeSeconds": 45
}
```

### `GET /api/market/quote?symbol=AAPL`
Normalized quote response.
```json
{
  "data": {
    "symbol": "AAPL",
    "price": 224.23,
    "change": 1.45,
    "changePercent": 0.65,
    "open": 223.1,
    "high": 225.4,
    "low": 222.8,
    "previousClose": 222.78,
    "timestamp": "2026-10-11T20:00:00.000Z",
    "providerTimestamp": 1728676800,
    "dataStatus": "live",
    "provider": "finnhub",
    "cached": false
  }
}
```

### `GET /api/market/candles?symbol=AAPL&range=1M`
Historical OHLCV candle series in ascending chronological order.

### `GET /api/market/search?q=apple`
Autocomplete search results matching securities on Finnhub.

---

## 8. Data Transparency & Provenance

TradePulse Pro clearly differentiates genuine market data from simulation:

| Status Badge | Description |
| :--- | :--- |
| **`LIVE`** | Real-time quote or candle data retrieved from Finnhub upstream. |
| **`CACHED`** | Verifiable provider data served within configured TTL window (quotes: 30s, candles: 5m, search: 1h). |
| **`SIMULATED`** | Model-generated baseline data. Displayed when `FINNHUB_API_KEY` is not configured, or for major index benchmarks (S&P 500, Dow Jones, NASDAQ) which require institutional exchange licensing outside free API plans. |
| **`STALE`** | Cached copy preserved during transient upstream disruption or rate-limiting. |
| **`UNAVAILABLE`** | Honest status indicating that an asset could not be retrieved, without faking prices. |

---

## 9. Current Limitations & Next Steps

1. **Exchange Entitlements on Free Plan:** Index symbols (such as `^GSPC` for S&P 500 and `^IXIC` for NASDAQ) are restricted to institutional feeds on Finnhub; TradePulse Pro preserves explicitly labeled simulated models for benchmark cards.
2. **WebSocket Real-Time Tickers:** Sub-second streaming tickers via WebSockets are scheduled for Phase 4.
3. **Database Persistence:** PostgreSQL and Prisma ORM for multi-user cloud watchlists are scheduled for Phase 6.
