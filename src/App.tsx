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
import { MarketIndex, MarketOverviewStats, StockQuote, TimeRange } from './types/stock';
import { StockChart } from './components/dashboard/StockChart';
import { MarketMovers } from './components/dashboard/MarketMovers';
import { StockDetailModal } from './components/dashboard/StockDetailModal';
import {
  fetchSimulatedMarketData,
  INITIAL_MARKET_INDICES,
  INITIAL_MARKET_STATS,
  INITIAL_STOCKS,
} from './services/mockMarketData';
import { RefreshCw } from 'lucide-react';
import { Button } from './components/ui/Button';
import { marketApiClient } from './services/apiClient';
import { marketStreamClient, ConnectionStatus, RealtimeTrade } from './services/marketStreamClient';
import { alertService } from './services/alertService';
import { AlertManager } from './components/alerts/AlertManager';
import { AlertToastNotification } from './components/alerts/AlertToastNotification';
import { StockScreenerWorkspace } from './components/screener/StockScreenerWorkspace';

export function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [indices, setIndices] = useState<MarketIndex[]>(INITIAL_MARKET_INDICES);
  const [stocks, setStocks] = useState<StockQuote[]>(INITIAL_STOCKS);
  const [stats, setStats] = useState<MarketOverviewStats>(INITIAL_MARKET_STATS);
  const [selectedStock, setSelectedStock] = useState<StockQuote | null>(null);
  const [selectedStockForChart, setSelectedStockForChart] = useState<StockQuote>(INITIAL_STOCKS[0]);
  const [chartTimeRange, setChartTimeRange] = useState<TimeRange>('1M');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLiveProviderActive, setIsLiveProviderActive] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('demo');

  // Listen to streaming connection status and incoming trade events
  useEffect(() => {
    const unsubStatus = marketStreamClient.onStatus((status) => {
      setConnectionStatus(status);
    });

    const unsubTrades = marketStreamClient.onTrade((trade: RealtimeTrade) => {
      // Evaluate against active alert rules
      alertService.evaluateTrade(trade);

      // Throttled price update to selected stock and stock table
      setSelectedStockForChart((current) => {
        if (current.symbol === trade.symbol) {
          const diff = Number((trade.price - current.previousClose).toFixed(2));
          const pct = Number(((diff / current.previousClose) * 100).toFixed(2));
          return {
            ...current,
            price: trade.price,
            change: diff,
            changePercent: pct,
            dayHigh: Math.max(current.dayHigh, trade.price),
            dayLow: Math.min(current.dayLow, trade.price),
            dataStatus: 'LIVE',
            lastUpdated: trade.timestamp,
          };
        }
        return current;
      });

      setSelectedStock((current) => {
        if (current && current.symbol === trade.symbol) {
          const diff = Number((trade.price - current.previousClose).toFixed(2));
          const pct = Number(((diff / current.previousClose) * 100).toFixed(2));
          return {
            ...current,
            price: trade.price,
            change: diff,
            changePercent: pct,
            dayHigh: Math.max(current.dayHigh, trade.price),
            dayLow: Math.min(current.dayLow, trade.price),
            dataStatus: 'LIVE',
            lastUpdated: trade.timestamp,
          };
        }
        return current;
      });

      setStocks((prev) =>
        prev.map((s) => {
          if (s.symbol === trade.symbol) {
            const diff = Number((trade.price - s.previousClose).toFixed(2));
            const pct = Number(((diff / s.previousClose) * 100).toFixed(2));
            return {
              ...s,
              price: trade.price,
              change: diff,
              changePercent: pct,
              dayHigh: Math.max(s.dayHigh, trade.price),
              dayLow: Math.min(s.dayLow, trade.price),
              dataStatus: 'LIVE',
              lastUpdated: trade.timestamp,
            };
          }
          return s;
        })
      );
    });

    return () => {
      unsubStatus();
      unsubTrades();
    };
  }, []);

  // Subscribe streaming to selected stock when live provider is active
  useEffect(() => {
    if (isLiveProviderActive && selectedStockForChart?.symbol) {
      marketStreamClient.subscribe(selectedStockForChart.symbol);
      return () => {
        marketStreamClient.unsubscribe(selectedStockForChart.symbol);
      };
    }
  }, [isLiveProviderActive, selectedStockForChart?.symbol]);

  const loadData = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const data = await fetchSimulatedMarketData();
      setIndices(data.indices);
      setStocks(data.stocks);
      setStats(data.stats);

      // Probe backend gateway and Finnhub provider status
      const health = await marketApiClient.checkHealth();
      if (health?.provider?.configured) {
        setIsLiveProviderActive(true);
        marketStreamClient.connect();

        const initialQuote = await marketApiClient.fetchQuote(INITIAL_STOCKS[0].symbol);
        if (initialQuote) {
          const enriched: StockQuote = {
            ...INITIAL_STOCKS[0],
            price: initialQuote.price,
            change: initialQuote.change,
            changePercent: initialQuote.changePercent,
            open: initialQuote.open,
            dayHigh: initialQuote.high,
            dayLow: initialQuote.low,
            previousClose: initialQuote.previousClose,
            dataStatus: initialQuote.dataStatus.toUpperCase() as import('./types/stock').DataStatus,
            lastUpdated: initialQuote.timestamp,
          };
          setSelectedStockForChart(enriched);
          setStocks((prev) => prev.map((s) => (s.symbol === enriched.symbol ? enriched : s)));
        }
      } else {
        setConnectionStatus('demo');
      }
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
    if (selectedStockForChart.symbol === symbol) {
      setSelectedStockForChart((prev) => ({ ...prev, isWatchlisted: !prev.isWatchlisted }));
    }
  };

  const handleStockSelect = async (stock: StockQuote) => {
    setSelectedStock(stock);
    setSelectedStockForChart(stock);

    if (isLiveProviderActive) {
      marketStreamClient.subscribe(stock.symbol);
      const liveQuote = await marketApiClient.fetchQuote(stock.symbol);
      if (liveQuote) {
        const enriched: StockQuote = {
          ...stock,
          price: liveQuote.price,
          change: liveQuote.change,
          changePercent: liveQuote.changePercent,
          open: liveQuote.open,
          dayHigh: liveQuote.high,
          dayLow: liveQuote.low,
          previousClose: liveQuote.previousClose,
          dataStatus: liveQuote.dataStatus.toUpperCase() as import('./types/stock').DataStatus,
          lastUpdated: liveQuote.timestamp,
        };
        setSelectedStock(enriched);
        setSelectedStockForChart(enriched);
        setStocks((prev) => prev.map((s) => (s.symbol === stock.symbol ? enriched : s)));
      } else {
        // If live quote request failed or unavailable, mark with honest UNAVAILABLE status without faking data
        const unavailable: StockQuote = {
          ...stock,
          dataStatus: 'UNAVAILABLE',
        };
        setSelectedStock(unavailable);
        setSelectedStockForChart(unavailable);
        setStocks((prev) => prev.map((s) => (s.symbol === stock.symbol ? unavailable : s)));
      }
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      lastUpdated={stats.lastRefreshed}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      stocks={stocks}
      onSelectStock={handleStockSelect}
      connectionStatus={connectionStatus}
    >
      {/* Simulation Notice Banner */}
      <SimulationNotice isLiveProviderActive={isLiveProviderActive} />

      {/* Main Tab Routing Content */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Top Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Market Overview & Analytics
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Real-time price discovery, technical charting, and benchmark telemetry
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

              {/* Main Interactive Historical Stock Chart */}
              <section aria-label="Interactive Stock Chart">
                <StockChart
                  stock={selectedStockForChart}
                  timeRange={chartTimeRange}
                  onTimeRangeChange={setChartTimeRange}
                  onToggleWatchlist={handleToggleWatchlist}
                />
              </section>

              {/* Market Movers Panels */}
              <section aria-label="Market Movers">
                <MarketMovers
                  stocks={stocks}
                  onSelectStock={handleStockSelect}
                />
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
                  onSelectStock={handleStockSelect}
                />
              </section>
            </>
          )}

          {/* Stock Detail Modal / Drawer */}
          {selectedStock && (
            <StockDetailModal
              stock={selectedStock}
              onClose={() => setSelectedStock(null)}
              onToggleWatchlist={handleToggleWatchlist}
            />
          )}
        </div>
      )}

      {/* Active Alerts View */}
      {activeTab === 'alerts' && (
        <AlertManager
          defaultSymbol={selectedStockForChart?.symbol || 'AAPL'}
          defaultPrice={selectedStockForChart?.price || 180}
        />
      )}

      {/* Explore Stocks & Multi-Exchange Screener Workspace */}
      {activeTab === 'explore' && (
        <StockScreenerWorkspace
          initialStocks={stocks}
          onSelectStock={handleStockSelect}
          onToggleWatchlist={handleToggleWatchlist}
          isLiveProviderActive={isLiveProviderActive}
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

      {/* Global In-App Alert Notifications */}
      <AlertToastNotification />
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
