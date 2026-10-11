import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { DataStatus } from '../../types/stock';
import { cn } from '../../utils/cn';

interface DataStatusBadgeProps {
  status: DataStatus;
  className?: string;
}

export function DataStatusBadge({ status, className }: DataStatusBadgeProps) {
  const styles: Record<DataStatus, { bg: string; text: string; dot: string; label: string }> = {
    LIVE: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50',
      text: 'text-emerald-700 dark:text-emerald-400',
      dot: 'bg-emerald-500 animate-pulse',
      label: 'LIVE FEED',
    },
    DELAYED: {
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50',
      text: 'text-amber-700 dark:text-amber-400',
      dot: 'bg-amber-500',
      label: 'DELAYED 15M',
    },
    CACHED: {
      bg: 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700',
      text: 'text-slate-600 dark:text-slate-300',
      dot: 'bg-slate-400',
      label: 'CACHED',
    },
    SIMULATED: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/50',
      text: 'text-indigo-700 dark:text-indigo-300',
      dot: 'bg-indigo-500',
      label: 'SIMULATED',
    },
    ERROR: {
      bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50',
      text: 'text-rose-700 dark:text-rose-400',
      dot: 'bg-rose-500',
      label: 'FEED OFFLINE',
    },
  };

  const current = styles[status] || styles.SIMULATED;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase border',
        current.bg,
        current.text,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', current.dot)} />
      {current.label}
    </span>
  );
}

interface TrendBadgeProps {
  value: number;
  formattedText?: string;
  className?: string;
}

export function TrendBadge({ value, formattedText, className }: TrendBadgeProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;

  if (isPositive) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-semibold tabular-nums text-market-up bg-market-upBg dark:bg-market-upDarkBg dark:text-emerald-400',
          className
        )}
      >
        <ArrowUpRight className="w-3.5 h-3.5" />
        {formattedText || `+${value.toFixed(2)}%`}
      </span>
    );
  }

  if (isNegative) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-semibold tabular-nums text-market-down bg-market-downBg dark:bg-market-downDarkBg dark:text-rose-400',
          className
        )}
      >
        <ArrowDownRight className="w-3.5 h-3.5" />
        {formattedText || `${value.toFixed(2)}%`}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-medium tabular-nums text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400',
        className
      )}
    >
      <Minus className="w-3 h-3" />
      {formattedText || `0.00%`}
    </span>
  );
}
