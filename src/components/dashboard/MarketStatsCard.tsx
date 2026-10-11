import { Activity, Clock, Flame, PieChart } from 'lucide-react';
import { MarketOverviewStats } from '../../types/stock';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatVolume } from '../../utils/formatters';

interface MarketStatsCardProps {
  stats: MarketOverviewStats;
}

export function MarketStatsCard({ stats }: MarketStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Intelligence & Health</CardTitle>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {stats.isMarketOpen && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${stats.isMarketOpen ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
          </span>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {stats.isMarketOpen ? 'Market Open' : 'Market Closed'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Active Session</span>
          </div>
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
            {stats.marketSession}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Activity className="w-3.5 h-3.5" />
            <span>Total Volume</span>
          </div>
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 tabular-nums">
            {formatVolume(stats.totalMarketVolume)}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <PieChart className="w-3.5 h-3.5" />
            <span>Market Breadth</span>
          </div>
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 tabular-nums">
            <span className="text-market-up dark:text-emerald-400 font-bold">{stats.activeGainersCount} Up</span>
            {' / '}
            <span className="text-market-down dark:text-rose-400 font-bold">{stats.activeLosersCount} Down</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Flame className="w-3.5 h-3.5" />
            <span>Sentiment</span>
          </div>
          <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            {stats.marketSentiment}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
