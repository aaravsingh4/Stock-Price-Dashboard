import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Loader2, SlidersHorizontal } from 'lucide-react';
import { ScreenerStockItem, ScreenerFilterCriteria, ScreenerSortCriteria, ScreenerSortField } from '../../types/screener';
import { StockQuote } from '../../types/stock';
import { filterScreenerStocks, sortScreenerStocks } from '../../utils/screenerFiltering';
import { ScreenerFilterPanel } from './ScreenerFilterPanel';
import { ScreenerTable } from './ScreenerTable';
import { StockComparisonView } from './StockComparisonView';
import { marketApiClient } from '../../services/apiClient';

interface StockScreenerWorkspaceProps {
  initialStocks: StockQuote[];
  onSelectStock: (stock: StockQuote) => void;
  onToggleWatchlist?: (symbol: string) => void;
  isLiveProviderActive?: boolean;
}

const DEFAULT_CRITERIA: ScreenerFilterCriteria = {
  searchQuery: '',
  exchange: 'ALL',
  sector: 'ALL',
  minPrice: undefined,
  maxPrice: undefined,
  minChangePercent: undefined,
  maxChangePercent: undefined,
  minVolume: undefined,
  minMarketCap: undefined,
  maxMarketCap: undefined,
};

const DEFAULT_SORT: ScreenerSortCriteria = {
  field: 'marketCap',
  order: 'desc',
};

