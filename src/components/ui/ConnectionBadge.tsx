import { ConnectionStatus } from '../../services/marketStreamClient';
import { cn } from '../../utils/cn';

interface ConnectionBadgeProps {
  status: ConnectionStatus;
  className?: string;
}

export function ConnectionBadge({ status, className }: ConnectionBadgeProps) {
  const configs: Record<ConnectionStatus, { bg: string; text: string; dot: string; label: string }> = {
    connected: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50',
      text: 'text-emerald-700 dark:text-emerald-400',
      dot: 'bg-emerald-500 animate-ping',
      label: 'Stream Live',
    },
    connecting: {
      bg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/50',
      text: 'text-sky-700 dark:text-sky-400',
      dot: 'bg-sky-500 animate-pulse',
      label: 'Connecting...',
    },
    reconnecting: {
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50',
      text: 'text-amber-700 dark:text-amber-400',
      dot: 'bg-amber-500 animate-pulse',
      label: 'Reconnecting',
    },
    disconnected: {
      bg: 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700',
      text: 'text-slate-600 dark:text-slate-400',
      dot: 'bg-slate-400',
      label: 'Disconnected',
    },
    unavailable: {
      bg: 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700',
      text: 'text-slate-600 dark:text-slate-400',
      dot: 'bg-slate-400',
      label: 'Stream Unavailable',
    },
    demo: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/50',
      text: 'text-indigo-700 dark:text-indigo-300',
      dot: 'bg-indigo-500',
      label: 'Demo Mode',
    },
  };

  const current = configs[status] || configs.disconnected;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors',
        current.bg,
        current.text,
        className
      )}
      title={`Market Data Gateway: ${current.label}`}
    >
      <span className="relative flex h-2 w-2">
        <span className={cn('absolute inline-flex h-full w-full rounded-full opacity-75', current.dot)} />
        <span className={cn('relative inline-flex rounded-full h-2 w-2', current.dot.split(' ')[0])} />
      </span>
      <span>{current.label}</span>
    </div>
  );
}
