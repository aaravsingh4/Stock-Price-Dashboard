export type MarketDataStatus =
  | 'live'
  | 'delayed'
  | 'cached'
  | 'simulated'
  | 'stale'
  | 'unavailable';

export interface NormalizedQuote {
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
  dataStatus: MarketDataStatus;
  provider: 'finnhub' | 'simulated';
  cached: boolean;
}

export interface CandlePoint {
  timestamp: string;
  label: string;
  price: number;
  volume: number;
}

export interface NormalizedCandles {
  symbol: string;
  range: string;
  dataStatus: MarketDataStatus;
  provider: 'finnhub' | 'simulated';
  startingPrice: number;
  endingPrice: number;
  priceChange: number;
  percentChange: number;
  points: CandlePoint[];
}

export interface NormalizedSearchResult {
  symbol: string;
  description: string;
  type: string;
  displaySymbol: string;
}

export interface NormalizedCompanyProfile {
  symbol: string;
  name: string;
  exchange: string;
  finnhubIndustry: string;
  marketCapitalization?: number;
  currency: string;
  logo?: string;
  weburl?: string;
}

export interface NormalizedTradeEvent {
  type: 'trade';
  symbol: string;
  price: number;
  timestamp: string;
  providerTimestamp: number;
  volume: number;
  conditions?: string[];
  provider: 'finnhub' | 'simulated';
  dataStatus: MarketDataStatus;
}

export type ClientStreamMessage =
  | { action: 'subscribe'; symbols: string[] }
  | { action: 'unsubscribe'; symbols: string[] }
  | { action: 'ping' };

export type ServerStreamMessage =
  | { type: 'trade'; data: NormalizedTradeEvent }
  | { type: 'subscribed'; symbols: string[] }
  | { type: 'unsubscribed'; symbols: string[] }
  | { type: 'pong' }
  | { type: 'status'; provider: 'finnhub' | 'simulated'; connected: boolean; streamingAvailable: boolean }
  | { type: 'error'; message: string; code?: string };

export class MarketProviderError extends Error {
  status: number;
  code: string;
  isRateLimit: boolean;

  constructor(message: string, status = 500, code = 'PROVIDER_ERROR') {
    super(message);
    this.name = 'MarketProviderError';
    this.status = status;
    this.code = code;
    this.isRateLimit = status === 429;
  }
}

