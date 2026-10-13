import { env } from '../config/env.js';
import {
  MarketProviderError,
  NormalizedQuote,
  NormalizedCandles,
  NormalizedSearchResult,
  CandlePoint,
} from '../types/market.js';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const REQUEST_TIMEOUT_MS = 6000;

interface FinnhubRawQuote {
  c: number;
  d: number | null;
  dp: number | null;
  h: number;
  l: number;
  o: number;
  pc: number;
  t: number;
}

interface FinnhubRawCandles {
  c: number[];
  h: number[];
  l: number[];
  o: number[];
  s: 'ok' | 'no_data';
  t: number[];
  v: number[];
}

interface FinnhubRawSearch {
  count: number;
  result: Array<{
    description: string;
    displaySymbol: string;
    symbol: string;
    type: string;
  }>;
}

export class FinnhubProvider {
  /**
   * Safe upstream fetch with X-Finnhub-Token header authentication
   */
  private async fetchUpstream<T>(endpoint: string, searchParams: Record<string, string>): Promise<T> {
    if (!env.isFinnhubConfigured) {
      throw new MarketProviderError(
        'Finnhub provider is not configured. Please supply FINNHUB_API_KEY in local .env.',
        503,
        'PROVIDER_NOT_CONFIGURED'
      );
    }

    const url = new URL(`${FINNHUB_BASE_URL}${endpoint}`);
    Object.entries(searchParams).forEach(([k, v]) => url.searchParams.set(k, v));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Finnhub-Token': env.finnhubApiKey,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new MarketProviderError(
            'Finnhub authentication failed. Check your API key configuration.',
            401,
            'PROVIDER_AUTH_FAILURE'
          );
        }
        if (response.status === 429) {
          throw new MarketProviderError(
            'Finnhub upstream rate limit exceeded (60 req/min). Try again shortly.',
            429,
            'RATE_LIMIT_EXCEEDED'
          );
        }
        throw new MarketProviderError(
          `Finnhub upstream error: HTTP ${response.status}`,
          response.status >= 500 ? 502 : response.status,
          'UPSTREAM_HTTP_ERROR'
        );
      }

      return (await response.json()) as T;
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') {
        throw new MarketProviderError('Finnhub request timed out', 504, 'UPSTREAM_TIMEOUT');
      }
      if (err instanceof MarketProviderError) {
        throw err;
      }
      throw new MarketProviderError(
        (err as Error).message || 'Network error communicating with Finnhub',
        502,
        'UPSTREAM_NETWORK_ERROR'
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Fetch and normalize a stock quote
   */
  async getQuote(symbol: string): Promise<NormalizedQuote> {
    const cleanSymbol = symbol.trim().toUpperCase();
    const raw = await this.fetchUpstream<FinnhubRawQuote>('/quote', { symbol: cleanSymbol });

    // Finnhub returns 0s for unrecognized symbols
    if ((!raw.c && !raw.t) || (raw.c === 0 && raw.t === 0)) {
      throw new MarketProviderError(
        `No quote data found for symbol "${cleanSymbol}"`,
        404,
        'SYMBOL_NOT_FOUND'
      );
    }

    const price = Number(raw.c.toFixed(2));
    const previousClose = Number(raw.pc.toFixed(2));
    const change = raw.d !== null ? Number(raw.d.toFixed(2)) : Number((price - previousClose).toFixed(2));
    const changePercent = raw.dp !== null ? Number(raw.dp.toFixed(2)) : Number(((change / previousClose) * 100).toFixed(2));

    return {
      symbol: cleanSymbol,
      price,
      change,
      changePercent,
      open: Number(raw.o.toFixed(2)),
      high: Number(raw.h.toFixed(2)),
      low: Number(raw.l.toFixed(2)),
      previousClose,
      timestamp: new Date(raw.t * 1000).toISOString(),
      providerTimestamp: raw.t,
      dataStatus: 'live',
      provider: 'finnhub',
      cached: false,
    };
  }

  /**
   * Fetch and normalize stock candles
   */
  async getCandles(symbol: string, range: string): Promise<NormalizedCandles> {
    const cleanSymbol = symbol.trim().toUpperCase();
    const nowSec = Math.floor(Date.now() / 1000);

    let fromSec = nowSec - 86400 * 30; // default 1M
    let resolution = 'D';

    switch (range.toUpperCase()) {
      case '1D':
        fromSec = nowSec - 86400 * 2; // Last 2 days to capture market hours
        resolution = '15';
        break;
      case '1W':
        fromSec = nowSec - 86400 * 7;
        resolution = '60';
        break;
      case '1M':
        fromSec = nowSec - 86400 * 30;
        resolution = 'D';
        break;
      case '3M':
        fromSec = nowSec - 86400 * 90;
        resolution = 'D';
        break;
      case '6M':
        fromSec = nowSec - 86400 * 180;
        resolution = 'D';
        break;
      case '1Y':
        fromSec = nowSec - 86400 * 365;
        resolution = 'D';
        break;
      case 'ALL':
        fromSec = nowSec - 86400 * 1095; // 3 years
        resolution = 'W';
        break;
      default:
        fromSec = nowSec - 86400 * 30;
        resolution = 'D';
        break;
    }

    const raw = await this.fetchUpstream<FinnhubRawCandles>('/stock/candle', {
      symbol: cleanSymbol,
      resolution,
      from: fromSec.toString(),
      to: nowSec.toString(),
    });

    if (raw.s === 'no_data' || !raw.c || raw.c.length === 0) {
      throw new MarketProviderError(
        `No candle history available for "${cleanSymbol}" in range ${range}`,
        404,
        'NO_CANDLE_DATA'
      );
    }

    // Build chronological points
    const points: CandlePoint[] = [];
    const count = raw.c.length;

    for (let i = 0; i < count; i++) {
      const d = new Date(raw.t[i] * 1000);
      let label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (range.toUpperCase() === '1D') {
        label = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      } else if (range.toUpperCase() === 'ALL') {
        label = d.toLocaleDateString('en-US', { year: '2-digit', month: 'short' });
      }

      points.push({
        timestamp: d.toISOString(),
        label,
        price: Number(raw.c[i].toFixed(2)),
        volume: raw.v[i] || 0,
      });
    }

    // Sort chronologically ascending
    points.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const startingPrice = points[0].price;
    const endingPrice = points[points.length - 1].price;
    const priceChange = Number((endingPrice - startingPrice).toFixed(2));
    const percentChange = Number(((priceChange / startingPrice) * 100).toFixed(2));

    return {
      symbol: cleanSymbol,
      range: range.toUpperCase(),
      dataStatus: 'live',
      provider: 'finnhub',
      startingPrice,
      endingPrice,
      priceChange,
      percentChange,
      points,
    };
  }

  /**
   * Search symbols with autocomplete query
   */
  async searchSymbols(query: string): Promise<NormalizedSearchResult[]> {
    const raw = await this.fetchUpstream<FinnhubRawSearch>('/search', { q: query.trim() });
    if (!raw.result || raw.result.length === 0) {
      return [];
    }

    return raw.result
      .filter((r) => !r.symbol.includes('.') || r.type === 'Common Stock')
      .slice(0, 8)
      .map((r) => ({
        symbol: r.symbol,
        description: r.description,
        type: r.type,
        displaySymbol: r.displaySymbol,
      }));
  }

  /**
   * Fetch company profile metadata (exchange, industry, marketCap)
   */
  async getProfile(symbol: string): Promise<import('../types/market.js').NormalizedCompanyProfile> {
    const cleanSymbol = symbol.trim().toUpperCase();
    const raw = await this.fetchUpstream<{
      ticker?: string;
      name?: string;
      exchange?: string;
      finnhubIndustry?: string;
      marketCapitalization?: number;
      currency?: string;
      logo?: string;
      weburl?: string;
    }>('/stock/profile2', { symbol: cleanSymbol });

    return {
      symbol: cleanSymbol,
      name: raw.name || cleanSymbol,
      exchange: raw.exchange || 'US',
      finnhubIndustry: raw.finnhubIndustry || 'General',
      marketCapitalization: typeof raw.marketCapitalization === 'number' ? raw.marketCapitalization : undefined,
      currency: raw.currency || 'USD',
      logo: raw.logo,
      weburl: raw.weburl,
    };
  }
}

export const finnhubProvider = new FinnhubProvider();
