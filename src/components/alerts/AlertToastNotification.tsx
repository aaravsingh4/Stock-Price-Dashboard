import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { TriggeredAlertEvent } from '../../types/alerts';
import { alertService } from '../../services/alertService';
import { formatCurrency } from '../../utils/formatters';

interface ToastItem {
  id: string;
  event: TriggeredAlertEvent;
}

export function AlertToastNotification() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsub = alertService.onTrigger((event) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      setToasts((prev) => [...prev, { id, event }]);

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== id));
      }, 6000);
    });

    return () => unsub();
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Price Alert Notifications"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map(({ id, event }) => {
        return (
          <div
            key={id}
            className="pointer-events-auto bg-white dark:bg-surface-darkCard border border-brand-emerald/40 shadow-dropdown rounded-xl p-3.5 flex items-start justify-between gap-3 animate-in slide-in-from-bottom-5 duration-200"
          >
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-brand-emerald shrink-0">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    PRICE ALERT TRIGGERED
                  </span>
                  <span className="text-[10px] font-mono px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                    {event.alert.symbol}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                  Price reached{' '}
                  <strong className="text-brand-emerald font-bold">
                    {formatCurrency(event.observedPrice)}
                  </strong>{' '}
                  ({event.alert.condition === 'ABOVE' ? '≥' : '≤'}{' '}
                  {formatCurrency(event.alert.targetPrice)})
                </p>
                {event.alert.note && (
                  <p className="text-[10px] text-slate-400 mt-1 italic">
                    "{event.alert.note}"
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => setToasts((current) => current.filter((t) => t.id !== id))}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              aria-label="Dismiss alert"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
