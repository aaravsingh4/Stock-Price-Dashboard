import { useState } from 'react';
import { BellRing, Plus, AlertCircle } from 'lucide-react';
import { AlertCondition } from '../../types/alerts';
import { alertService } from '../../services/alertService';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

interface AlertFormProps {
  defaultSymbol?: string;
  defaultPrice?: number;
  onAlertCreated?: (alertId: string) => void;
  className?: string;
}

export function AlertForm({
  defaultSymbol = 'AAPL',
  defaultPrice = 150,
  onAlertCreated,
  className,
}: AlertFormProps) {
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [targetPrice, setTargetPrice] = useState<string>(
    defaultPrice ? defaultPrice.toFixed(2) : '150.00'
  );
  const [condition, setCondition] = useState<AlertCondition>('ABOVE');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const priceNum = parseFloat(targetPrice);
    if (!symbol.trim()) {
      setError('Symbol cannot be empty');
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Please specify a positive target price');
      return;
    }

    try {
      const created = alertService.createAlert(symbol, priceNum, condition, note);
      setSuccessMsg(`Alert set for ${created.symbol} ${condition} $${created.targetPrice.toFixed(2)}`);
      setNote('');
      onAlertCreated?.(created.id);
    } catch (err) {
      setError((err as Error).message || 'Failed to create alert');
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <BellRing className="w-4 h-4 text-brand-emerald" />
          <span>Create Price Alert</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-400">
              {successMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Stock Symbol
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="AAPL"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-emerald uppercase font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Target Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="180.00"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-emerald font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Trigger Condition
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCondition('ABOVE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  condition === 'ABOVE'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Rises To or Above (≥)
              </button>
              <button
                type="button"
                onClick={() => setCondition('BELOW')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  condition === 'BELOW'
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Falls To or Below (≤)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Resistance breakout, take profit"
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-emerald"
            />
          </div>

          <Button type="submit" variant="primary" size="sm" className="w-full gap-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" />
            <span>Set Price Alert</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
