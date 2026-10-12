import { X, ExternalLink, ArrowRightLeft, ShieldCheck } from 'lucide-react';
import { ScreenerStockItem } from '../../types/screener';
import { formatCurrency, formatMarketCap, formatPercent, formatVolume } from '../../utils/formatters';
import { TrendBadge, DataStatusBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

interface StockComparisonViewProps {
  comparedStocks: ScreenerStockItem[];
  onRemove: (symbol: string) => void;
  onClear: () => void;
  onSelectStock: (stock: ScreenerStockItem) => void;
  onToggleWatchlist?: (symbol: string) => void;
}

export function StockComparisonView({
  comparedStocks,
  onRemove,
  onClear,
  onSelectStock,
}: StockComparisonViewProps) {
  if (comparedStocks.length === 0) return null;

  return (
    <Card className="border border-brand-emerald/30 shadow-card">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-surface-darkBorder flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-brand-emerald" />
          <CardTitle className="text-sm font-bold">
            Securities Comparison Matrix ({comparedStocks.length} of 4)
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-xs h-7 px-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            Clear Comparison
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-surface-darkBorder bg-slate-50/50 dark:bg-slate-900/30 text-[11px] font-semibold text-slate-400 uppercase">
              <th className="py-2.5 px-4 w-40">Metric</th>
              {comparedStocks.map((stock) => (
                <th key={stock.symbol} className="py-2.5 px-4 min-w-[150px]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white font-mono text-xs">
                        {stock.symbol}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate max-w-[110px]">
                        {stock.companyName}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(stock.symbol)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-500"
                      title="Remove from comparison"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-surface-darkBorder/60">
            {/* Price */}
            <tr>
              <td className="py-2.5 px-4 font-semibold text-slate-500 dark:text-slate-400">
                Last Price
              </td>
              {comparedStocks.map((stock) => (
                <td key={stock.symbol} className="py-2.5 px-4 font-bold text-slate-900 dark:text-white tabular-nums">
                  {formatCurrency(stock.price)}
                </td>
              ))}
            </tr>

            {/* Daily % Change */}
            <tr>
              <td className="py-2.5 px-4 font-semibold text-slate-500 dark:text-slate-400">
                24h Change
              </td>
              {comparedStocks.map((stock) => (
                <td key={stock.symbol} className="py-2.5 px-4">
                  <TrendBadge
                    value={stock.changePercent}
                    formattedText={formatPercent(stock.changePercent)}
                  />
                </td>
              ))}
            </tr>

            {/* Exchange */}
            <tr>
              <td className="py-2.5 px-4 font-semibold text-slate-500 dark:text-slate-400">
                Exchange
              </td>
              {comparedStocks.map((stock) => (
                <td key={stock.symbol} className="py-2.5 px-4 font-mono">
                  {stock.exchange}
                </td>
              ))}
            </tr>

            {/* Sector */}
            <tr>
              <td className="py-2.5 px-4 font-semibold text-slate-500 dark:text-slate-400">
                Sector / Industry
              </td>
              {comparedStocks.map((stock) => (
                <td key={stock.symbol} className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                  {stock.sector}
                </td>
              ))}
            </tr>

            {/* Volume */}
            <tr>
              <td className="py-2.5 px-4 font-semibold text-slate-500 dark:text-slate-400">
                Trading Volume
              </td>
              {comparedStocks.map((stock) => (
                <td key={stock.symbol} className="py-2.5 px-4 font-mono tabular-nums">
                  {stock.volume > 0 ? formatVolume(stock.volume) : 'N/A'}
                </td>
              ))}
            </tr>

            {/* Market Cap */}
            <tr>
              <td className="py-2.5 px-4 font-semibold text-slate-500 dark:text-slate-400">
                Market Cap
              </td>
              {comparedStocks.map((stock) => (
                <td key={stock.symbol} className="py-2.5 px-4 font-mono tabular-nums">
                  {typeof stock.marketCap === 'number' ? formatMarketCap(stock.marketCap) : 'N/A'}
                </td>
              ))}
            </tr>

            {/* Day High / Low */}
            <tr>
              <td className="py-2.5 px-4 font-semibold text-slate-500 dark:text-slate-400">
                Day Range
              </td>
              {comparedStocks.map((stock) => (
                <td key={stock.symbol} className="py-2.5 px-4 tabular-nums text-slate-600 dark:text-slate-400">
                  {formatCurrency(stock.dayLow)} - {formatCurrency(stock.dayHigh)}
                </td>
              ))}
            </tr>

            {/* Data Provenance Status */}
            <tr>
              <td className="py-2.5 px-4 font-semibold text-slate-500 dark:text-slate-400">
                Data Status
              </td>
              {comparedStocks.map((stock) => (
                <td key={stock.symbol} className="py-2.5 px-4">
                  <DataStatusBadge status={stock.dataStatus} />
                </td>
              ))}
            </tr>

            {/* Action Row */}
            <tr>
              <td className="py-2.5 px-4 font-semibold text-slate-500 dark:text-slate-400">
                Action
              </td>
              {comparedStocks.map((stock) => (
                <td key={stock.symbol} className="py-2.5 px-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectStock(stock)}
                    className="text-xs h-7 gap-1"
                  >
                    <span>View Detail</span>
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* Disclaimer footer */}
        <div className="p-3 bg-slate-50/60 dark:bg-slate-900/40 border-t border-slate-100 dark:border-surface-darkBorder/60 flex items-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-emerald shrink-0" />
          <span>Comparison reflects verified real-time & cached provider metrics. Missing fields are preserved as N/A without synthetic substitution.</span>
        </div>
      </CardContent>
    </Card>
  );
}
