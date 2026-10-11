import { useState, useMemo } from 'react';
import { Search, Star, ArrowUpDown } from 'lucide-react';
import { StockQuote } from '../../types/stock';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { TrendBadge, DataStatusBadge } from '../ui/Badge';
import { formatCurrency, formatMarketCap, formatPercent, formatVolume } from '../../utils/formatters';
import { EmptyState } from '../ui/EmptyState';

interface StockTableProps {
  stocks: StockQuote[];
  onToggleWatchlist?: (symbol: string) => void;
  onSelectStock?: (stock: StockQuote) => void;
}

export function StockTable({ stocks, onToggleWatchlist, onSelectStock }: StockTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [sortField, setSortField] = useState<keyof StockQuote>('marketCap');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Extract distinct sectors
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
    <Card className="overflow-hidden">
      <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <CardTitle>Market Watchlist & Equities</CardTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time equity quotes with institutional metric breakdowns
          </p>
        </div>

        {/* Filter toolbar */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ticker or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-48 pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>

          {/* Sector Filter */}
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            {sectors.map((sector) => (
              <option key={sector} value={sector}>
                {sector === 'ALL' ? 'All Sectors' : sector}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filteredStocks.length === 0 ? (
          <EmptyState
            title="No securities found"
            description={`No stock results match the search "${searchQuery}" in the selected sector.`}
            actionLabel="Reset Filters"
            onAction={() => {
              setSearchQuery('');
              setSelectedSector('ALL');
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-surface-darkBorder uppercase font-semibold text-[11px] text-slate-500 dark:text-slate-400 tracking-wider">
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
                      Ticker / Company
                      <ArrowUpDown className="w-3 h-3" />
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
                      Price
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 select-none"
                    onClick={() => handleSort('changePercent')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      24h Change
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="hidden lg:table-cell px-4 py-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 select-none"
                    onClick={() => handleSort('volume')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      Volume
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="hidden sm:table-cell px-4 py-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 select-none"
                    onClick={() => handleSort('marketCap')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      Market Cap
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th scope="col" className="hidden xl:table-cell px-4 py-3 text-center">
                    Feed Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-surface-darkBorder/60">
                {filteredStocks.map((stock) => {
                  const isUp = stock.change >= 0;
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
                          className="text-slate-300 hover:text-amber-500 dark:text-slate-600 dark:hover:text-amber-400 transition-colors"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              stock.isWatchlisted ? 'fill-amber-400 text-amber-400' : ''
                            }`}
                          />
                        </button>
                      </td>

                      {/* Ticker & Name */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                          {stock.symbol}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px] truncate max-w-[140px] sm:max-w-xs">
                          {stock.companyName}
                        </div>
                      </td>

                      {/* Sector */}
                      <td className="hidden md:table-cell px-4 py-3.5">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {stock.sector}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3.5 text-right font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
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
                            className={`text-[11px] font-medium tabular-nums mt-0.5 ${
                              isUp ? 'text-market-up dark:text-emerald-400' : 'text-market-down dark:text-rose-400'
                            }`}
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
