import { Router, type Request, type Response, type NextFunction } from 'express';
import {
  validateQuoteQuery,
  validateCandlesQuery,
  validateSearchQuery,
} from '../middleware/validate.js';
import { marketService } from '../services/marketService.js';
import { MarketProviderError } from '../types/market.js';

export const marketRouter = Router();

/**
 * GET /api/market/quote?symbol=AAPL
 */
marketRouter.get(
  '/quote',
  validateQuoteQuery,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const symbol = req.query.symbol as string;
      const quote = await marketService.getQuote(symbol);
      res.json({ data: quote });
    } catch (err: unknown) {
      if (err instanceof MarketProviderError) {
        res.status(err.status).json({
          error: {
            message: err.message,
            code: err.code,
            isRateLimit: err.isRateLimit,
          },
        });
        return;
      }
      next(err);
    }
  }
);

/**
 * GET /api/market/candles?symbol=AAPL&range=1M
 */
marketRouter.get(
  '/candles',
  validateCandlesQuery,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const symbol = req.query.symbol as string;
      const range = (req.query.range as string) || '1M';
      const candles = await marketService.getCandles(symbol, range);
      res.json({ data: candles });
    } catch (err: unknown) {
      if (err instanceof MarketProviderError) {
        res.status(err.status).json({
          error: {
            message: err.message,
            code: err.code,
            isRateLimit: err.isRateLimit,
          },
        });
        return;
      }
      next(err);
    }
  }
);

/**
 * GET /api/market/search?q=apple
 */
marketRouter.get(
  '/search',
  validateSearchQuery,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query.q as string;
      const results = await marketService.searchSymbols(query);
      res.json({ data: results });
    } catch (err: unknown) {
      if (err instanceof MarketProviderError) {
        res.status(err.status).json({
          error: {
            message: err.message,
            code: err.code,
            isRateLimit: err.isRateLimit,
          },
        });
        return;
      }
      next(err);
    }
  }
);

/**
 * GET /api/market/status
 */
marketRouter.get('/status', (_req: Request, res: Response): void => {
  const status = marketService.getProviderStatus();
  res.json({ data: status });
});
