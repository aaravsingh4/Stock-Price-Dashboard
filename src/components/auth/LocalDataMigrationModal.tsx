import { useState } from 'react';
import { cloudClient } from '../../services/cloudClient';
import { Button } from '../ui/Button';
import { CloudUpload, CheckCircle, AlertTriangle, X } from 'lucide-react';
import type { MigrationSummaryResponse } from '../../types/auth';

interface LocalDataMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMigrationComplete: () => void;
}

export function LocalDataMigrationModal({
  isOpen,
  onClose,
  onMigrationComplete,
}: LocalDataMigrationModalProps) {
  const [isMigrating, setIsMigrating] = useState(false);
  const [result, setResult] = useState<MigrationSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Inspect local browser storage
  const getLocalDataPayload = () => {
    let alerts: Array<{ symbol: string; condition: string; targetPrice: number }> = [];
    try {
      const raw = localStorage.getItem('tradepulse_price_alerts_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          alerts = parsed.map((a) => ({
            symbol: a.symbol,
            condition: a.condition,
            targetPrice: Number(a.targetPrice),
          }));
        }
      }
    } catch {
      // Ignore
    }

    return {
      alerts,
    };
  };

  const payload = getLocalDataPayload();
  const alertCount = payload.alerts.length;

  const handleStartMigration = async () => {
    setIsMigrating(true);
    setError(null);
    try {
      const res = await cloudClient.migrateLocalData(payload);
      setResult(res);
      onMigrationComplete();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Migration failed');
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-surface-darkCard rounded-2xl shadow-2xl border border-slate-200 dark:border-surface-darkBorder p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          aria-label="Close migration dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 mb-3">
            <CloudUpload className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Migrate Browser Data to Cloud
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            We discovered {alertCount} offline alert rule(s) stored in this browser. Would you like to import them into your persistent PostgreSQL account?
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-2 font-semibold mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Migration Completed Successfully!</span>
              </div>
              <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                <li>• Alerts Imported: {result.summary.alerts.imported}</li>
                <li>• Duplicates Skipped: {result.summary.alerts.skipped}</li>
                <li>• Failed Records: {result.summary.alerts.failed}</li>
              </ul>
            </div>
            <Button onClick={onClose} className="w-full justify-center">
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
              <p>• Your existing browser-local data will remain safe as a backup.</p>
              <p>• Deduplication prevents re-triggering duplicate alerts.</p>
              <p>• Cloud rules trigger authoritative WebSocket notifications 24/7.</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="w-1/2 justify-center">
                Skip for Now
              </Button>
              <Button
                onClick={handleStartMigration}
                disabled={isMigrating}
                className="w-1/2 justify-center"
              >
                {isMigrating ? 'Importing...' : 'Import to Cloud'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
