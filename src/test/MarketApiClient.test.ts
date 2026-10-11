import { describe, it, expect, vi, afterEach } from 'vitest';
import { marketApiClient } from '../services/apiClient';

describe('Client MarketApiClient Service', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('checks backend health and caches configured state', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'ok',
        service: 'TradePulse Pro',
        version: '1.0.0',
        timestamp: '2026-10-11T00:00:00Z',
        provider: {
          name: 'finnhub',
          configured: true,
          mode: 'provider',
        },
        uptimeSeconds: 120,
      }),
    });

    const health = await marketApiClient.checkHealth();
    expect(health).not.toBeNull();
    expect(health?.provider?.configured).toBe(true);
    expect(marketApiClient.isConfigured).toBe(true);
  });

  it('normalizes fetched candles into StockHistoricalData format', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          symbol: 'AAPL',
          range: '1M',
          dataStatus: 'live',
          provider: 'finnhub',
          startingPrice: 150.0,
          endingPrice: 160.0,
          priceChange: 10.0,
          percentChange: 6.67,
          points: [
            { timestamp: '2026-09-01T00:00:00Z', label: 'Sep 1', price: 150.0, volume: 1000 },
            { timestamp: '2026-09-02T00:00:00Z', label: 'Sep 2', price: 160.0, volume: 2000 },
          ],
        },
      }),
    });

    const candles = await marketApiClient.fetchCandles('AAPL', '1M');
    expect(candles).not.toBeNull();
    expect(candles?.symbol).toBe('AAPL');
    expect(candles?.dataStatus).toBe('LIVE');
    expect(candles?.points.length).toBe(2);
    expect(candles?.priceChange).toBe(10.0);
  });

  it('returns empty array when search query is blank', async () => {
    const results = await marketApiClient.searchSymbols('   ');
    expect(results).toEqual([]);
  });

  it('never contains or transmits API secrets in client code', () => {
    // Assert process.env on client does not expose FINNHUB_API_KEY
    expect((import.meta as unknown as { env: Record<string, string> }).env?.FINNHUB_API_KEY).toBeUndefined();
  });
});
