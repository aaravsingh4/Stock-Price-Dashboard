import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { StockQuote } from '../../types/stock';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatCurrency, formatPercent, formatVolume } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface MarketMoversProps {
  stocks: StockQuote[];
  onSelectStock?: (stock: StockQuote) => void;
  className?: string;
}

type MoverCategory = 'gainers' | 'losers' | 'volume';

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

export function MarketMovers({ stocks, onSelectStock, className }: MarketMoversProps) {
  const [activeTab, setActiveTab] = useState<MoverCategory>('gainers');

  // Top gainers: sorted by changePercent descending
  const topGainers = useMemo(() => {
    return [...stocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 4);
  }, [stocks]);

  // Top losers: sorted by changePercent ascending
  const topLosers = useMemo(() => {
    return [...stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 4);
  }, [stocks]);

  // Most active by volume: sorted by volume descending
  const mostActive = useMemo(() => {
    return [...stocks].sort((a, b) => b.volume - a.volume).slice(0, 4);
  }, [stocks]);

  const activeStocks = useMemo(() => {
    switch (activeTab) {
      case 'gainers':
        return topGainers;
      case 'losers':
        return topLosers;
      case 'volume':
        return mostActive;
    }
  }, [activeTab, topGainers, topLosers, mostActive]);

  const categories = [
    {
      id: 'gainers' as MoverCategory,
      label: 'Top Gainers',
      icon: TrendingUp,
      badgeColor: 'text-market-up',
    },
    {
      id: 'losers' as MoverCategory,
      label: 'Top Losers',
      icon: TrendingDown,
      badgeColor: 'text-market-down',
    },
    {
      id: 'volume' as MoverCategory,
      label: 'Most Active',
      icon: Activity,
      badgeColor: 'text-blue-500',
    },
  ];

  return (
    <Card className={cn('overflow-hidden border border-slate-200/70 dark:border-surface-darkBorder', className)}>
      <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5">
        <div>
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
            Market Movers
          </CardTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Key performers and highest volume velocity in today's session
          </p>
        </div>

        {/* Category Pills (Groww-style) */}
        <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-900/80 p-1 rounded-xl">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all select-none',
                  isSelected
                    ? 'bg-white dark:bg-surface-darkCard text-slate-900 dark:text-white shadow-subtle'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                <Icon className={cn('w-3.5 h-3.5', cat.badgeColor)} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {activeStocks.map((stock) => {
            const isUp = stock.change >= 0;
            const palette = COMPANY_PALETTES[stock.symbol] || {
              bg: 'bg-slate-100 dark:bg-slate-800',
              text: 'text-slate-700 dark:text-slate-300',
            };

            return (
              <div
                key={stock.symbol}
                onClick={() => onSelectStock?.(stock)}
                className="p-3.5 rounded-xl border border-slate-200/70 dark:border-surface-darkBorder bg-slate-50/50 hover:bg-white dark:bg-surface-darkCard/50 dark:hover:bg-surface-darkCard hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-subtle transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 border border-slate-200/60 dark:border-surface-darkBorder',
                        palette.bg,
                        palette.text
                      )}
                    >
                      {stock.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors">
                        {stock.symbol}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[90px]">
                        {stock.sector}
                      </div>
                    </div>
                  </div>

                  <span
                    className={cn(
                      'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-bold tabular-nums',
                      isUp
                        ? 'text-market-up bg-market-upBg dark:bg-market-upDarkBg dark:text-market-upDark'
                        : 'text-market-down bg-market-downBg dark:bg-market-downDarkBg dark:text-market-downDark'
                    )}
                  >
                    {isUp ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {formatPercent(stock.changePercent)}
                  </span>
                </div>

                <div className="flex items-baseline justify-between mt-3 pt-2 border-t border-slate-100 dark:border-surface-darkBorder/60">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(stock.price)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                    Vol: {formatVolume(stock.volume)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
