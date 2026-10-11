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
