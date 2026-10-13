import { Router, type Request, type Response, type NextFunction } from 'express';
import { WatchlistRepository } from '../repositories/watchlistRepository.js';
import { requireAuth, checkCsrf } from '../middleware/auth.js';

export const watchlistRouter = Router();

// Protect all watchlist routes
watchlistRouter.use(requireAuth);
watchlistRouter.use(checkCsrf);

/**
 * GET /api/watchlists
 * Lists all watchlists for authenticated user
 */
watchlistRouter.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.session.userId!;
    const watchlists = await WatchlistRepository.listByUser(userId);
    res.json({ data: watchlists });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/watchlists
 * Creates a new custom watchlist
 */
watchlistRouter.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.session.userId!;
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: { message: 'Watchlist name is required', code: 'INVALID_INPUT' } });
      return;
    }

    const created = await WatchlistRepository.createWatchlist(userId, name);
    res.status(201).json({ data: created });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/watchlists/:id
 * Renames a watchlist
 */
watchlistRouter.patch('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.session.userId!;
    const id = req.params.id as string;
    const { name } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: { message: 'New watchlist name is required', code: 'INVALID_INPUT' } });
      return;
    }

    const updated = await WatchlistRepository.renameWatchlist(id, userId, name);
    if (!updated) {
      res.status(404).json({ error: { message: 'Watchlist not found or unauthorized', code: 'NOT_FOUND' } });
      return;
    }

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/watchlists/:id
 * Deletes a custom watchlist (default watchlist cannot be deleted)
 */
watchlistRouter.delete('/:id', async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const userId = req.session.userId!;
    const id = req.params.id as string;

    const deleted = await WatchlistRepository.deleteWatchlist(id, userId);
    if (!deleted) {
      res.status(404).json({ error: { message: 'Watchlist not found or unauthorized', code: 'NOT_FOUND' } });
      return;
    }

    res.json({ data: { message: 'Watchlist deleted successfully' } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete watchlist';
    res.status(400).json({ error: { message, code: 'DELETE_ERROR' } });
  }
});

/**
 * POST /api/watchlists/:id/symbols
 * Adds a symbol to the specified watchlist
 */
watchlistRouter.post('/:id/symbols', async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const userId = req.session.userId!;
    const id = req.params.id as string;
    const { symbol, name, exchange } = req.body;

    if (!symbol || typeof symbol !== 'string' || !symbol.trim()) {
      res.status(400).json({ error: { message: 'Stock symbol is required', code: 'INVALID_INPUT' } });
      return;
    }

    const item = await WatchlistRepository.addSymbol(id, userId, symbol, name, exchange);
    res.status(201).json({ data: item });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to add symbol';
    res.status(400).json({ error: { message, code: 'ADD_SYMBOL_ERROR' } });
  }
});

/**
 * DELETE /api/watchlists/:id/symbols/:symbol
 * Removes a symbol from the specified watchlist
 */
watchlistRouter.delete('/:id/symbols/:symbol', async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const userId = req.session.userId!;
    const id = req.params.id as string;
    const symbol = req.params.symbol as string;

    const removed = await WatchlistRepository.removeSymbol(id, userId, symbol);
    if (!removed) {
      res.status(404).json({ error: { message: 'Symbol not found in watchlist', code: 'NOT_FOUND' } });
      return;
    }

    res.json({ data: { message: 'Symbol removed from watchlist' } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to remove symbol';
    res.status(400).json({ error: { message, code: 'REMOVE_SYMBOL_ERROR' } });
  }
});