export function StockScreenerWorkspace({
  initialStocks,
  onSelectStock,
  onToggleWatchlist,
  isLiveProviderActive,
}: StockScreenerWorkspaceProps) {
  // Convert StockQuote[] to ScreenerStockItem[]
  const [screenerUniverse, setScreenerUniverse] = useState<ScreenerStockItem[]>(() => {
    return initialStocks.map((s) => ({
      ...s,
      exchange: s.symbol === 'AAPL' || s.symbol === 'MSFT' || s.symbol === 'NVDA' || s.symbol === 'AMZN' || s.symbol === 'GOOGL' || s.symbol === 'TSLA' ? 'NASDAQ' : 'NYSE',
      currency: 'USD',
      provider: s.dataStatus === 'LIVE' || s.dataStatus === 'CACHED' ? 'finnhub' : 'simulated',
    }));
  });

  const [criteria, setCriteria] = useState<ScreenerFilterCriteria>(DEFAULT_CRITERIA);
  const [sort, setSort] = useState<ScreenerSortCriteria>(DEFAULT_SORT);
  const [comparedStocks, setComparedStocks] = useState<ScreenerStockItem[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [searchQueryInput, setSearchQueryInput] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync universe when parent stocks change
  useEffect(() => {
    setScreenerUniverse((prev) => {
      const existingMap = new Map(prev.map((item) => [item.symbol, item]));
      initialStocks.forEach((s) => {
        const existing = existingMap.get(s.symbol);
        existingMap.set(s.symbol, {
          ...s,
          exchange: existing?.exchange || (s.symbol === 'AAPL' || s.symbol === 'MSFT' || s.symbol === 'NVDA' ? 'NASDAQ' : 'NYSE'),
          currency: 'USD',
          provider: s.dataStatus === 'LIVE' || s.dataStatus === 'CACHED' ? 'finnhub' : 'simulated',
        });
      });
      return Array.from(existingMap.values());
    });
  }, [initialStocks]);

  // Extract distinct exchanges and sectors from current universe
  const availableExchanges = useMemo(() => {
    const set = new Set<string>();
    screenerUniverse.forEach((s) => {
      if (s.exchange && s.exchange !== 'US') set.add(s.exchange);
    });
    return Array.from(set).sort();
  }, [screenerUniverse]);

  const availableSectors = useMemo(() => {
    const set = new Set<string>();
    screenerUniverse.forEach((s) => {
      if (s.sector) set.add(s.sector);
    });
    return Array.from(set).sort();
  }, [screenerUniverse]);

  // Handle live search input & remote symbol discovery
  const handleSearchChange = (query: string) => {
    setSearchQueryInput(query);
    setCriteria((prev) => ({ ...prev, searchQuery: query }));

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    const clean = query.trim().toUpperCase();
    if (clean.length >= 2 && !screenerUniverse.some((s) => s.symbol === clean) && isLiveProviderActive) {
      searchTimerRef.current = setTimeout(async () => {
        setIsDiscovering(true);
        try {
          const profile = await marketApiClient.fetchProfile(clean);
          const quote = await marketApiClient.fetchQuote(clean);

          if (quote) {
            const newItem: ScreenerStockItem = {
              symbol: clean,
              companyName: profile?.name || clean,
              exchange: profile?.exchange || 'US',
              sector: profile?.finnhubIndustry || 'Equities',
              currency: profile?.currency || 'USD',
              price: quote.price,
              change: quote.change,
              changePercent: quote.changePercent,
              open: quote.open,
              dayHigh: quote.high,
              dayLow: quote.low,
              previousClose: quote.previousClose,
              volume: 0,
              marketCap: profile?.marketCapitalization ? profile.marketCapitalization * 1000000 : undefined,
              dataStatus: quote.dataStatus.toUpperCase() as import('../../types/stock').DataStatus,
              provider: 'finnhub',
              lastUpdated: quote.timestamp,
              isWatchlisted: false,
            };

            setScreenerUniverse((prev) => {
              if (prev.some((s) => s.symbol === clean)) return prev;
              return [newItem, ...prev];
            });
          }
        } catch {
          // Ignore discovery failures gracefully
        } finally {
          setIsDiscovering(false);
        }
      }, 500);
    }
  };

  // Sort change handler
  const handleSortChange = (field: ScreenerSortField) => {
    setSort((prev) => ({
      field,
      order: prev.field === field && prev.order === 'desc' ? 'asc' : 'desc',
    }));
  };

  // Add / remove to comparison
  const handleAddToCompare = (stock: ScreenerStockItem) => {
    if (comparedStocks.length >= 4) return;
    if (!comparedStocks.some((s) => s.symbol === stock.symbol)) {
      setComparedStocks((prev) => [...prev, stock]);
    }
  };

  const handleRemoveFromCompare = (symbol: string) => {
    setComparedStocks((prev) => prev.filter((s) => s.symbol !== symbol));
  };

  const handleClearCompare = () => {
    setComparedStocks([]);
  };

  // Map ScreenerStockItem back to StockQuote for detail modal
  const handleSelectRow = (item: ScreenerStockItem) => {
    const mapped: StockQuote = {
      symbol: item.symbol,
      companyName: item.companyName,
      price: item.price,
      change: item.change,
      changePercent: item.changePercent,
      open: item.open,
      dayHigh: item.dayHigh,
      dayLow: item.dayLow,
      previousClose: item.previousClose,
      volume: item.volume,
      marketCap: item.marketCap || 0,
      peRatio: item.peRatio,
      sector: item.sector,
      dataStatus: item.dataStatus,
      lastUpdated: item.lastUpdated,
      isWatchlisted: item.isWatchlisted,
    };
    onSelectStock(mapped);
  };

  // Filter and sort current universe
  const filteredAndSorted = useMemo(() => {
    const filtered = filterScreenerStocks(screenerUniverse, criteria);
    return sortScreenerStocks(filtered, sort);
  }, [screenerUniverse, criteria, sort]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-brand-emerald" />
            <span>Explore Stocks & Multi-Exchange Screener</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Filter, screen, and compare verified equities across NASDAQ, NYSE, and major US venues
          </p>
        </div>

        {/* Search & Discovery Bar */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by symbol, company, or discover new..."
              value={searchQueryInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-emerald/20"
            />
            {isDiscovering && (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-emerald" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Workspace (rendered when items are selected) */}
      {comparedStocks.length > 0 && (
        <StockComparisonView
          comparedStocks={comparedStocks}
          onRemove={handleRemoveFromCompare}
          onClear={handleClearCompare}
          onSelectStock={handleSelectRow}
        />
      )}

      {/* Filter Controls Panel */}
      <ScreenerFilterPanel
        criteria={criteria}
        onChange={setCriteria}
        onReset={() => {
          setCriteria(DEFAULT_CRITERIA);
          setSearchQueryInput('');
        }}
        availableExchanges={availableExchanges}
        availableSectors={availableSectors}
        resultsCount={filteredAndSorted.length}
        totalCount={screenerUniverse.length}
      />

      {/* Screener Results Table */}
      <ScreenerTable
        stocks={filteredAndSorted}
        sort={sort}
        onSortChange={handleSortChange}
        onSelectStock={handleSelectRow}
        onToggleWatchlist={onToggleWatchlist}
        onAddToCompare={handleAddToCompare}
        comparedSymbols={comparedStocks.map((s) => s.symbol)}
      />
    </div>
  );
}
