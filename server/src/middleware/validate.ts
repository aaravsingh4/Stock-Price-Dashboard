import { type Request, type Response, type NextFunction } from 'express';

const VALID_TIME_RANGES = new Set(['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL']);
const SYMBOL_REGEX = /^[A-Z0-9.]{1,10}$/;

export function validateQuoteQuery(req: Request, res: Response, next: NextFunction): void {
  const { symbol } = req.query;

  if (!symbol || typeof symbol !== 'string' || !symbol.trim()) {
    res.status(400).json({
      error: {
        message: 'Query parameter "symbol" is required and cannot be empty.',
        code: 'INVALID_SYMBOL_PARAM',
      },
    });
    return;
  }

  const cleanSymbol = symbol.trim().toUpperCase();
  if (!SYMBOL_REGEX.test(cleanSymbol)) {
    res.status(400).json({
      error: {
        message: 'Invalid stock symbol format. Expected 1-10 alphanumeric characters.',
        code: 'MALFORMED_SYMBOL',
      },
    });
    return;
  }

  Object.defineProperty(req, 'query', {
    value: { ...req.query, symbol: cleanSymbol },
    writable: true,
    configurable: true,
  });
  next();
}

export function validateCandlesQuery(req: Request, res: Response, next: NextFunction): void {
  const { symbol, range } = req.query;

  if (!symbol || typeof symbol !== 'string' || !symbol.trim()) {
    res.status(400).json({
      error: {
        message: 'Query parameter "symbol" is required.',
        code: 'MISSING_SYMBOL_PARAM',
      },
    });
    return;
  }

  const cleanSymbol = symbol.trim().toUpperCase();
  if (!SYMBOL_REGEX.test(cleanSymbol)) {
    res.status(400).json({
      error: {
        message: 'Invalid stock symbol format.',
        code: 'MALFORMED_SYMBOL',
      },
    });
    return;
  }

  const cleanRange = typeof range === 'string' ? range.trim().toUpperCase() : '1M';
  if (!VALID_TIME_RANGES.has(cleanRange)) {
    res.status(400).json({
      error: {
        message: `Invalid range "${range}". Supported ranges are: ${Array.from(VALID_TIME_RANGES).join(', ')}`,
        code: 'INVALID_TIME_RANGE',
      },
    });
    return;
  }

  Object.defineProperty(req, 'query', {
    value: { ...req.query, symbol: cleanSymbol, range: cleanRange },
    writable: true,
    configurable: true,
  });
  next();
}

export function validateSearchQuery(req: Request, res: Response, next: NextFunction): void {
  const { q } = req.query;

  if (!q || typeof q !== 'string' || !q.trim()) {
    res.status(400).json({
      error: {
        message: 'Query parameter "q" is required and cannot be empty.',
        code: 'EMPTY_SEARCH_QUERY',
      },
    });
    return;
  }

  const cleanQuery = q.trim();
  if (cleanQuery.length > 35) {
    res.status(400).json({
      error: {
        message: 'Search query length exceeds maximum allowed limit of 35 characters.',
        code: 'SEARCH_QUERY_TOO_LONG',
      },
    });
    return;
  }

  Object.defineProperty(req, 'query', {
    value: { ...req.query, q: cleanQuery },
    writable: true,
    configurable: true,
  });
  next();
}
