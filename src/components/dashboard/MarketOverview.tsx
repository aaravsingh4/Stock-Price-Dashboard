import { MarketIndex } from '../../types/stock';
import { Card } from '../ui/Card';
import { TrendBadge } from '../ui/Badge';
import { formatPercent } from '../../utils/formatters';

interface MarketOverviewProps {
  indices: MarketIndex[];
}

export function MarketOverview({ indices }: MarketOverviewProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Market Benchmarks
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time equity indices and benchmark indicators
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse" />
          <span>Simulated Feed</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {indices.map((index) => {
          const isUp = index.change >= 0;
          return (
            <Card
              key={index.symbol}
              className="p-4 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-card transition-all cursor-default group"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white tracking-wide">
                    {index.symbol}
                  </span>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                    {index.name}
                  </div>
                </div>
                <TrendBadge
                  value={index.changePercent}
                  formattedText={formatPercent(index.changePercent)}
                />
              </div>

              <div className="flex items-baseline justify-between mt-2">
                <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
                  {index.value.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>

                {/* Subtle Mini Sparkline SVG curve */}
                <div className="w-16 h-7 flex items-center justify-end">
                  <svg
                    viewBox="0 0 60 24"
                    className={`w-full h-full stroke-2 fill-none ${
                      isUp ? 'text-market-up stroke-current' : 'text-market-down stroke-current'
                    }`}
                  >
                    {isUp ? (
                      <path
                        d="M 2 20 Q 15 18, 25 12 T 45 8 T 58 4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ) : (
                      <path
                        d="M 2 4 Q 15 8, 25 14 T 45 18 T 58 20"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                  </svg>
                </div>
              </div>

              <div className="mt-1 flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-surface-darkBorder/60">
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  Day Change
                </span>
                <span
                  className={`font-semibold text-xs tabular-nums ${
                    isUp ? 'text-market-up dark:text-market-upDark' : 'text-market-down dark:text-market-downDark'
                  }`}
                >
                  {isUp ? `+${index.change.toFixed(2)}` : index.change.toFixed(2)}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
