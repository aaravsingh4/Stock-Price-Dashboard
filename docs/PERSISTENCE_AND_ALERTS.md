# Persistence, Watchlists & Price Alert Evaluation Engine

TradePulse Pro features a full cloud persistence layer for user watchlists and authoritative server-side price alert monitoring.

---

## 1. Cloud Watchlists

Mounted under `/api/watchlists` (requires active session):

- **Default Watchlist**: Every new user receives a seeded default watchlist (`"My Watchlist"`) containing AAPL, MSFT, and NVDA created atomically during registration.
- **Custom Lists**: Users can create, rename, and delete custom watchlists. Deleting the default list is prohibited.
- **Symbol Uniqueness**: Enforces compound uniqueness per list `(watchlist_id, symbol)`. Duplicate symbol additions return the existing item idempotently.
- **User Ownership Isolation**: Every query checks `WHERE id = :id AND userId = :userId` ensuring strict cross-tenant boundaries.

---

## 2. Server-Side Authoritative Price Alert Engine

Mounted under `/api/alerts` (requires active session):

### Architecture & Lifecycle
1. **Startup Reconciliation**: At server boot, `CloudAlertService.init()` queries all `ACTIVE` price alerts across users from PostgreSQL and subscribes to those symbols via `finnhubWsClient`.
2. **Shared Stream Reuse**: Rather than opening duplicate upstream connections, alerts share the existing persistent Finnhub WebSocket connection.
3. **Incoming Trade Processing**: When a genuine trade event arrives from Finnhub:
   - Validates condition: `ABOVE` triggers if `trade.price >= targetPrice`; `BELOW` triggers if `trade.price <= targetPrice`.
   - **Atomic Exact-Once Trigger**: Calls `AlertRepository.triggerAlertTransaction()`. In a single transaction:
     - Re-verifies that status is currently `ACTIVE` (locks out concurrent duplicate executions).
     - Transitions status to `TRIGGERED`.
     - Inserts a row into `price_alert_history` with observed price, timestamp, and unique `dedup_id`.
4. **Subscription Re-Evaluation**: Unsubscribes symbols from upstream when they no longer have active alert rules and no active client feeds.
5. **Reconnection Resiliency**: On Finnhub WebSocket reconnection, `CloudAlertService` automatically queries current active alerts and restores all symbol subscriptions.

---

## 3. Browser-Local Data Migration

For users who created alerts or watchlists prior to signing in, the application provides an idempotent import path:

- Endpoint: `POST /api/migrate/local-data`
- The client asks user permission before importing offline records.
- Deduplication prevents importing existing alerts or duplicate watchlist items.
- Returns an import summary: `{ imported, skipped, failed }`.
- Preserves the local data in browser storage as a safe fallback without destructive clearing.
