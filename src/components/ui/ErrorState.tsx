import { AlertCircle, RotateCcw } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Failed to load market data',
  message = 'An unexpected error occurred while communicating with the price provider feed. Please verify your network connection.',
  onRetry,
}: ErrorStateProps) {
  return (
    <Card className="p-8 border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-rose-900 dark:text-rose-200">{title}</h4>
      <p className="text-xs text-rose-700/80 dark:text-rose-400/80 mt-1 max-w-md mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100/50">
          <RotateCcw className="w-3.5 h-3.5" />
          Retry Connection
        </Button>
      )}
    </Card>
  );
}
