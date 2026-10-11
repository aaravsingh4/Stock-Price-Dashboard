import type { ReactNode } from 'react';
import { SearchX } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}

export function EmptyState({
  title = 'No assets found',
  description = 'No stocks match your active search filters or watchlist selections.',
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <Card className="p-12 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mb-4">
        {icon || <SearchX className="w-6 h-6" />}
      </div>
      <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Card>
  );
}
