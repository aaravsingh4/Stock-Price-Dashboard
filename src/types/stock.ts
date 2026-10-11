export type DataStatus = 'LIVE' | 'DELAYED' | 'CACHED' | 'SIMULATED' | 'ERROR';

export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  dataStatus: DataStatus;
}

export interface StockQuote {
  symbol: string;
  companyName: string;
  price: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  open: number;
  previousClose: number;
  volume: number;
  marketCap: number; // in USD
  peRatio?: number;
  sector: string;
  dataStatus: DataStatus;
  lastUpdated: string; // ISO timestamp
  isWatchlisted?: boolean;
}

export interface MarketOverviewStats {
  totalMarketVolume: number;
  activeGainersCount: number;
  activeLosersCount: number;
  marketSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  isMarketOpen: boolean;
  marketSession: string; // e.g. "Regular Trading Hours (NYSE/NASDAQ)"
  lastRefreshed: string;
}
