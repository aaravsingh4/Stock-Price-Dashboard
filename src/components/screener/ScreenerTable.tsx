import { Star, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Plus } from 'lucide-react';
import { ScreenerStockItem, ScreenerSortCriteria, ScreenerSortField } from '../../types/screener';
import { formatCurrency, formatMarketCap, formatPercent, formatVolume } from '../../utils/formatters';
import { TrendBadge, DataStatusBadge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface ScreenerTableProps {
  stocks: ScreenerStockItem[];
  sort: ScreenerSortCriteria;
  onSortChange: (field: ScreenerSortField) => void;
  onSelectStock: (stock: ScreenerStockItem) => void;
  onToggleWatchlist?: (symbol: string) => void;
  onAddToCompare?: (stock: ScreenerStockItem) => void;
  comparedSymbols: string[];
}

export function ScreenerTable({
  stocks,
  sort,
  onSortChange,
  onSelectStock,
  onToggleWatchlist,
  onAddToCompare,
  comparedSymbols,
}: ScreenerTableProps) {
  const renderSortIcon = (field: ScreenerSortField) => {
    if (sort.field !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sort.order === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-brand-emerald" />
    ) : (
      <ArrowDown className="w-3 h-3 text-brand-emerald" />
    );
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard shadow-card">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-200/80 dark:border-surface-darkBorder bg-slate-50/80 dark:bg-slate-900/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">
            <th className="py-3 px-4 w-10 text-center">Watch</th>
            <th
              onClick={() => onSortChange('symbol')}
              className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors group"
            >
              <div className="flex items-center gap-1.5">
                <span>Security</span>
                {renderSortIcon('symbol')}
              </div>
            </th>
            <th
              onClick={() => onSortChange('exchange')}
              className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors group hidden md:table-cell"
            >
              <div className="flex items-center gap-1.5">
                <span>Exchange</span>
                {renderSortIcon('exchange')}
              </div>
            </th>
            <th
              onClick={() => onSortChange('sector')}
              className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors group hidden lg:table-cell"
            >
              <div className="flex items-center gap-1.5">
                <span>Sector</span>
                {renderSortIcon('sector')}
              </div>
            </th>
            <th
              onClick={() => onSortChange('price')}
              className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors group"
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>Price</span>
                {renderSortIcon('price')}
              </div>
            </th>
            <th
              onClick={() => onSortChange('changePercent')}
              className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors group"
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>24h Change</span>
                {renderSortIcon('changePercent')}
              </div>
            </th>
            <th
              onClick={() => onSortChange('volume')}
              className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors group hidden sm:table-cell"
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>Volume</span>
                {renderSortIcon('volume')}
              </div>
            </th>
            <th
              onClick={() => onSortChange('marketCap')}
              className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors group hidden xl:table-cell"
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>Market Cap</span>
                {renderSortIcon('marketCap')}
              </div>
            </th>
            <th className="py-3 px-4 text-center">Status</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-surface-darkBorder/60">
          {stocks.length === 0 ? (
            <tr>
              <td colSpan={10} className="py-12 text-center text-slate-400 dark:text-slate-500">
                <p className="font-semibold text-sm">No matching securities found</p>
                <p className="text-xs mt-1">Try broadening your search term or adjusting filter thresholds.</p>
              </td>
            </tr>
          ) : (
            stocks.map((stock) => {
              const isCompared = comparedSymbols.includes(stock.symbol);
              return (
                <tr
                  key={stock.symbol}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Watchlist toggle */}
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleWatchlist?.(stock.symbol)}
                      aria-label={stock.isWatchlisted ? `Remove ${stock.symbol} from watchlist` : `Add ${stock.symbol} to watchlist`}
                      className="p-1 rounded-lg text-slate-400 hover:text-amber-500 transition-colors"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          stock.isWatchlisted ? 'fill-amber-400 text-amber-400' : ''
                        }`}
                      />
                    </button>
                  </td>

                  {/* Symbol & Name */}
                  <td
                    onClick={() => onSelectStock(stock)}
                    className="py-3 px-4 cursor-pointer"
                  >
                    <div className="font-bold text-slate-900 dark:text-white group-hover:text-brand-emerald transition-colors font-mono">
                      {stock.symbol}
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[160px] sm:max-w-xs">
                      {stock.companyName}
                    </div>
                  </td>

                  {/* Exchange */}
                  <td className="py-3 px-4 hidden md:table-cell">
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {stock.exchange}
                    </span>
                  </td>

                  {/* Sector */}
                  <td className="py-3 px-4 hidden lg:table-cell text-slate-600 dark:text-slate-400 text-[11px]">
                    {stock.sector}
                  </td>

                  {/* Price */}
                  <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(stock.price)}
                  </td>

                  {/* 24h Change */}
                  <td className="py-3 px-4 text-right">
                    <TrendBadge
                      value={stock.changePercent}
                      formattedText={formatPercent(stock.changePercent)}
                    />
                  </td>

                  {/* Volume */}
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400 hidden sm:table-cell">
                    {stock.volume > 0 ? formatVolume(stock.volume) : 'N/A'}
                  </td>

                  {/* Market Cap */}
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400 hidden xl:table-cell">
                    {typeof stock.marketCap === 'number' ? formatMarketCap(stock.marketCap) : 'N/A'}
                  </td>

                  {/* Data Status */}
                  <td className="py-3 px-4 text-center">
                    <DataStatusBadge status={stock.dataStatus} />
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant={isCompared ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => onAddToCompare?.(stock)}
                        disabled={isCompared || comparedSymbols.length >= 4}
                        title={isCompared ? 'Already in comparison' : comparedSymbols.length >= 4 ? 'Maximum 4 stocks can be compared' : 'Add to comparison'}
                        className="h-7 px-2 text-[11px]"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        <span>{isCompared ? 'Added' : 'Compare'}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectStock(stock)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        title="View details"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
