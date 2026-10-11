import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { finnhubProvider } from '../src/providers/finnhubProvider.js';
import { marketCache } from '../src/services/cache.js';

describe('Market API Express Endpoints', () => {
  const app = createApp();

  beforeEach(() => {
    marketCache.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/health', () => {
    it('returns service health and configuration status without disclosing secrets', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toContain('TradePulse');
      expect(res.body.provider).toBeDefined();
      expect(res.body.provider.name).toBe('finnhub');
      // Verify no api key or secret is in the response body
      const rawString = JSON.stringify(res.body);
      expect(rawString).not.toContain('FINNHUB_API_KEY');
      expect(rawString).not.toContain('token');
    });
  });

  describe('GET /api/market/quote', () => {
    it('returns normalized quote when provider succeeds', async () => {
      vi.spyOn(finnhubProvider, 'getQuote').mockResolvedValue({
        symbol: 'AAPL',
        price: 180.5,
        change: 2.1,
        changePercent: 1.18,
        open: 179.0,
        high: 181.0,
        low: 178.5,
        previousClose: 178.4,
        timestamp: new Date().toISOString(),
        providerTimestamp: 1728658800,
        dataStatus: 'live',
        provider: 'finnhub',
        cached: false,
      });

      const res = await request(app).get('/api/market/quote?symbol=AAPL');

      expect(res.status).toBe(200);
      expect(res.body.data.symbol).toBe('AAPL');
      expect(res.body.data.price).toBe(180.5);
      expect(res.body.data.dataStatus).toBe('live');
    });

    it('returns cached quote on subsequent request', async () => {
      const spy = vi.spyOn(finnhubProvider, 'getQuote').mockResolvedValue({
        symbol: 'MSFT',
        price: 400.0,
        change: 3.5,
        changePercent: 0.88,
        open: 398.0,
        high: 402.0,
        low: 397.0,
        previousClose: 396.5,
        timestamp: new Date().toISOString(),
        providerTimestamp: 1728658800,
        dataStatus: 'live',
        provider: 'finnhub',
        cached: false,
      });

      // First request (fresh fetch)
      const res1 = await request(app).get('/api/market/quote?symbol=MSFT');
      expect(res1.status).toBe(200);
      expect(res1.body.data.cached).toBe(false);

      // Second request (cached)
      const res2 = await request(app).get('/api/market/quote?symbol=MSFT');
      expect(res2.status).toBe(200);
      expect(res2.body.data.cached).toBe(true);
      expect(res2.body.data.dataStatus).toBe('cached');
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/market/candles', () => {
    it('returns normalized candles with chronological points', async () => {
      vi.spyOn(finnhubProvider, 'getCandles').mockResolvedValue({
        symbol: 'NVDA',
        range: '1M',
        dataStatus: 'live',
        provider: 'finnhub',
        startingPrice: 120.0,
        endingPrice: 130.0,
        priceChange: 10.0,
        percentChange: 8.33,
        points: [
          { timestamp: '2026-09-01T00:00:00Z', label: 'Sep 1', price: 120.0, volume: 1000 },
          { timestamp: '2026-09-02T00:00:00Z', label: 'Sep 2', price: 130.0, volume: 2000 },
        ],
      });

      const res = await request(app).get('/api/market/candles?symbol=NVDA&range=1M');

      expect(res.status).toBe(200);
      expect(res.body.data.symbol).toBe('NVDA');
      expect(res.body.data.points.length).toBe(2);
      expect(res.body.data.priceChange).toBe(10.0);
    });
  });

  describe('GET /api/market/search', () => {
    it('returns symbol search results', async () => {
      vi.spyOn(finnhubProvider, 'searchSymbols').mockResolvedValue([
        { symbol: 'AAPL', description: 'APPLE INC', type: 'Common Stock', displaySymbol: 'AAPL' },
      ]);

      const res = await request(app).get('/api/market/search?q=apple');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].symbol).toBe('AAPL');
    });
  });

  describe('GET /api/market/status', () => {
    it('returns provider status and cache telemetry', async () => {
      const res = await request(app).get('/api/market/status');

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('finnhub');
      expect(res.body.data.cacheStats).toBeDefined();
    });
  });
});
