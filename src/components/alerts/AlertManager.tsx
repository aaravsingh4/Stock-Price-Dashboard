import { useState, useEffect } from 'react';
import { Bell, BellRing, Trash2, CheckCircle2, Clock, StopCircle } from 'lucide-react';
import { PriceAlert, TriggeredAlertEvent } from '../../types/alerts';
import { alertService } from '../../services/alertService';
import { AlertForm } from './AlertForm';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../utils/formatters';

interface AlertManagerProps {
  defaultSymbol?: string;
  defaultPrice?: number;
  className?: string;
}

export function AlertManager({ defaultSymbol = 'AAPL', defaultPrice = 180, className }: AlertManagerProps) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [history, setHistory] = useState<TriggeredAlertEvent[]>([]);

  useEffect(() => {
    setAlerts(alertService.getAlerts());
    setHistory(alertService.getHistory());

    const unsubChange = alertService.onChange((updated) => {
      setAlerts(updated);
      setHistory(alertService.getHistory());
    });

    const unsubTrigger = alertService.onTrigger(() => {
      setHistory(alertService.getHistory());
    });

    return () => {
      unsubChange();
      unsubTrigger();
    };
  }, []);

  const activeAlerts = alerts.filter((a) => a.status === 'ACTIVE');

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Overview Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BellRing className="w-5 h-5 text-brand-emerald" />
            <span>Price Alerts & Threshold Monitoring</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time trade evaluation engine with in-browser notifications
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Create Form */}
        <div className="lg:col-span-1">
          <AlertForm
            defaultSymbol={defaultSymbol}
            defaultPrice={defaultPrice}
          />
        </div>

        {/* Right Columns: Active Rules & History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Rules Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-surface-darkBorder flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Bell className="w-4 h-4 text-brand-emerald" />
                <span>Active Rules ({activeAlerts.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {activeAlerts.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500">
                  No active price alerts set. Use the form to configure threshold rules.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-surface-darkBorder">
                  {activeAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-3.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono text-sm text-slate-900 dark:text-white">
                            {alert.symbol}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              alert.condition === 'ABOVE'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                            }`}
                          >
                            {alert.condition === 'ABOVE' ? '≥ RISES ABOVE' : '≤ FALLS BELOW'}
                          </span>
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-200 tabular-nums">
                            {formatCurrency(alert.targetPrice)}
                          </span>
                        </div>
                        {alert.note && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {alert.note}
                          </p>
                        )}
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Created {new Date(alert.createdAt).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => alertService.toggleAlert(alert.id)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-amber-500"
                          title="Disable alert"
                        >
                          <StopCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => alertService.deleteAlert(alert.id)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-rose-500"
                          title="Delete alert"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Triggered History */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-surface-darkBorder flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Alert Trigger History ({history.length})</span>
              </CardTitle>
              {history.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => alertService.clearHistory()}
                  className="text-[11px] h-7 px-2 text-slate-400 hover:text-slate-600"
                >
                  Clear History
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {history.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500">
                  No alert triggers recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-surface-darkBorder max-h-72 overflow-y-auto">
                  {history.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-brand-emerald shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.alert.symbol} triggered at{' '}
                            <span className="font-mono font-bold text-brand-emerald">
                              {formatCurrency(item.observedPrice)}
                            </span>{' '}
                            (Target: {formatCurrency(item.alert.targetPrice)})
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(item.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold">
                        TRIGGERED
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
