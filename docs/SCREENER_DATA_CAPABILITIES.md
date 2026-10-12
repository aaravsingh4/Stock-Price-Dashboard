# Finnhub API Screener Data Capabilities & Entitlements Audit

This document summarizes the verified provider capabilities, data field mappings, and verified account limitations for the **TradePulse Pro Stock Screener & Discovery Workspace**.

---

## 1. Verified Account Capabilities Matrix

Audited on live Finnhub API endpoints using the configured environment key:

| Endpoint / Feature | HTTP Status | Entitlement Status | Verified Fields / Schema | Usage in Screener |
| :--- | :--- | :--- | :--- | :--- |
| **Symbol Search** (`/api/v1/search?q=...`) | `200 OK` | **Available** | `symbol`, `description`, `displaySymbol`, `type` | Dynamic symbol & company name autocomplete discovery across equities. |
| **Real-Time Quote** (`/api/v1/quote?symbol=...`) | `200 OK` | **Available** | `c` (current price), `d` (change), `dp` (percent change), `h` (day high), `l` (day low), `o` (open), `pc` (prev close), `t` (timestamp) | Price filtering, percentage change filtering, live/cached badges. |
| **Company Profile 2** (`/api/v1/stock/profile2?symbol=...`) | `200 OK` | **Available** | `ticker`, `name`, `currency`, `exchange`, `finnhubIndustry`, `marketCapitalization`, `shareOutstanding`, `weburl`, `logo` | Genuine exchange filtering, genuine sector/industry classification, genuine market cap (in millions USD). |
| **US Symbols Catalog** (`/api/v1/stock/symbol?exchange=US`) | `200 OK` | **Available** | Over 31,000 listed securities with `currency`, `description`, `displaySymbol`, `mic`, `type`. | Verification of genuine US exchange symbols (NASDAQ, NYSE, AMEX, BATS). |
| **WebSocket Trades** (`wss://ws.finnhub.io`) | `101 Switching Protocols` | **Available** | `p` (price), `s` (symbol), `t` (time), `v` (volume), `c` (conditions) | Real-time price ticks for selected equities in screener & comparison workspace. |
| **Historical Candles** (`/api/v1/stock/candle`) | `403 Forbidden` | **Restricted on Free Tier** | Returns `{"error":"You don't have access to this resource."}` | Technical indicators (RSI, MA) and historical candle screener filters remain disabled/unentitled. Charts use explicitly labeled simulated fallback. |
| **Trading Volume** (Quote REST) | Partial | **Available via trades & fundamentals** | Finnhub's `/quote` REST endpoint omits volume (`v`); trade volume is provided via WebSocket trades and historical fundamentals (`/stock/metric`). | Volume filter applies when valid volume is observed; otherwise marked unavailable. |

---

## 2. Screener Filter Eligibility & Provenance

### Supported Genuine Filters
1. **Symbol & Company Name Search:** Fully supported through debounced `/api/market/search` and local catalog matches.
2. **Exchange Filter:** Supported via verified profile metadata (`NASDAQ`, `NYSE`, `AMEX`, `BATS`, or `All Exchanges`).
3. **Sector / Industry Filter:** Supported via Finnhub's `finnhubIndustry` attribute (`Technology`, `Healthcare`, `Financial Services`, `Consumer Cyclical`, `Communication Services`, `Industrials`, etc.).
4. **Price Range ($ Min / $ Max):** Fully supported using validated live/cached quote prices (`c`).
5. **Daily Percentage Change (% Min / % Max):** Fully supported using validated quote `dp` values. Identifies Top Gainers, Losers, and range-bound equities.
6. **Market Capitalization:** Supported through `marketCapitalization` from `/stock/profile2` (converted from millions USD).
7. **Volume Filter:** Supported when valid volume metadata exists. Missing volume is kept distinct from zero.

### Restricted / Disabled Capabilities (Account Entitlement Constraints)
1. **Technical Indicators (Moving Averages, RSI):** Not fabricated. Free tier lacks `/stock/candle` access; technical indicator filters remain conditional and clearly flagged as unavailable until higher-tier data is unlocked.
2. **Global International Exchanges:** Finnhub free tier focuses on US markets; international global exchanges without profile entitlements are not presented as available.

---

## 3. Data Integrity & Provenance Guarantee

* **No Synthetic Metrics for Genuine Securities:** When an equity lacks market cap or volume, it displays an honest `N/A` or `UNAVAILABLE` state rather than generating simulated numbers.
* **Mixed Dataset Transparency:** Each row displays its exact data status (`LIVE`, `CACHED`, `SIMULATED`, `STALE`, or `UNAVAILABLE`).
* **Zero vs. Missing:** Null or undefined values are never coerced to `0` for numeric filters or sort comparisons.
