# TradePulse Pro — Project Plan & Workspace Audit

## 1. Initial Workspace Audit

### 1.1 Repository State
- **Workspace Directory:** `c:\Users\HP\Stock-Price-Dashboard`
- **Git Repository Status:** Initialized on branch `main`, no prior commits (`HEAD` unborn).
- **Pre-existing Codebase:** None. The repository is completely clean; no legacy files (such as raw `index.html`, `js/app.js`, etc.) existed prior to initialization. No user work was discarded or overwritten.
- **Git User Identity:**
  - Name: `Aarav Singh`
  - Email: `aaravsinghrajput5555@gmail.com`
  - Global identity is valid and active for local commits.

### 1.2 Development Environment & Tooling
- **Operating System:** Windows 11 (PowerShell environment)
- **Node.js:** `v24.21.0` (Modern LTS / Current active runtime)
- **npm:** `v11.19.0` (Accessible via `npm.cmd` due to Windows PowerShell script execution policy)
- **Git:** `v2.56.0.windows.1`

---

## 2. Product Vision & Educational Goals

### 2.1 The Mission
TradePulse Pro is designed as a **production-grade, resume-ready Real-Time Stock Market Intelligence Platform**. Rather than a toy dashboard with hardcoded values or a monolithic script, TradePulse Pro demonstrates:
1. **Clean Architectural Boundaries:** Strict separation of UI presentation, client state, business logic, API services, and data transformation.
2. **FinTech-Grade Design:** A light-mode-first professional user experience (inspired by institutional Bloomberg / TradingView / FactSet interfaces), with persistent dark mode support.
3. **Data Integrity & Status Transparency:** Clear distinctions between *Live*, *Delayed*, *Cached*, and *Simulated* data.
4. **Reliable Tooling & Testing:** Unit tests, linting, type-checking, and zero tolerance for untyped or fragile mock data.
5. **Git Discipline:** Small, atomic, conventional commits reflecting real engineering milestones.

---

## 3. Technology Stack Selection & Rationale

| Layer | Selected Technology | Rationale |
|---|---|---|
| **Frontend Framework** | React 18+ with TypeScript | Industry standard for complex single-page analytics apps; strong type safety prevents runtime financial calculation errors. |
| **Build Tool & Dev Server**| Vite | Sub-second HMR, native ES modules, minimal boilerplate, and fast production bundling. |
| **Styling & Design Tokens** | Tailwind CSS (Tailwind v3/v4 compatible) | Utility-first CSS supporting predictable class-based dark mode (`class` strategy), responsive grids, and design tokens without CSS bloat. |
| **Icons** | Lucide React | Clean, tree-shakeable SVG icons adhering to modern FinTech aesthetic. |
| **Data Visualization** | Chart.js & `react-chartjs-2` | Robust canvas-based charting for responsive line, area, and volume charts with theme-aware colors. |
| **Testing** | Vitest + React Testing Library | Fast Vite-native test runner compatible with ESM, TypeScript, and modern React hooks. |
| **Backend (Phase 4+)** | Node.js + Express + TypeScript | Lightweight, scalable REST API layer decoupling third-party market data keys from frontend clients. |
| **Database & ORM (Phase 4+)** | PostgreSQL + Prisma ORM | Relational schema integrity for multi-user watchlists, alerts, and transaction records. |

---

## 4. Phased Development Roadmap

- **Phase 1 (Current Master Prompt): Foundation Only**
  - Workspace and Git audit (`docs/PROJECT_PLAN.md`).
  - System architecture and component boundaries (`docs/ARCHITECTURE.md`).
  - Safe project setup (`package.json`, Vite, TypeScript, Tailwind CSS, `.gitignore`, `.env.example`).
  - Initial dashboard shell: branding, navigation, responsive layout, simulated stocks, reusable cards, table, and states.
  - Persistent light/dark theme system (light mode default).
  - Setup and developer documentation (`README.md`).
  - Verification: lint, type-check, tests, and build.

- **Phase 2: Advanced Dashboard UI & Reusable Components**
  - Expanded FinTech widgets, market stats, sector breakdown, top gainers/losers.
  - Interactive Chart.js integration with dynamic time-frames (1D, 1W, 1M, 1Y, ALL) and theme synchronization.

- **Phase 3: Real Market Data Integration & Service Layer**
  - Provider integration (Alpha Vantage / Finnhub / Polygon).
  - Data status indicators: Live vs Delayed vs Cached vs Simulated.
  - Client-side data caching and rate-limit mitigation.

- **Phase 4: Stock Search, Detail View & Market Movers**
  - Debounced ticker search and company profiles.
  - Interactive technical indicators and volume bars.

- **Phase 5: Backend API & Database (Node.js + Express + PostgreSQL + Prisma)**
  - REST API server, secure credential handling, health checks, rate-limiting.
  - Database schema: Users, Watchlists, Alerts, Audit logs.

- **Phase 6: Authentication & Persistent Watchlists**
  - Secure JWT / Session authentication.
  - User-specific watchlists stored in PostgreSQL.

- **Phase 7: Price Alerts & Notification Service**
  - Threshold triggers (above/below price targets).
  - Client alert badge and notification history.

- **Phase 8: Portfolio Tracking & Performance Analytics**
  - Buy/sell transaction logging, P&L calculations, portfolio diversification breakdown.

- **Phase 9: Security Hardening, Automated CI/CD & Deployment**
  - Production deployment (e.g., Vercel / Render / Docker).
  - Documentation, architecture diagrams, interview talking points.

---

## 5. Migration & Non-Destructive Principles
- Because the repository was initialized empty, there are no legacy assets to migrate.
- If future prompts introduce backend services or other modules, they will be organized into clean monorepo/subfolder structures (e.g. `client/` and `server/` or root frontend with backend companion) without deleting existing work.
- Every commit represents a single atomic, verified task.
