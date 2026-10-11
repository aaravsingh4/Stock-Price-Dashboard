# TradePulse Pro — System Architecture & Component Boundaries

## 1. High-Level Architecture Overview

TradePulse Pro uses a layered, decoupled architecture designed for high maintainability, strong security, and financial data integrity. The application separates UI presentation from market data acquisition and business domain services.

```mermaid
graph TD
    subgraph Client Tier ["Client Tier (React 18 + TypeScript + Vite)"]
        UI[UI Views: Dashboard, Watchlist, Alerts, Portfolio]
        ThemeCtx[Theme Provider (Light Default / Dark)]
        StateLayer[Client State & Hooks (useMarketData, useWatchlist)]
        ApiClient[API Client / Mock Fallback Service]
    end

    subgraph Server Tier ["Backend Tier (Planned: Express + TypeScript)"]
        Router[REST API Router (/api/v1)]
        AuthMid[Auth & Rate Limit Middleware]
        MarketSvc[Market Data Service Adapter]
        UserSvc[User & Watchlist Domain Service]
        Cache[In-Memory / Redis Cache (TTL)]
    end

    subgraph Data Tier ["Data Persistence (Planned)"]
        Prisma[Prisma ORM]
        DB[(PostgreSQL Database)]
    end

    subgraph External Tier ["External Market Data Providers"]
        Finnhub[Finnhub / Alpha Vantage API]
    end

    UI --> ThemeCtx
    UI --> StateLayer
    StateLayer --> ApiClient
    ApiClient -.->|Phase 1: Simulated Data Service| ApiClient
    ApiClient -->|Phase 5+: HTTP REST / WebSocket| Router
    Router --> AuthMid
    AuthMid --> MarketSvc
    AuthMid --> UserSvc
    MarketSvc --> Cache
    Cache --> Finnhub
    UserSvc --> Prisma
    Prisma --> DB
```

---

## 2. Component Boundaries & Responsibilities

### 2.1 Client-Side (Frontend)
- **Role:** Interactive presentation, client-side filtering, data visualization, and accessibility.
- **Key Modules:**
  - `components/ui/`: Dumb, reusable primitive UI components (Cards, Badges, Buttons, Tables, Spinners).
  - `components/dashboard/`: Domain-specific components (StockTable, MarketSummaryCard, ChartView, StatusBadge).
  - `components/layout/`: App shell, responsive navigation header, sidebar, footer.
  - `context/ThemeContext`: Manages and persists `light` vs `dark` theme (light mode is the hard default).
  - `services/`: Abstract API clients. During Phase 1, supplies type-safe simulated stock data with transparent `SIMULATED` status flags.
  - `types/`: Strict TypeScript domain interfaces (`Stock`, `Quote`, `MarketStatus`, `Watchlist`, `Theme`).

### 2.2 Backend API (Planned for Phase 5)
- **Role:** Orchestrates financial data, conceals secret API keys, enforces rate limits, handles user authentication, and coordinates database persistence.
- **Key Modules:**
  - `routes/`: RESTful endpoints (`/api/v1/stocks`, `/api/v1/watchlists`, `/api/v1/alerts`).
  - `services/marketData/`: Provider-agnostic adapter interface (`IMarketDataProvider`). Implements caching, retry backoff, and fallback mechanisms.
  - `middleware/`: Error handling, JWT verification, and rate limiting.

### 2.3 Database & ORM (Planned for Phase 5)
- **Engine:** PostgreSQL managed via Prisma ORM.
- **Relational Schema:**
  - `User`: Credentials, preferences (e.g., default currency, theme preference).
  - `Watchlist` & `WatchlistItem`: Many-to-one relationship per user for customized ticker tracking.
  - `Alert`: Threshold rules (trigger price, condition: ABOVE/BELOW, notification status).
  - `PortfolioTransaction`: Asset purchases, sales, execution price, timestamps.

---

## 3. Market Data Lifecycle & Transparency Strategy

A core requirement for a professional FinTech platform is data integrity. TradePulse Pro enforces strict status labelling across all data pipelines:

```
[External Provider] ──> [Server Cache Check] ──> [Rate Limit Guard] ──> [Client Response]
                                                                                │
                                           ┌────────────────────────────────────┴───────────────────┐
                                           ▼                                                        ▼
                                   { status: 'LIVE' }                                       { status: 'SIMULATED' }
                           (Real timestamps, verified exchange)                     (Clearly labeled, explicit mock flag)
```

### Data State Hierarchy
1. `LIVE`: Real-time quote received directly within sub-minute latency.
2. `DELAYED`: Standard exchange feed with 15-minute statutory delay.
3. `CACHED`: Response served from memory/Redis due to rate limits or recent TTL window.
4. `SIMULATED`: Deterministic mock data for local development or offline preview. **Never disguised as live data.**
5. `ERROR` / `UNAVAILABLE`: Network failure or provider outage gracefully displayed using fallback empty states.

---

## 4. Caching & Performance Architecture

To operate efficiently within free-tier provider constraints (e.g. 5 calls/minute on free Alpha Vantage tiers):
1. **Server-Side In-Memory Cache:**
   - 30 to 60-second TTL for active quotes.
   - 12-hour TTL for company overviews, logos, and sector classifications.
2. **Client-Side Deduplication:**
   - Request deduplication to avoid redundant round-trips when multiple widgets mount simultaneously.
3. **Optimistic UI Updates:**
   - Watchlist additions and theme switches update instantaneously on the client while syncing asynchronously.

---

## 5. Security & Authentication Model

- **Zero Secret Leakage:** Frontend client bundles never contain third-party API keys (e.g. `VITE_FINNHUB_KEY`). All outbound provider requests are brokered through the backend.
- **Authentication:** Stateless JWT or secure HTTP-only cookies in production.
- **Validation:** Strict runtime request schema validation (using Zod or Joi) on all endpoints.

---

## 6. Testing Strategy

1. **Unit Tests (Vitest):**
   - Core financial calculations (percentage change, absolute delta, P&L calculation).
   - Theme provider initialization, toggle logic, and localStorage synchronization.
2. **Component Tests (React Testing Library):**
   - Theme toggle button interactions.
   - Empty, loading, and error state rendering.
   - Stock table row rendering and color indicators (green for positive, red for negative).
3. **Integration & API Tests (Phase 5):**
   - Supertest for REST routes, HTTP status codes, and error payload consistency.

---

## 7. Current Maturity Status

| Component | Status | Phase |
|---|---|---|
| Project Plan & Audit | **Active** | Phase 1 |
| Architecture Document | **Active** | Phase 1 |
| Frontend Shell & Theme Engine | **Active** | Phase 1 |
| Mock Data Service & UI Components | **Active** | Phase 1 |
| Chart.js Interactive Canvas | Planned | Phase 2 |
| Live Third-Party Market API | Planned | Phase 3 |
| Express REST Backend | Planned | Phase 5 |
| PostgreSQL + Prisma Models | Planned | Phase 5 |
| User Auth & Persistence | Planned | Phase 6 |
