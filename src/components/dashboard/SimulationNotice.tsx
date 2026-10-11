import { Info } from 'lucide-react';
import { DataStatusBadge } from '../ui/Badge';

export function SimulationNotice() {
  return (
    <div className="bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/40 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2.5 text-indigo-900 dark:text-indigo-200">
        <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span>
          <strong className="font-semibold">Developer Notice:</strong> Market data is currently operating in{' '}
          <span className="font-mono font-medium">SIMULATED</span> mode for initial foundation testing. External provider feeds (Finnhub / Alpha Vantage) are planned for Phase 3.
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <DataStatusBadge status="SIMULATED" />
      </div>
    </div>
  );
}
