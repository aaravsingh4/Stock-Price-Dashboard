import { Router, type Request, type Response, type NextFunction } from 'express';
import { AlertRepository } from '../repositories/alertRepository.js';
import { cloudAlertService } from '../services/cloudAlertService.js';
import { requireAuth, checkCsrf } from '../middleware/auth.js';
import { AlertCondition } from '@prisma/client';

export const alertRouter = Router();

alertRouter.use(requireAuth);
alertRouter.use(checkCsrf);

/**
 * GET /api/alerts
 * Lists all alerts for the authenticated user
 */
alertRouter.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.session.userId!;
    const alerts = await AlertRepository.listByUser(userId);
    res.json({ data: alerts });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/alerts/history
 * Lists trigger history for the authenticated user
 */
alertRouter.get('/history', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.session.userId!;
    const history = await AlertRepository.listHistory(userId);
    res.json({ data: history });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/alerts
 * Creates a new persistent cloud price alert
 */
alertRouter.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.session.userId!;
    const { symbol, condition, targetPrice } = req.body;

    if (!symbol || typeof symbol !== 'string') {
      res.status(400).json({ error: { message: 'Stock symbol is required', code: 'INVALID_SYMBOL' } });
      return;
    }

    if (!['ABOVE', 'BELOW'].includes(condition)) {
      res.status(400).json({ error: { message: 'Condition must be ABOVE or BELOW', code: 'INVALID_CONDITION' } });
      return;
    }

    const price = Number(targetPrice);
    if (isNaN(price) || price <= 0) {
      res.status(400).json({ error: { message: 'Target price must be a positive number', code: 'INVALID_PRICE' } });
      return;
    }

    const alert = await AlertRepository.createAlert(
      userId,
      symbol,
      condition as AlertCondition,
      price
    );

    // Reconcile stream subscriptions for this symbol
    await cloudAlertService.reconcileSubscriptions();

    res.status(201).json({ data: alert });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/alerts/:id
 * Deletes a price alert owned by the user
 */
alertRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.session.userId!;
    const id = req.params.id as string;

    const deleted = await AlertRepository.deleteAlert(id, userId);
    if (!deleted) {
      res.status(404).json({ error: { message: 'Alert not found or unauthorized', code: 'NOT_FOUND' } });
      return;
    }

    // Reconcile stream subscriptions
    await cloudAlertService.reconcileSubscriptions();

    res.json({ data: { message: 'Alert deleted successfully' } });
  } catch (err) {
    next(err);
  }
});
