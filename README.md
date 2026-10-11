# TradePulse Pro — Real-Time Stock Market Intelligence Platform

[![Build & Typecheck](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![UI Framework](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![Styling](https://img.shields.io/badge/TailwindCSS-v3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Test Suite](https://img.shields.io/badge/Vitest-Passing-success.svg)](https://vitest.dev/)
[![Theme](https://img.shields.io/badge/Theme-Light%20Default-amber.svg)](#theme-system)

TradePulse Pro is an institutional-grade, full-stack stock market analytics and intelligence platform designed to showcase production-oriented software engineering, clean modular architecture, and financial data integrity.

---

## 1. Project Overview

TradePulse Pro bridges the gap between basic stock price tickers and professional financial terminals (such as Bloomberg Terminal or FactSet). It is built with:
- **Light-Mode-First Design Philosophy:** Institutional FinTech interfaces default to high-contrast, clean light palettes for daytime trading efficiency. Dark mode is available as a secondary, persistent user preference.
- **Strict Data Transparency:** Every price quote and metric clearly communicates its lifecycle status (`LIVE`, `DELAYED`, `CACHED`, or `SIMULATED`).
- **Resilient Component Architecture:** Isolated presentation components, decoupled state hooks, and abstract service adapters ensure external market providers can be swapped without touching UI code.
- **Incremental, Atomic Development:** Built with small, verified Git commits adhering to the Conventional Commits specification.

---

## 2. Current Features (Phase 1 — Foundation)

- [x] **Responsive Application Shell:** Polished desktop, tablet, and mobile layouts with responsive navigation sidebar and header.
- [x] **Light-Theme-First Design System:** High-readability slate surfaces, subtle borders, institutional green (`#16a34a`) for gains and red (`#dc2626`) for drops.
- [x] **Persistent Theme Engine:** Zero-flash theme initialization script in `index.html`, `localStorage` synchronization, accessible toggle with aria-labels, and full dark-palette styling.
- [x] **Market Index Telemetry:** Real-time cards for major market indices (S&P 500, NASDAQ, Dow Jones, Russell 2000) with delta and percentage movements.
- [x] **Market Intelligence & Health Card:** Overview of active trading sessions, total traded volume, market breadth (gainers vs. losers count), and market sentiment.
- [x] **Equities Watchlist Table:** Multi-column financial table with real-time price, 24h change %, volume, market cap, sector tags, interactive sorting, debounced search, sector filtering, and watchlist toggling.
- [x] **Stock Detail Preview Drawer:** Quick inspection drawer displaying day high/low range, open price, P/E ratio, and sector details.
- [x] **Data Transparency Banner:** Visible notice indicating active simulation mode for development.
- [x] **State Handling:** Dedicated UI components for `LoadingState`, `EmptyState`, and `ErrorState` with retry actions.
- [x] **Automated Test Suite:** Vitest unit test suite covering financial formatters, theme initialization, fallback defaults, and toggle persistence.

---

## 3. Planned Features (Phases 2 – 9)

- [ ] **Phase 2: Interactive Chart Canvas (Planned):** Chart.js line and area charts with multi-timeframe controls (1D, 1W, 1M, 1Y, ALL) synchronized to active theme colors.
- [ ] **Phase 3: Real Market Data Feed (Planned):** Provider adapter integrating Finnhub / Alpha Vantage with rate-limit protection and fallback caching.
- [ ] **Phase 4: Stock Screener & Detail Pages (Planned):** Advanced technical indicator screening and dedicated stock drill-down views.
- [ ] **Phase 5: Node.js + Express Backend & PostgreSQL (Planned):** Secure REST API server with JWT authentication and PostgreSQL database managed via Prisma ORM.
- [ ] **Phase 6: Multi-User Cloud Watchlists (Planned):** Persistent user accounts with synchronized cloud watchlists.
- [ ] **Phase 7: Configurable Price & Volatility Alerts (Planned):** Target threshold triggers and in-app notification logs.
- [ ] **Phase 8: Portfolio Tracking & P&L Analytics (Planned):** Trade execution logging, cost basis analysis, and asset diversification metrics.
- [ ] **Phase 9: Security Hardening & CI/CD Deployment (Planned):** Production deployment to Vercel/Render with automated GitHub Actions testing.

---

## 4. Technology Stack

### Frontend
- **Framework:** React 18 (TypeScript)
- **Bundler & Server:** Vite
- **Styling:** Tailwind CSS (`darkMode: 'class'`)
- **Icons:** Lucide React
- **Data Visualization (Upcoming):** Chart.js & `react-chartjs-2`
- **Utility:** `clsx`, `tailwind-merge`

### Quality & Tooling
- **Test Runner:** Vitest + React Testing Library + JSDOM
- **Type Checking:** TypeScript (`tsc --noEmit`)
- **Linter:** ESLint
- **Version Control:** Git with Conventional Commits

### Planned Backend (Phase 5+)
- **Server:** Node.js + Express + TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Data Providers:** Finnhub / Alpha Vantage REST APIs

---

## 5. Prerequisites

- **Node.js:** v18.0.0 or higher (Tested on Node.js `v24.21.0`)
- **npm:** v9.0.0 or higher (Tested on npm `v11.19.0`)
- **Git:** v2.30.0 or higher

> [!NOTE]
> On Windows PowerShell systems with restricted script execution policies, run commands using `npm.cmd` (e.g. `npm.cmd run dev`) or run PowerShell with `Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned`.

---

## 6. Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/aaravsingh4/Stock-Price-Dashboard.git
   cd Stock-Price-Dashboard
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   *(Review `.env` placeholders; no external API keys are required for Phase 1 simulated mode).*

3. **Install dependencies:**
   ```bash
   npm install
   # Or on Windows PowerShell:
   npm.cmd install
   ```

---

## 7. Development & Operational Commands

| Command | Description |
|---|---|
| `npm run dev` / `npm.cmd run dev` | Launches the local Vite development server at `http://localhost:3000` with sub-second HMR. |
| `npm run test` / `npm.cmd run test` | Executes the Vitest unit test suite with JSDOM. |
| `npm run test:watch` / `npm.cmd run test:watch` | Starts Vitest in interactive watch mode for TDD workflows. |
| `npm run typecheck` / `npm.cmd run typecheck` | Validates TypeScript types across the entire project (`tsc --noEmit`). |
| `npm run lint` / `npm.cmd run lint` | Runs ESLint with zero-warning tolerance (`--max-warnings 0`). |
| `npm run build` / `npm.cmd run build` | Compiles production assets into the optimized `dist/` bundle. |
| `npm run preview` / `npm.cmd run preview` | Spins up a local static server to inspect the production build. |

---

## 8. Simulated vs. Real Stock Data Notice

TradePulse Pro adheres to strict data transparency guidelines:

- **Simulated Data (Current Phase):**
  - Prices, market indices, volumes, and metrics are deterministically generated by `src/services/mockMarketData.ts`.
  - All items carry the `dataStatus: 'SIMULATED'` badge.
  - This allows rapid UI, accessibility, and state validation without consuming third-party API rate limits.
- **Real Market Data (Planned Phase 3):**
  - Outbound calls to Finnhub or Alpha Vantage will be channeled strictly through our backend service adapter.
  - Live data will be designated as `LIVE` (sub-minute quotes) or `DELAYED` (standard 15-minute exchange delay).
  - Failed or cached requests will be transparently labeled; mock data will **never** be silently disguised as live market data.

---

## 9. Current Limitations

1. **Provider Connectivity:** Real-time WebSocket and third-party REST API feeds are not yet attached (scheduled for Phase 3).
2. **Chart Rendering:** Chart.js canvas elements are scaffolded for Phase 2; currently represented by index summary metrics.
3. **Cloud Persistence:** Watchlist and settings alterations currently persist in browser state and `localStorage`; database persistence begins in Phase 5.

---

## 10. Git Workflow & Commit Discipline

This project enforces small, atomic commits using Conventional Commit syntax:

- `feat: add <feature-description>`
- `fix: resolve <bug-description>`
- `chore: configure <tooling-description>`
- `docs: update <documentation-description>`
- `test: add <test-description>`
- `refactor: restructure <code-without-feature-change>`

---

## 11. Project Documentation Links

- [System Architecture & Component Boundaries](docs/ARCHITECTURE.md)
- [Project Plan & Roadmap](docs/PROJECT_PLAN.md)
