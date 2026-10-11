import { MarketIndex } from '../../types/stock';
import { Card } from '../ui/Card';
import { TrendBadge } from '../ui/Badge';
import { formatPercent } from '../../utils/formatters';

interface MarketOverviewProps {
  indices: MarketIndex[];
}

export function MarketOverview({ indices }: MarketOverviewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {indices.map((index) => {
        const isUp = index.change >= 0;
        return (
          <Card key={index.symbol} className="p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
                {index.symbol}
              </span>
              <TrendBadge value={index.changePercent} formattedText={formatPercent(index.changePercent)} />
            </div>

            <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
              {index.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            <div className="mt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="truncate max-w-[120px]">{index.name}</span>
              <span className={`font-medium tabular-nums ${isUp ? 'text-market-up dark:text-emerald-400' : 'text-market-down dark:text-rose-400'}`}>
                {isUp ? `+${index.change.toFixed(2)}` : index.change.toFixed(2)}
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
