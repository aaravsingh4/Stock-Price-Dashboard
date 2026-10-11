import { Spinner } from './Spinner';
import { Card } from './Card';

interface LoadingStateProps {
  message?: string;
  subtext?: string;
}

export function LoadingState({
  message = 'Fetching market feed...',
  subtext = 'Synchronizing real-time price quotes and order flow',
}: LoadingStateProps) {
  return (
    <Card className="p-12 flex flex-col items-center justify-center text-center">
      <Spinner size="lg" className="mb-4" />
      <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100">{message}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{subtext}</p>
    </Card>
  );
}
