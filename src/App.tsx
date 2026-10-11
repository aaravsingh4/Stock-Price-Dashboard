import { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/layout/Layout';
import { MarketOverview } from './components/dashboard/MarketOverview';
import { MarketStatsCard } from './components/dashboard/MarketStatsCard';
import { StockTable } from './components/dashboard/StockTable';
import { SimulationNotice } from './components/dashboard/SimulationNotice';
import { LoadingState } from './components/ui/LoadingState';
import { ErrorState } from './components/ui/ErrorState';
import { EmptyState } from './components/ui/EmptyState';
import { MarketIndex, MarketOverviewStats, StockQuote } from './types/stock';
import {
  fetchSimulatedMarketData,
  INITIAL_MARKET_INDICES,
  INITIAL_MARKET_STATS,
  INITIAL_STOCKS,
} from './services/mockMarketData';
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/Card';
import { formatCurrency, formatPercent } from './utils/formatters';
import { TrendBadge, DataStatusBadge } from './components/ui/Badge';
import { X, RefreshCw } from 'lucide-react';
import { Button } from './components/ui/Button';

export function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [indices, setIndices] = useState<MarketIndex[]>(INITIAL_MARKET_INDICES);
  const [stocks, setStocks] = useState<StockQuote[]>(INITIAL_STOCKS);
  const [stats, setStats] = useState<MarketOverviewStats>(INITIAL_MARKET_STATS);
  const [selectedStock, setSelectedStock] = useState<StockQuote | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const data = await fetchSimulatedMarketData();
      setIndices(data.indices);
      setStocks(data.stocks);
      setStats(data.stats);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleWatchlist = (symbol: string) => {
    setStocks((prev) =>
      prev.map((s) => (s.symbol === symbol ? { ...s, isWatchlisted: !s.isWatchlisted } : s))
    );
  };

  return (
    <Layout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      lastUpdated={stats.lastRefreshed}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      stocks={stocks}
      onSelectStock={(stock) => setSelectedStock(stock)}
    >
      {/* Simulation Notice Banner */}
      <SimulationNotice />

      {/* Main Tab Routing Content */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Top Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Market Overview & Equities
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Institutional-grade pricing telemetry, benchmark indices, and liquidity telemetry
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={isLoading}
                className="gap-2 text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Telemetry</span>
              </Button>
            </div>
          </div>

          {isLoading ? (
            <LoadingState />
          ) : hasError ? (
            <ErrorState onRetry={loadData} />
          ) : (
            <>
              {/* Indices Overview */}
              <section aria-label="Market Indices">
                <MarketOverview indices={indices} />
              </section>

              {/* Market Intelligence Stats Card */}
              <section aria-label="Market Health Stats">
                <MarketStatsCard stats={stats} />
              </section>

              {/* Equities Watchlist & Table */}
              <section aria-label="Stock Quotes Table">
                <StockTable
                  stocks={stocks}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onToggleWatchlist={handleToggleWatchlist}
                  onSelectStock={(stock) => setSelectedStock(stock)}
                />
              </section>
            </>
          )}

          {/* Quick Stock Detail Preview Modal / Drawer */}
          {selectedStock && (
            <div
              className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setSelectedStock(null)}
            >
              <Card
                className="w-full max-w-lg p-0 shadow-elevated border-slate-300 dark:border-surface-darkBorder animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <CardHeader className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CardTitle className="text-base">{selectedStock.symbol}</CardTitle>
                    <span className="text-xs text-slate-500">{selectedStock.companyName}</span>
                    <DataStatusBadge status={selectedStock.dataStatus} />
                  </div>
                  <button
                    onClick={() => setSelectedStock(null)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-baseline justify-between border-b border-slate-100 dark:border-surface-darkBorder pb-4">
                    <div>
                      <div className="text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                        {formatCurrency(selectedStock.price)}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Previous Close: {formatCurrency(selectedStock.previousClose)}
                      </div>
                    </div>
                    <div className="text-right">
                      <TrendBadge
                        value={selectedStock.changePercent}
                        formattedText={formatPercent(selectedStock.changePercent)}
                      />
                      <div className="text-xs font-semibold tabular-nums mt-1 text-slate-600 dark:text-slate-300">
                        {selectedStock.change >= 0 ? `+${selectedStock.change.toFixed(2)}` : selectedStock.change.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-surface-darkBorder">
                      <div className="text-slate-400 text-[11px]">Day Range</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums mt-0.5">
                        {formatCurrency(selectedStock.dayLow)} – {formatCurrency(selectedStock.dayHigh)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-surface-darkBorder">
                      <div className="text-slate-400 text-[11px]">Open Price</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums mt-0.5">
                        {formatCurrency(selectedStock.open)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-surface-darkBorder">
                      <div className="text-slate-400 text-[11px]">P/E Ratio</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums mt-0.5">
                        {selectedStock.peRatio ?? 'N/A'}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-surface-darkBorder">
                      <div className="text-slate-400 text-[11px]">Sector</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {selectedStock.sector}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      variant={selectedStock.isWatchlisted ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => handleToggleWatchlist(selectedStock.symbol)}
                    >
                      {selectedStock.isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Placeholder states for future phases */}
      {activeTab === 'explore' && (
        <EmptyState
          title="Explore Securities & Technical Screeners"
          description="Advanced multi-exchange screener and full company fundamentals are scheduled for Phase 4."
          actionLabel="Return to Dashboard"
          onAction={() => setActiveTab('dashboard')}
        />
      )}

      {activeTab === 'watchlist' && (
        <EmptyState
          title="Persistent Watchlist System"
          description="Cloud database persistence and customizable user lists are scheduled for Phase 6."
          actionLabel="Return to Dashboard"
          onAction={() => setActiveTab('dashboard')}
        />
      )}

      {activeTab === 'alerts' && (
        <EmptyState
          title="Price & Volatility Alerts"
          description="Automated price threshold alerts and notification webhooks are scheduled for Phase 7."
          actionLabel="Return to Dashboard"
          onAction={() => setActiveTab('dashboard')}
        />
      )}

      {activeTab === 'portfolio' && (
        <EmptyState
          title="Portfolio Intelligence & Analytics"
          description="Cost basis tracking, profit/loss calculations, and risk analytics are scheduled for Phase 8."
          actionLabel="Return to Dashboard"
          onAction={() => setActiveTab('dashboard')}
        />
      )}

      {activeTab === 'settings' && (
        <EmptyState
          title="Platform & Account Preferences"
          description="API keys configuration, default currency, and alert preferences are scheduled for upcoming phases."
          actionLabel="Return to Dashboard"
          onAction={() => setActiveTab('dashboard')}
        />
      )}
    </Layout>
  );
}

export function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
