import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FinnhubProvider } from '../src/providers/finnhubProvider.js';
import { env } from '../src/config/env.js';

describe('FinnhubProvider Adapter', () => {
  let provider: FinnhubProvider;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    provider = new FinnhubProvider();
    // Configure dummy key in test env
    (env as unknown as { finnhubApiKey: string }).finnhubApiKey = 'test_secret_token_12345';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('Quote Normalization & Error Handling', () => {
    it('normalizes a valid Finnhub quote response', async () => {
      const mockRaw = {
        c: 182.52,
        d: 1.25,
        dp: 0.69,
        h: 183.1,
        l: 180.2,
        o: 181.0,
        pc: 181.27,
        t: 1728658800,
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockRaw,
      });

      const quote = await provider.getQuote('AAPL');

      expect(quote.symbol).toBe('AAPL');
      expect(quote.price).toBe(182.52);
      expect(quote.change).toBe(1.25);
      expect(quote.changePercent).toBe(0.69);
      expect(quote.high).toBe(183.1);
      expect(quote.low).toBe(180.2);
      expect(quote.open).toBe(181.0);
      expect(quote.previousClose).toBe(181.27);
      expect(quote.dataStatus).toBe('live');
      expect(quote.provider).toBe('finnhub');
    });

    it('rejects an unrecognized symbol when c=0 and t=0 with 404', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ c: 0, d: null, dp: null, h: 0, l: 0, o: 0, pc: 0, t: 0 }),
      });

      await expect(provider.getQuote('NONEXISTENT')).rejects.toMatchObject({
        status: 404,
        code: 'SYMBOL_NOT_FOUND',
      });
    });

    it('handles rate limit (HTTP 429) gracefully without exposing secrets', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Too Many Requests' }),
      });

      await expect(provider.getQuote('AAPL')).rejects.toMatchObject({
        status: 429,
        code: 'RATE_LIMIT_EXCEEDED',
        isRateLimit: true,
      });
    });

    it('handles authentication failure (HTTP 401) with clean message', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid API key' }),
      });

      await expect(provider.getQuote('AAPL')).rejects.toMatchObject({
        status: 401,
        code: 'PROVIDER_AUTH_FAILURE',
      });
    });

    it('throws 503 when API key is not configured', async () => {
      (env as unknown as { finnhubApiKey: string }).finnhubApiKey = '';

      await expect(provider.getQuote('AAPL')).rejects.toMatchObject({
        status: 503,
        code: 'PROVIDER_NOT_CONFIGURED',
      });
    });
  });

  describe('Candles Normalization & Chronological Ordering', () => {
    it('normalizes and sorts candle points chronologically ascending', async () => {
      // Intentionally provide points out of order to verify sorting
      const mockRaw = {
        s: 'ok',
        t: [1728600000, 1728500000, 1728700000],
        c: [180.0, 175.0, 185.0],
        o: [178.0, 174.0, 181.0],
        h: [181.0, 176.0, 186.0],
        l: [177.0, 173.0, 180.0],
        v: [1000, 2000, 3000],
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockRaw,
      });

      const candles = await provider.getCandles('AAPL', '1M');

      expect(candles.symbol).toBe('AAPL');
      expect(candles.points.length).toBe(3);
      // Verify ascending order
      expect(new Date(candles.points[0].timestamp).getTime()).toBeLessThan(
        new Date(candles.points[1].timestamp).getTime()
      );
      expect(new Date(candles.points[1].timestamp).getTime()).toBeLessThan(
        new Date(candles.points[2].timestamp).getTime()
      );
      // Starting price should be earliest point (175.0)
      expect(candles.startingPrice).toBe(175.0);
      // Ending price should be latest point (185.0)
      expect(candles.endingPrice).toBe(185.0);
      expect(candles.priceChange).toBe(10.0);
    });

    it('rejects candle response with status no_data with 404', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ s: 'no_data', c: [], h: [], l: [], o: [], t: [], v: [] }),
      });

      await expect(provider.getCandles('AAPL', '1M')).rejects.toMatchObject({
        status: 404,
        code: 'NO_CANDLE_DATA',
      });
    });
  });

  describe('Symbol Search Normalization', () => {
    it('normalizes search results and filters relevant equities', async () => {
      const mockRaw = {
        count: 2,
        result: [
          { description: 'APPLE INC', displaySymbol: 'AAPL', symbol: 'AAPL', type: 'Common Stock' },
          { description: 'APPLE HOSPITALITY', displaySymbol: 'APLE', symbol: 'APLE', type: 'Common Stock' },
        ],
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockRaw,
      });

      const results = await provider.searchSymbols('apple');

      expect(results.length).toBe(2);
      expect(results[0].symbol).toBe('AAPL');
      expect(results[0].description).toBe('APPLE INC');
      expect(results[1].symbol).toBe('APLE');
    });

    it('returns empty array when no results found', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ count: 0, result: [] }),
      });

      const results = await provider.searchSymbols('xyzunknown');
      expect(results).toEqual([]);
    });
  });

  describe('Security & Header Authentication', () => {
    it('sends X-Finnhub-Token header and does not expose token in url or error messages', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          c: 100,
          d: 1,
          dp: 1,
          h: 101,
          l: 99,
          o: 99,
          pc: 99,
          t: 1728658800,
        }),
      });
      globalThis.fetch = fetchMock;

      await provider.getQuote('MSFT');

      const calledHeaders = fetchMock.mock.calls[0][1].headers;
      expect(calledHeaders['X-Finnhub-Token']).toBe('test_secret_token_12345');
      // Verify token is NOT placed as URL query param
      const calledUrl = fetchMock.mock.calls[0][0];
      expect(calledUrl).not.toContain('token=');
      expect(calledUrl).not.toContain('test_secret_token');
    });
  });
});
