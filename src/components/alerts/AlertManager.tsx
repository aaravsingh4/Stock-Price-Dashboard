import { useState, useEffect, useCallback } from 'react';
import { Bell, BellRing, Trash2, StopCircle, Cloud, User, AlertCircle, Plus, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/authCore';
import { cloudClient } from '../../services/cloudClient';
import { alertService } from '../../services/alertService';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../utils/formatters';
import type { CloudPriceAlertDto, CloudAlertHistoryDto } from '../../types/auth';

interface AlertManagerProps {
  defaultSymbol?: string;
  defaultPrice?: number;
  className?: string;
  onOpenAuthModal?: () => void;
  onOpenMigrationModal?: () => void;
}

export function AlertManager({
  defaultSymbol = 'AAPL',
  defaultPrice = 180,
  className,
  onOpenAuthModal,
  onOpenMigrationModal,
}: AlertManagerProps) {
  const { user, isAuthenticated } = useAuth();

  // Local alert states (guest fallback)
  const [localAlerts, setLocalAlerts] = useState(alertService.getAlerts());
  const [localHistory, setLocalHistory] = useState(alertService.getHistory());

  // Cloud alert states (authenticated)
  const [cloudAlerts, setCloudAlerts] = useState<CloudPriceAlertDto[]>([]);
  const [cloudHistory, setCloudHistory] = useState<CloudAlertHistoryDto[]>([]);
  const [isCloudLoading, setIsCloudLoading] = useState(false);

  // Form inputs
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [targetPrice, setTargetPrice] = useState<string>(
    defaultPrice ? defaultPrice.toFixed(2) : '180.00'
  );
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync guest local alerts
  useEffect(() => {
    const unsubChange = alertService.onChange((updated) => {
      setLocalAlerts(updated);
      setLocalHistory(alertService.getHistory());
    });
    const unsubTrigger = alertService.onTrigger(() => {
      setLocalHistory(alertService.getHistory());
    });
    return () => {
      unsubChange();
      unsubTrigger();
    };
  }, []);

  // Fetch cloud alerts when authenticated
  const loadCloudAlerts = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsCloudLoading(true);
    try {
      const [alertsData, historyData] = await Promise.all([
        cloudClient.getCloudAlerts(),
        cloudClient.getCloudAlertHistory(),
      ]);
      setCloudAlerts(alertsData);
      setCloudHistory(historyData);
    } catch (err: unknown) {
      console.error('Failed to load cloud alerts:', err);
    } finally {
      setIsCloudLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadCloudAlerts();
    }
  }, [isAuthenticated, loadCloudAlerts]);

  const handleSubmit = async (e: React.FormEvent) => {
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
      if (isAuthenticated) {
        // Authenticated: Persist to Neon PostgreSQL & Server Stream
        const created = await cloudClient.createCloudAlert(symbol.trim().toUpperCase(), condition, priceNum);
        setCloudAlerts((prev) => [created, ...prev]);
        setSuccessMsg(`Cloud alert set for ${created.symbol} ${condition} $${priceNum.toFixed(2)}`);
      } else {
        // Guest mode: Local browser storage
        const created = alertService.createAlert(symbol, priceNum, condition);
        setSuccessMsg(`Local alert set for ${created.symbol} ${condition} $${created.targetPrice.toFixed(2)}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create alert');
    }
  };

  const handleDeleteCloudAlert = async (id: string) => {
    try {
      await cloudClient.deleteCloudAlert(id);
      setCloudAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete alert');
    }
  };

  const activeCloudAlerts = cloudAlerts.filter((a) => a.status === 'ACTIVE');
  const activeLocalAlerts = localAlerts.filter((a) => a.status === 'ACTIVE');

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
            {isAuthenticated ? (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <Cloud className="w-3.5 h-3.5" />
                Cloud-backed with Neon PostgreSQL • Branch: tradepulse-dev • Account: {user?.email}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                <User className="w-3.5 h-3.5" />
                Operating in Guest Mode (Offline browser storage). Sign in to activate 24/7 cloud alerts.
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isAuthenticated ? (
            <Button size="sm" onClick={onOpenAuthModal} className="text-xs">
              Sign In to Save in Cloud
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenMigrationModal}
              className="text-xs gap-1.5"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Import Local Alerts</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Create Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BellRing className="w-4 h-4 text-brand-emerald" />
                <span>{isAuthenticated ? 'Create Cloud Price Alert' : 'Create Local Price Alert'}</span>
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
                      Rises Above (≥)
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
                      Falls Below (≤)
                    </button>
                  </div>
                </div>

                <Button type="submit" variant="primary" size="sm" className="w-full gap-1.5 text-xs">
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAuthenticated ? 'Save Cloud Alert' : 'Save Local Alert'}</span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Columns: Active Rules & History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Rules Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-surface-darkBorder flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Bell className="w-4 h-4 text-brand-emerald" />
                <span>
                  Active Rules ({isAuthenticated ? activeCloudAlerts.length : activeLocalAlerts.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isCloudLoading ? (
                <div className="p-6 text-center text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs">Loading active alerts...</span>
                </div>
              ) : isAuthenticated ? (
                activeCloudAlerts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500">
                    No active cloud price alerts set. Use the form to configure rules.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-surface-darkBorder">
                    {activeCloudAlerts.map((alert) => (
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
                              {formatCurrency(Number(alert.targetPrice))}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            Neon PostgreSQL ID: {alert.id.slice(0, 8)}... • Created {new Date(alert.createdAt).toLocaleTimeString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCloudAlert(alert.id)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-500"
                            title="Delete alert"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                // Local guest alerts
                activeLocalAlerts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500">
                    No active local alerts set. Configure a rule using the form on the left.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-surface-darkBorder">
                    {activeLocalAlerts.map((alert) => (
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
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => alertService.toggleAlert(alert.id)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-amber-500"
                          >
                            <StopCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => alertService.deleteAlert(alert.id)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </CardContent>
          </Card>

          {/* Trigger History Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-surface-darkBorder">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <span>Trigger History ({isAuthenticated ? cloudHistory.length : localHistory.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {(isAuthenticated ? cloudHistory.length : localHistory.length) === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No alerts have been triggered yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-surface-darkBorder">
                  {isAuthenticated
                    ? cloudHistory.map((h) => (
                        <div key={h.id} className="p-3 text-xs flex justify-between items-center">
                          <div>
                            <span className="font-bold font-mono text-slate-900 dark:text-white mr-2">
                              {h.symbol}
                            </span>
                            <span className="text-slate-500">
                              Triggered at ${Number(h.observedPrice).toFixed(2)} ({h.condition} target ${Number(h.targetPrice).toFixed(2)})
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(h.triggeredAt).toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    : localHistory.map((h, idx) => (
                        <div key={`${h.alert.id}-${idx}`} className="p-3 text-xs flex justify-between items-center">
                          <div>
                            <span className="font-bold font-mono text-slate-900 dark:text-white mr-2">
                              {h.alert.symbol}
                            </span>
                            <span className="text-slate-500">
                              Triggered at ${h.observedPrice.toFixed(2)} ({h.alert.condition} target ${h.alert.targetPrice.toFixed(2)})
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(h.timestamp).toLocaleTimeString()}
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
