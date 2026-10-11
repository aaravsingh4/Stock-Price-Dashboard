# TradePulse Pro — Finnhub API Integration Strategy

## 1. Executive Summary & Objective

This document defines the architectural strategy for integrating the Finnhub Stock Market API into TradePulse Pro. The integration introduces a lightweight, decoupled Node.js/Express backend service acting as an API gateway, caching tier, and security boundary between client web applications and Finnhub's upstream market data services.

---

## 2. Security & Credential Governance

### 2.1 Threat Model & Safeguards
- **Zero Client Exposure:** The Finnhub API key (`FINNHUB_API_KEY`) is strictly confined to the backend process environment. It is never emitted in HTML, client JavaScript bundles, Vite environment variables (`VITE_*`), server response payloads, error stack traces, or console logs.
- **Header-Based Authentication:** All upstream requests to Finnhub utilize the HTTP header `X-Finnhub-Token: <token>` rather than embedding query parameters (which can be leaked via server access logs, proxy logs, or browser referrers).
- **Environment Isolation:** Local environment secrets reside in `.env`, which is strictly ignored by version control (`.gitignore`). An environment template (`.env.example`) provides configuration schema with blank keys.
- **Compromise Response Protocol:** Any API token exposed in conversation history or source control is permanently treated as untrusted. Users are guided via `docs/MARKET_DATA_SETUP.md` to configure replacement keys in local `.env` files privately.

---

## 3. Architecture & Service Topology

```
┌─────────────────────────────────────────────────────────────┐
│                 React 18 Frontend (Vite)                    │
│   • Dashboard Overview   • Stock Chart   • Stock Table      │
│   • Autocomplete Search  • Detail Modal  • Status Badges    │
└──────────────────────────────┬──────────────────────────────┘
                               │ /api/* (Vite Proxy)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Express Backend Gateway                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Express Router & Request Validation (Symbol/Range/Q)   │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              ▼                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ In-Memory TTL Cache & Request In-Flight Deduplication │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              ▼                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Market Data Service Layer (Provider Agnostic)         │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              ▼                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Finnhub Provider Adapter (X-Finnhub-Token Header)     │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS + X-Finnhub-Token
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Finnhub Upstream API                       │
│   • /v1/quote     • /v1/stock/candle     • /v1/search       │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Finnhub Endpoints & Data Normalization

### 4.1 Stock Quote
- **Upstream Route:** `GET https://finnhub.io/api/v1/quote?symbol={symbol}`
- **Backend Route:** `GET /api/market/quote?symbol={symbol}`
- **Upstream Fields:**
  - `c`: Current price
  - `d`: Change
  - `dp`: Percent change
  - `h`: High price of the day
  - `l`: Low price of the day
  - `o`: Open price of the day
  - `pc`: Previous close price
  - `t`: UNIX timestamp (seconds)
- **Validation Rules:** All numeric fields must be non-null and positive; timestamp must be valid (`> 0`). Missing price or invalid structure is rejected.
- **Normalized Response:**
  ```json
  {
    "symbol": "AAPL",
    "price": 227.63,
    "change": 1.85,
    "changePercent": 0.82,
    "high": 228.40,
    "low": 225.10,
    "open": 226.00,
    "previousClose": 225.78,
    "timestamp": "2026-10-11T16:00:00.000Z",
    "dataStatus": "live",
    "provider": "finnhub",
    "cached": false
  }
  ```

### 4.2 Historical Candles
- **Upstream Route:** `GET https://finnhub.io/api/v1/stock/candle?symbol={symbol}&resolution={res}&from={from}&to={to}`
- **Backend Route:** `GET /api/market/candles?symbol={symbol}&range={range}`
- **Supported Ranges & Resolution Mapping:**
  - `1D`: Resolution `5` or `15` (Intraday trading hours)
  - `1W`: Resolution `60` (Hourly bars across 7 days)
  - `1M`: Resolution `D` (Daily bars across 30 days)
  - `3M`: Resolution `D` (Daily bars across 90 days)
  - `6M`: Resolution `D` (Daily bars across 180 days)
  - `1Y`: Resolution `D` or `W` (Daily/Weekly bars across 365 days)
  - `ALL`: Resolution `M` or `W` (Historical coverage capped at provider entitlement)
- **Upstream Fields:**
  - `c`: List of close prices
  - `h`: List of high prices
  - `l`: List of low prices
  - `o`: List of open prices
  - `v`: List of volume data
  - `t`: List of UNIX timestamps
  - `s`: Status (`ok` or `no_data`)
- **Ordering & Filtering:** Guaranteed chronological ascending order. Empty non-trading intervals are handled gracefully without synthetic data fabrication.

### 4.3 Symbol Search & Autocomplete
- **Upstream Route:** `GET https://finnhub.io/api/v1/search?q={query}`
- **Backend Route:** `GET /api/market/search?q={query}`
- **Client Safeguards:** Debounced input (300ms) with request cancellation / sequence checking to prevent race conditions on fast typing.

### 4.4 Health & Configuration Status
- **Backend Route:** `GET /api/health`
- **Payload:** Reports server uptime, provider connectivity status (`configured` vs `unconfigured`), and active cache statistics without disclosing secrets.

---

## 5. Caching & Rate-Limit Management

Finnhub's Free tier permits **60 API calls per minute**. To ensure stability:
1. **Tiered TTL In-Memory Cache:**
   - **Quotes:** 30 seconds (reduces burst hits during frequent UI re-renders).
   - **Candles:** 5 minutes (historical intervals change slowly).
   - **Symbol Search:** 1 hour (ticker dictionaries are relatively static).
2. **In-Flight Request Deduplication:** Simultaneous client requests for the exact same ticker/range share a single upstream promise.
3. **HTTP 429 Handling:** When rate-limited, the adapter serves cached content if available (flagged as `cached` or `stale`), or returns structured `429 Too Many Requests` with a descriptive retry-after recommendation without retrying in tight loops.

---

## 6. Typed Data-Status Taxonomy

The platform strictly reflects actual data provenance using a state machine:
- `live`: Direct, verified upstream quote with current-session timestamp.
- `delayed`: Upstream data subject to exchange-mandated delay (e.g. 15-minute delay).
- `cached`: Valid provider data served from local backend cache within TTL window.
- `stale`: Provider data served beyond primary freshness threshold due to upstream unavailability or market closure.
- `simulated`: Deterministic model data (active when unconfigured or for unsupported synthetic indices).
- `unavailable`: Data could not be fetched and no fallback is permitted.

---

## 7. Graceful Fallback & Zero-Breakage Guarantee

If `FINNHUB_API_KEY` is not present or unconfigured:
1. The backend boots normally, reporting provider status `unconfigured` via `/api/health`.
2. The frontend identifies the unconfigured state and continues rendering the deterministic mock-data platform with prominent, transparent `SIMULATED` labeling.
3. No crashes, unhandled rejections, or blank screens occur.
