import { Info, Wifi } from 'lucide-react';
import { DataStatusBadge } from '../ui/Badge';

interface SimulationNoticeProps {
  isLiveProviderActive?: boolean;
}

export function SimulationNotice({ isLiveProviderActive = false }: SimulationNoticeProps) {
  if (isLiveProviderActive) {
    return (
      <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-emerald-900 dark:text-emerald-200">
          <Wifi className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            <strong className="font-semibold">Provider Gateway Active:</strong> Real-time and cached market data is streaming through Finnhub API. Unqueried benchmarks or secondary assets remain in explicit simulated mode.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <DataStatusBadge status="LIVE" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/40 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2.5 text-indigo-900 dark:text-indigo-200">
        <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span>
          <strong className="font-semibold">Developer Notice:</strong> Market data is currently operating in{' '}
          <span className="font-mono font-medium">SIMULATED</span> mode. Configure <span className="font-mono font-medium">FINNHUB_API_KEY</span> in local <span className="font-mono font-medium">.env</span> to stream live quotes.
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <DataStatusBadge status="SIMULATED" />
      </div>
    </div>
  );
}
