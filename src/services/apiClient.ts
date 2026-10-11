import { DataStatus, StockHistoricalData, TimeRange } from '../types/stock';

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  provider: {
    name: string;
    configured: boolean;
    mode: 'provider' | 'demo-fallback';
  };
  uptimeSeconds: number;
}

export interface LiveQuotePayload {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  timestamp: string;
  providerTimestamp: number;
  dataStatus: 'live' | 'delayed' | 'cached' | 'simulated' | 'stale' | 'unavailable';
  provider: 'finnhub' | 'simulated';
  cached: boolean;
}

export interface LiveCandlesPayload {
  symbol: string;
  range: string;
  dataStatus: 'live' | 'delayed' | 'cached' | 'simulated' | 'stale' | 'unavailable';
  provider: 'finnhub' | 'simulated';
  startingPrice: number;
  endingPrice: number;
  priceChange: number;
  percentChange: number;
  points: Array<{
    timestamp: string;
    label: string;
    price: number;
    volume: number;
  }>;
}

export interface LiveSearchResultItem {
  symbol: string;
  description: string;
  type: string;
  displaySymbol: string;
}

function mapStatusToClient(status: string): DataStatus {
  switch (status.toLowerCase()) {
    case 'live':
      return 'LIVE';
    case 'delayed':
      return 'DELAYED';
    case 'cached':
      return 'CACHED';
    case 'stale':
      return 'STALE';
    case 'unavailable':
      return 'UNAVAILABLE';
    default:
      return 'SIMULATED';
  }
}

class MarketApiClient {
  private isConfiguredCached: boolean | null = null;

  get isConfigured(): boolean | null {
    return this.isConfiguredCached;
  }

  /**
   * Check backend health and Finnhub configuration status
   */
  async checkHealth(): Promise<HealthResponse | null> {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) return null;
      const data = (await res.json()) as HealthResponse;
      this.isConfiguredCached = data.provider?.configured ?? false;
      return data;
    } catch {
      this.isConfiguredCached = false;
      return null;
    }
  }

  /**
   * Fetch quote from backend gateway
   */
  async fetchQuote(symbol: string): Promise<LiveQuotePayload | null> {
    try {
      const res = await fetch(`/api/market/quote?symbol=${encodeURIComponent(symbol)}`);
      if (!res.ok) {
        return null;
      }
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  }

  /**
   * Fetch candles from backend gateway
   */
  async fetchCandles(symbol: string, range: TimeRange): Promise<StockHistoricalData | null> {
    try {
      const res = await fetch(`/api/market/candles?symbol=${encodeURIComponent(symbol)}&range=${encodeURIComponent(range)}`);
      if (!res.ok) {
        return null;
      }
      const json = await res.json();
      const payload = json.data as LiveCandlesPayload | undefined;
      if (!payload || !payload.points || payload.points.length === 0) {
        return null;
      }

      return {
        symbol: payload.symbol,
        timeRange: range,
        dataStatus: mapStatusToClient(payload.dataStatus),
        points: payload.points,
        startingPrice: payload.startingPrice,
        endingPrice: payload.endingPrice,
        priceChange: payload.priceChange,
        percentChange: payload.percentChange,
      };
    } catch {
      return null;
    }
  }

  /**
   * Search stock symbols through backend gateway
   */
  async searchSymbols(query: string): Promise<LiveSearchResultItem[]> {
    if (!query || query.trim().length === 0) return [];
    try {
      const res = await fetch(`/api/market/search?q=${encodeURIComponent(query.trim())}`);
      if (!res.ok) return [];
      const json = await res.json();
      return (json.data as LiveSearchResultItem[]) || [];
    } catch {
      return [];
    }
  }
}

export const marketApiClient = new MarketApiClient();
