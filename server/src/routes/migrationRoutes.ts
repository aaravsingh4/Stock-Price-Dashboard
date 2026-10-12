import { Router, type Request, type Response, type NextFunction } from 'express';
import { WatchlistRepository } from '../repositories/watchlistRepository.js';
import { AlertRepository } from '../repositories/alertRepository.js';
import { cloudAlertService } from '../services/cloudAlertService.js';
import { requireAuth, checkCsrf } from '../middleware/auth.js';
import { AlertCondition } from '@prisma/client';

export const migrationRouter = Router();

migrationRouter.use(requireAuth);
migrationRouter.use(checkCsrf);

interface MigrationPayload {
  watchlists?: Array<{
    name?: string;
    symbols?: Array<{ symbol: string; name?: string; exchange?: string }>;
  }>;
  alerts?: Array<{
    symbol: string;
    condition: string;
    targetPrice: number;
  }>;
}

/**
 * POST /api/migrate/local-data
 * Idempotently migrates client-side browser data into Postgres
 */
migrationRouter.post('/local-data', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.session.userId!;
    const payload = req.body as MigrationPayload;

    const stats = {
      watchlists: { imported: 0, skipped: 0, failed: 0 },
      symbols: { imported: 0, skipped: 0, failed: 0 },
      alerts: { imported: 0, skipped: 0, failed: 0 },
    };

    // 1. Migrate Watchlists and symbols
    if (Array.isArray(payload.watchlists)) {
      // Fetch user's existing watchlists to locate default or duplicate names
      const existingLists = await WatchlistRepository.listByUser(userId);
      const defaultList = existingLists.find((l) => l.isDefault) || existingLists[0];

      for (const rawList of payload.watchlists) {
        try {
          let targetList = defaultList;
          if (rawList.name && rawList.name !== 'My Watchlist') {
            const listName = rawList.name.trim();
            const matching = existingLists.find((l) => l.name.toLowerCase() === listName.toLowerCase());
            if (matching) {
              targetList = matching;
              stats.watchlists.skipped += 1;
            } else {
              targetList = await WatchlistRepository.createWatchlist(userId, listName);
              existingLists.push(targetList);
              stats.watchlists.imported += 1;
            }
          }

          if (targetList && Array.isArray(rawList.symbols)) {
            for (const symObj of rawList.symbols) {
              if (symObj && typeof symObj.symbol === 'string' && symObj.symbol.trim()) {
                try {
                  const added = await WatchlistRepository.addSymbol(
                    targetList.id,
                    userId,
                    symObj.symbol,
                    symObj.name,
                    symObj.exchange
                  );
                  if (added) {
                    stats.symbols.imported += 1;
                  }
                } catch {
                  stats.symbols.skipped += 1;
                }
              }
            }
          }
        } catch {
          stats.watchlists.failed += 1;
        }
      }
    }

    // 2. Migrate Price Alerts
    if (Array.isArray(payload.alerts)) {
      const existingAlerts = await AlertRepository.listByUser(userId);

      for (const rawAlert of payload.alerts) {
        try {
          if (
            rawAlert.symbol &&
            typeof rawAlert.symbol === 'string' &&
            ['ABOVE', 'BELOW'].includes(rawAlert.condition) &&
            typeof rawAlert.targetPrice === 'number' &&
            rawAlert.targetPrice > 0
          ) {
            const normSym = rawAlert.symbol.trim().toUpperCase();
            // Prevent duplicate alert with identical parameters
            const isDup = existingAlerts.some(
              (ea) =>
                ea.symbol === normSym &&
                ea.condition === rawAlert.condition &&
                Number(ea.targetPrice) === rawAlert.targetPrice
            );

            if (isDup) {
              stats.alerts.skipped += 1;
            } else {
              await AlertRepository.createAlert(
                userId,
                normSym,
                rawAlert.condition as AlertCondition,
                rawAlert.targetPrice
              );
              stats.alerts.imported += 1;
            }
          } else {
            stats.alerts.failed += 1;
          }
        } catch {
          stats.alerts.failed += 1;
        }
      }

      await cloudAlertService.reconcileSubscriptions();
    }

    res.json({
      data: {
        success: true,
        summary: stats,
      },
    });
  } catch (err) {
    next(err);
  }
});
