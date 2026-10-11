import { useState, useMemo } from 'react';
import { Search, Star, ArrowUpDown, X } from 'lucide-react';
import { StockQuote } from '../../types/stock';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { TrendBadge, DataStatusBadge } from '../ui/Badge';
import { formatCurrency, formatMarketCap, formatPercent, formatVolume } from '../../utils/formatters';
import { EmptyState } from '../ui/EmptyState';
import { cn } from '../../utils/cn';

interface StockTableProps {
  stocks: StockQuote[];
  onToggleWatchlist?: (symbol: string) => void;
  onSelectStock?: (stock: StockQuote) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

// Company avatar brand color palette
const COMPANY_PALETTES: Record<string, { bg: string; text: string }> = {
  AAPL: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-800 dark:text-slate-200' },
  MSFT: { bg: 'bg-blue-50 dark:bg-blue-950/60', text: 'text-blue-600 dark:text-blue-400' },
  NVDA: { bg: 'bg-emerald-50 dark:bg-emerald-950/60', text: 'text-emerald-600 dark:text-emerald-400' },
  AMZN: { bg: 'bg-amber-50 dark:bg-amber-950/60', text: 'text-amber-600 dark:text-amber-400' },
  GOOGL: { bg: 'bg-rose-50 dark:bg-rose-950/60', text: 'text-rose-600 dark:text-rose-400' },
  TSLA: { bg: 'bg-red-50 dark:bg-red-950/60', text: 'text-red-600 dark:text-red-400' },
  JPM: { bg: 'bg-indigo-50 dark:bg-indigo-950/60', text: 'text-indigo-600 dark:text-indigo-400' },
  LLY: { bg: 'bg-teal-50 dark:bg-teal-950/60', text: 'text-teal-600 dark:text-teal-400' },
};

export function StockTable({
  stocks,
  onToggleWatchlist,
  onSelectStock,
  searchQuery: externalSearchQuery,
  onSearchChange: externalOnSearchChange,
}: StockTableProps) {
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [sortField, setSortField] = useState<keyof StockQuote>('marketCap');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Synchronized search query
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const handleSearchChange = (val: string) => {
    if (externalOnSearchChange) {
      externalOnSearchChange(val);
    } else {
      setInternalSearchQuery(val);
    }
  };

  // Distinct sectors
  const sectors = useMemo(() => {
    const list = Array.from(new Set(stocks.map((s) => s.sector)));
    return ['ALL', ...list];
  }, [stocks]);

  // Filter & sort logic
  const filteredStocks = useMemo(() => {
    return stocks
      .filter((stock) => {
        const matchesSearch =
          stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stock.companyName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSector = selectedSector === 'ALL' || stock.sector === selectedSector;
        return matchesSearch && matchesSector;
      })
      .sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortAsc ? aVal - bVal : bVal - aVal;
        }
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        return 0;
      });
  }, [stocks, searchQuery, selectedSector, sortField, sortAsc]);

  const handleSort = (field: keyof StockQuote) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <Card className="overflow-hidden border border-slate-200/70 dark:border-surface-darkBorder">
      <CardHeader className="flex-col items-start gap-4 p-5 sm:p-6">
        <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
              Equities & Watchlist
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Explore market leaders, volume drivers, and fundamental valuation metrics
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by ticker or name..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50/80 dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                aria-label="Clear table search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Groww-style Horizontal Scrolling Sector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full pt-1">
          {sectors.map((sector) => {
            const isSelected = selectedSector === sector;
            return (
              <button
                key={sector}
                type="button"
                onClick={() => setSelectedSector(sector)}
                className={cn(
                  'px-3 py-1 text-xs rounded-full font-medium whitespace-nowrap transition-all select-none',
                  isSelected
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold shadow-subtle'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600 dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-slate-300'
                )}
              >
                {sector === 'ALL' ? 'All Sectors' : sector}
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filteredStocks.length === 0 ? (
          <EmptyState
            title="No equities matched"
            description={`No stock results match the search "${searchQuery}" in the selected sector.`}
            actionLabel="Reset Filters"
            onAction={() => {
              handleSearchChange('');
              setSelectedSector('ALL');
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50/70 dark:bg-slate-900/60 border-y border-slate-100 dark:border-surface-darkBorder font-semibold text-[11px] text-slate-500 dark:text-slate-400">
                <tr>
                  <th scope="col" className="w-10 px-4 py-3 text-center">
                    <span className="sr-only">Watchlist</span>
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 select-none"
                    onClick={() => handleSort('symbol')}
                  >
                    <div className="flex items-center gap-1.5">
                      Company
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th scope="col" className="hidden md:table-cell px-4 py-3">
                    Sector
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 select-none"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      Market Price
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 select-none"
                    onClick={() => handleSort('changePercent')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      Day Change
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="hidden lg:table-cell px-4 py-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 select-none"
                    onClick={() => handleSort('volume')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      Volume
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="hidden sm:table-cell px-4 py-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 select-none"
                    onClick={() => handleSort('marketCap')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      Market Cap
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th scope="col" className="hidden xl:table-cell px-4 py-3 text-center">
                    Data Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-surface-darkBorder/60">
                {filteredStocks.map((stock) => {
                  const isUp = stock.change >= 0;
                  const palette = COMPANY_PALETTES[stock.symbol] || {
                    bg: 'bg-slate-100 dark:bg-slate-800',
                    text: 'text-slate-700 dark:text-slate-300',
                  };

                  return (
                    <tr
                      key={stock.symbol}
                      onClick={() => onSelectStock?.(stock)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      {/* Watchlist Star Toggle */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleWatchlist?.(stock.symbol);
                          }}
                          aria-label={`Toggle watchlist for ${stock.symbol}`}
                          className="p-1 rounded-md text-slate-300 hover:text-amber-500 dark:text-slate-600 dark:hover:text-amber-400 transition-colors"
                        >
                          <Star
                            className={cn(
                              'w-4 h-4',
                              stock.isWatchlisted
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300 dark:text-slate-600'
                            )}
                          />
                        </button>
                      </td>

                      {/* Company with Avatar Initials */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 border border-slate-200/60 dark:border-surface-darkBorder',
                              palette.bg,
                              palette.text
                            )}
                          >
                            {stock.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors">
                              {stock.symbol}
                            </div>
                            <div className="text-slate-500 dark:text-slate-400 text-[11px] truncate max-w-[140px] sm:max-w-xs">
                              {stock.companyName}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Sector */}
                      <td className="hidden md:table-cell px-4 py-3.5">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {stock.sector}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3.5 text-right font-bold text-slate-900 dark:text-white tabular-nums text-sm">
                        {formatCurrency(stock.price)}
                      </td>

                      {/* 24h Change */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex flex-col items-end">
                          <TrendBadge
                            value={stock.changePercent}
                            formattedText={formatPercent(stock.changePercent)}
                          />
                          <span
                            className={cn(
                              'text-[11px] font-medium tabular-nums mt-0.5',
                              isUp
                                ? 'text-market-up dark:text-market-upDark'
                                : 'text-market-down dark:text-market-downDark'
                            )}
                          >
                            {isUp ? `+${stock.change.toFixed(2)}` : stock.change.toFixed(2)}
                          </span>
                        </div>
                      </td>

                      {/* Volume */}
                      <td className="hidden lg:table-cell px-4 py-3.5 text-right font-mono text-[11px] text-slate-600 dark:text-slate-400 tabular-nums">
                        {formatVolume(stock.volume)}
                      </td>

                      {/* Market Cap */}
                      <td className="hidden sm:table-cell px-4 py-3.5 text-right font-mono text-[11px] text-slate-700 dark:text-slate-300 tabular-nums font-medium">
                        {formatMarketCap(stock.marketCap)}
                      </td>

                      {/* Status */}
                      <td className="hidden xl:table-cell px-4 py-3.5 text-center">
                        <DataStatusBadge status={stock.dataStatus} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
