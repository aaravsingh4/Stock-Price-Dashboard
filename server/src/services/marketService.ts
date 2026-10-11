import { finnhubProvider } from '../providers/finnhubProvider.js';
import { marketCache, CACHE_TTL } from './cache.js';
import { NormalizedQuote, NormalizedCandles, NormalizedSearchResult } from '../types/market.js';
import { env } from '../config/env.js';

export class MarketService {
  /**
   * Retrieves stock quote with caching and deduplication
   */
  async getQuote(symbol: string): Promise<NormalizedQuote> {
    const cacheKey = `quote:${symbol.toUpperCase()}`;
    const cached = marketCache.get<NormalizedQuote>(cacheKey);

    if (cached && !cached.isStale) {
      return {
        ...cached.value,
        cached: true,
        dataStatus: 'cached',
      };
    }

    try {
      const quote = await marketCache.deduplicate(cacheKey, async () => {
        const fresh = await finnhubProvider.getQuote(symbol);
        marketCache.set(cacheKey, fresh, CACHE_TTL.QUOTE);
        return fresh;
      });

      return quote;
    } catch (err) {
      // If cached stale copy exists during network failure or rate limit, return it marked as stale
      if (cached) {
        return {
          ...cached.value,
          cached: true,
          dataStatus: 'stale',
        };
      }
      throw err;
    }
  }

  /**
   * Retrieves historical chart candles with caching
   */
  async getCandles(symbol: string, range: string): Promise<NormalizedCandles> {
    const cleanRange = range.toUpperCase();
    const cacheKey = `candles:${symbol.toUpperCase()}:${cleanRange}`;
    const cached = marketCache.get<NormalizedCandles>(cacheKey);

    if (cached && !cached.isStale) {
      return {
        ...cached.value,
        dataStatus: 'cached',
      };
    }

    try {
      const candles = await marketCache.deduplicate(cacheKey, async () => {
        const fresh = await finnhubProvider.getCandles(symbol, cleanRange);
        marketCache.set(cacheKey, fresh, CACHE_TTL.CANDLES);
        return fresh;
      });

      return candles;
    } catch (err) {
      if (cached) {
        return {
          ...cached.value,
          dataStatus: 'stale',
        };
      }
      throw err;
    }
  }

  /**
   * Searches stock symbols with autocomplete caching
   */
  async searchSymbols(query: string): Promise<NormalizedSearchResult[]> {
    const cleanQuery = query.trim().toLowerCase();
    const cacheKey = `search:${cleanQuery}`;
    const cached = marketCache.get<NormalizedSearchResult[]>(cacheKey);

    if (cached && !cached.isStale) {
      return cached.value;
    }

    return marketCache.deduplicate(cacheKey, async () => {
      const results = await finnhubProvider.searchSymbols(cleanQuery);
      marketCache.set(cacheKey, results, CACHE_TTL.SEARCH);
      return results;
    });
  }

  getProviderStatus() {
    return {
      name: 'finnhub',
      configured: env.isFinnhubConfigured,
      cacheStats: marketCache.getStats(),
    };
  }
}

export const marketService = new MarketService();
