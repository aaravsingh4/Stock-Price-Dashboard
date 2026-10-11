import { useState } from 'react';
import { X, Star, ShieldCheck } from 'lucide-react';
import { StockQuote, TimeRange } from '../../types/stock';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { TrendBadge, DataStatusBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { StockChart } from './StockChart';
import {
  formatCurrency,
  formatMarketCap,
  formatPercent,
  formatVolume,
} from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface StockDetailModalProps {
  stock: StockQuote;
  onClose: () => void;
  onToggleWatchlist?: (symbol: string) => void;
}

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

export function StockDetailModal({
  stock,
  onClose,
  onToggleWatchlist,
}: StockDetailModalProps) {
  const [modalTimeRange, setModalTimeRange] = useState<TimeRange>('1M');

  const palette = COMPANY_PALETTES[stock.symbol] || {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
  };

  const isUp = stock.change >= 0;

  // Calculate day range progress
  const dayRangeSpread = stock.dayHigh - stock.dayLow;
  const currentSpread = stock.price - stock.dayLow;
  const rangePercent = dayRangeSpread > 0 ? Math.min(100, Math.max(0, (currentSpread / dayRangeSpread) * 100)) : 50;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${stock.companyName} details`}
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-2xl bg-white dark:bg-surface-darkCard border border-slate-200 dark:border-surface-darkBorder rounded-2xl shadow-dropdown overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <CardHeader className="p-5 border-b border-slate-100 dark:border-surface-darkBorder shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border border-slate-200/60 dark:border-surface-darkBorder',
                  palette.bg,
                  palette.text
                )}
              >
                {stock.symbol.slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                    {stock.symbol}
                  </CardTitle>
                  <DataStatusBadge status={stock.dataStatus} />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {stock.companyName} • <span className="font-medium">{stock.sector}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {onToggleWatchlist && (
                <button
                  type="button"
                  onClick={() => onToggleWatchlist(stock.symbol)}
                  aria-label={`Toggle watchlist for ${stock.symbol}`}
                  className="p-2 rounded-xl text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Star
                    className={cn(
                      'w-5 h-5',
                      stock.isWatchlisted ? 'fill-amber-400 text-amber-400' : ''
                    )}
                  />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </CardHeader>

        {/* Modal Scrollable Body */}
        <CardContent className="p-5 overflow-y-auto space-y-5">
          {/* Price Overview Banner */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-100 dark:border-surface-darkBorder">
            <div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                {formatCurrency(stock.price)}
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Previous Close: <span className="tabular-nums font-medium text-slate-600 dark:text-slate-300">{formatCurrency(stock.previousClose)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <TrendBadge
                value={stock.changePercent}
                formattedText={formatPercent(stock.changePercent)}
              />
              <span
                className={cn(
                  'text-xs font-semibold tabular-nums',
                  isUp ? 'text-market-up dark:text-market-upDark' : 'text-market-down dark:text-market-downDark'
                )}
              >
                {isUp ? `+${stock.change.toFixed(2)}` : stock.change.toFixed(2)} (1D)
              </span>
            </div>
          </div>

          {/* Embedded Historical Chart */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Performance Trend
            </h4>
            <StockChart
              stock={stock}
              timeRange={modalTimeRange}
              onTimeRangeChange={setModalTimeRange}
              onToggleWatchlist={onToggleWatchlist}
              className="shadow-none"
            />
          </div>

          {/* Visual Day Range Progress Bar (FinTech hallmark) */}
          <div className="p-4 rounded-xl border border-slate-100 dark:border-surface-darkBorder bg-slate-50/40 dark:bg-slate-900/40 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Day's Low: <strong className="font-mono text-slate-800 dark:text-slate-200">{formatCurrency(stock.dayLow)}</strong></span>
              <span>Day's High: <strong className="font-mono text-slate-800 dark:text-slate-200">{formatCurrency(stock.dayHigh)}</strong></span>
            </div>
            <div className="relative w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-market-up to-brand-emerald rounded-full"
                style={{ width: `${rangePercent}%` }}
              />
            </div>
            <div className="text-[11px] text-right text-slate-400">
              Current position: {rangePercent.toFixed(0)}% of daily range
            </div>
          </div>

          {/* Fundamental Metrics Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
              Market Fundamentals
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-100 dark:border-surface-darkBorder">
                <span className="text-slate-400 dark:text-slate-500 text-[11px]">Open Price</span>
                <div className="font-bold text-slate-800 dark:text-slate-200 tabular-nums mt-0.5">
                  {formatCurrency(stock.open)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-100 dark:border-surface-darkBorder">
                <span className="text-slate-400 dark:text-slate-500 text-[11px]">Trading Volume</span>
                <div className="font-bold text-slate-800 dark:text-slate-200 font-mono tabular-nums mt-0.5">
                  {formatVolume(stock.volume)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-100 dark:border-surface-darkBorder">
                <span className="text-slate-400 dark:text-slate-500 text-[11px]">Market Cap</span>
                <div className="font-bold text-slate-800 dark:text-slate-200 font-mono tabular-nums mt-0.5">
                  {formatMarketCap(stock.marketCap)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-100 dark:border-surface-darkBorder">
                <span className="text-slate-400 dark:text-slate-500 text-[11px]">P/E Ratio</span>
                <div className="font-bold text-slate-800 dark:text-slate-200 tabular-nums mt-0.5">
                  {stock.peRatio ?? 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Model Compliance Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-surface-darkBorder/60 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-emerald" />
              <span>Simulated baseline model parameters</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={stock.isWatchlisted ? 'outline' : 'primary'}
                size="sm"
                onClick={() => onToggleWatchlist?.(stock.symbol)}
                className="text-xs"
              >
                {stock.isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
