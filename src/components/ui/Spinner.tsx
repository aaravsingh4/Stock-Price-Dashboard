import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export function Spinner({ size = 'md', className, label = 'Loading...' }: SpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div role="status" className="inline-flex items-center gap-2">
      <Loader2 className={cn('animate-spin text-brand-600 dark:text-brand-500', sizes[size], className)} />
      <span className="sr-only">{label}</span>
    </div>
  );
}
