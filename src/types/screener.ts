import { DataStatus } from './stock';

export interface ScreenerStockItem {
  symbol: string;
  companyName: string;
  exchange: string;
  sector: string;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  previousClose: number;
  volume: number;
  marketCap?: number; // USD
  peRatio?: number;
  dataStatus: DataStatus;
  provider: 'finnhub' | 'simulated';
  lastUpdated: string;
  isWatchlisted?: boolean;
}

export type ScreenerSortField =
  | 'symbol'
  | 'companyName'
  | 'price'
  | 'changePercent'
  | 'volume'
  | 'marketCap'
  | 'exchange'
  | 'sector';

export type SortOrder = 'asc' | 'desc';

export interface ScreenerFilterCriteria {
  searchQuery: string;
  exchange: string; // 'ALL' or specific exchange like 'NASDAQ', 'NYSE'
  sector: string; // 'ALL' or specific sector like 'Technology', 'Healthcare'
  minPrice?: number;
  maxPrice?: number;
  minChangePercent?: number;
  maxChangePercent?: number;
  minVolume?: number;
  minMarketCap?: number; // USD
  maxMarketCap?: number;
}

export interface ScreenerSortCriteria {
  field: ScreenerSortField;
  order: SortOrder;
}
