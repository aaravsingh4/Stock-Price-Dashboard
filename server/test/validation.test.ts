import { describe, it, expect } from 'vitest';
import express, { Request, Response } from 'express';
import request from 'supertest';
import {
  validateQuoteQuery,
  validateCandlesQuery,
  validateSearchQuery,
} from '../src/middleware/validate.js';

describe('Server Request Validation Middleware', () => {
  const app = express();

  app.get('/test/quote', validateQuoteQuery, (req: Request, res: Response) => {
    res.json({ symbol: req.query.symbol });
  });

  app.get('/test/candles', validateCandlesQuery, (req: Request, res: Response) => {
    res.json({ symbol: req.query.symbol, range: req.query.range });
  });

  app.get('/test/search', validateSearchQuery, (req: Request, res: Response) => {
    res.json({ q: req.query.q });
  });

  describe('validateQuoteQuery', () => {
    it('rejects missing symbol parameter with HTTP 400', async () => {
      const res = await request(app).get('/test/quote');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_SYMBOL_PARAM');
    });

    it('rejects empty or whitespace-only symbol', async () => {
      const res = await request(app).get('/test/quote?symbol=   ');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_SYMBOL_PARAM');
    });

    it('rejects malformed symbol with illegal characters or excessive length', async () => {
      const res = await request(app).get('/test/quote?symbol=INVALID$$$');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('MALFORMED_SYMBOL');
    });

    it('accepts and normalizes valid symbol to uppercase', async () => {
      const res = await request(app).get('/test/quote?symbol=aapl');
      expect(res.status).toBe(200);
      expect(res.body.symbol).toBe('AAPL');
    });
  });

  describe('validateCandlesQuery', () => {
    it('rejects missing symbol parameter with HTTP 400', async () => {
      const res = await request(app).get('/test/candles');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('MISSING_SYMBOL_PARAM');
    });

    it('defaults range to 1M if not specified', async () => {
      const res = await request(app).get('/test/candles?symbol=MSFT');
      expect(res.status).toBe(200);
      expect(res.body.symbol).toBe('MSFT');
      expect(res.body.range).toBe('1M');
    });

    it('accepts all supported ranges (1D, 1W, 1M, 3M, 6M, 1Y, ALL)', async () => {
      const ranges = ['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'];
      for (const r of ranges) {
        const res = await request(app).get(`/test/candles?symbol=GOOGL&range=${r}`);
        expect(res.status).toBe(200);
        expect(res.body.range).toBe(r);
      }
    });

    it('rejects unsupported range with HTTP 400', async () => {
      const res = await request(app).get('/test/candles?symbol=NVDA&range=5Y');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_TIME_RANGE');
    });
  });

  describe('validateSearchQuery', () => {
    it('rejects empty search query with HTTP 400', async () => {
      const res = await request(app).get('/test/search?q=');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('EMPTY_SEARCH_QUERY');
    });

    it('rejects search query exceeding 35 characters', async () => {
      const longQuery = 'A'.repeat(36);
      const res = await request(app).get(`/test/search?q=${longQuery}`);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('SEARCH_QUERY_TOO_LONG');
    });

    it('accepts valid bounded search query and trims whitespace', async () => {
      const res = await request(app).get('/test/search?q=  Apple Inc  ');
      expect(res.status).toBe(200);
      expect(res.body.q).toBe('Apple Inc');
    });
  });
});
