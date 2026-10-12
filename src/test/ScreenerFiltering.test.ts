import { describe, it, expect } from 'vitest';
import { filterScreenerStocks, sortScreenerStocks } from '../utils/screenerFiltering';
import { ScreenerStockItem } from '../types/screener';

const SAMPLE_STOCKS: ScreenerStockItem[] = [
  {
    symbol: 'AAPL',
    companyName: 'Apple Inc.',
    exchange: 'NASDAQ',
    sector: 'Technology',
    currency: 'USD',
    price: 220.5,
    change: 2.5,
    changePercent: 1.15,
    open: 218.0,
    dayHigh: 221.0,
    dayLow: 217.5,
    previousClose: 218.0,
    volume: 50000000,
    marketCap: 3400000000000,
    dataStatus: 'LIVE',
    provider: 'finnhub',
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: 'JPM',
    companyName: 'JPMorgan Chase & Co.',
    exchange: 'NYSE',
    sector: 'Financial Services',
    currency: 'USD',
    price: 210.0,
    change: -1.5,
    changePercent: -0.71,
    open: 211.5,
    dayHigh: 212.0,
    dayLow: 209.0,
    previousClose: 211.5,
    volume: 12000000,
    marketCap: 600000000000,
    dataStatus: 'CACHED',
    provider: 'finnhub',
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: 'NVDA',
    companyName: 'NVIDIA Corporation',
    exchange: 'NASDAQ',
    sector: 'Semiconductors',
    currency: 'USD',
    price: 130.0,
    change: 4.2,
    changePercent: 3.34,
    open: 126.0,
    dayHigh: 131.0,
    dayLow: 125.0,
    previousClose: 125.8,
    volume: 75000000,
    marketCap: 3200000000000,
    dataStatus: 'LIVE',
    provider: 'finnhub',
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: 'NO_MCAP',
    companyName: 'Test Micro Cap Inc',
    exchange: 'BATS',
    sector: 'Industrials',
    currency: 'USD',
    price: 15.0,
    change: 0.1,
    changePercent: 0.67,
    open: 14.9,
    dayHigh: 15.2,
    dayLow: 14.8,
    previousClose: 14.9,
    volume: 50000,
    marketCap: undefined, // missing market cap
    dataStatus: 'UNAVAILABLE',
    provider: 'finnhub',
    lastUpdated: new Date().toISOString(),
  },
];

describe('Screener Filtering & Sorting Utilities', () => {
  it('filters by search query matching symbol or company name', () => {
    const res = filterScreenerStocks(SAMPLE_STOCKS, {
      searchQuery: 'app',
      exchange: 'ALL',
      sector: 'ALL',
    });
    expect(res).toHaveLength(1);
    expect(res[0].symbol).toBe('AAPL');
  });

  it('filters by exchange correctly', () => {
    const res = filterScreenerStocks(SAMPLE_STOCKS, {
      searchQuery: '',
      exchange: 'NYSE',
      sector: 'ALL',
    });
    expect(res).toHaveLength(1);
    expect(res[0].symbol).toBe('JPM');
  });

  it('filters by price range (min and max)', () => {
    const res = filterScreenerStocks(SAMPLE_STOCKS, {
      searchQuery: '',
      exchange: 'ALL',
      sector: 'ALL',
      minPrice: 100,
      maxPrice: 215,
    });
    expect(res.map((s) => s.symbol)).toEqual(['JPM', 'NVDA']);
  });

  it('filters by daily percentage change (% min)', () => {
    const res = filterScreenerStocks(SAMPLE_STOCKS, {
      searchQuery: '',
      exchange: 'ALL',
      sector: 'ALL',
      minChangePercent: 2.0,
    });
    expect(res).toHaveLength(1);
    expect(res[0].symbol).toBe('NVDA');
  });

  it('handles missing market cap without coercing to zero', () => {
    // When minMarketCap is 1B, the stock with undefined marketCap should be excluded
    const res = filterScreenerStocks(SAMPLE_STOCKS, {
      searchQuery: '',
      exchange: 'ALL',
      sector: 'ALL',
      minMarketCap: 1000000000,
    });
    expect(res.some((s) => s.symbol === 'NO_MCAP')).toBe(false);
  });

  it('sorts numeric fields stably descending and handles missing values at end', () => {
    const sorted = sortScreenerStocks(SAMPLE_STOCKS, {
      field: 'marketCap',
      order: 'desc',
    });
    expect(sorted[0].symbol).toBe('AAPL');
    expect(sorted[1].symbol).toBe('NVDA');
    expect(sorted[2].symbol).toBe('JPM');
    // Stock with undefined marketCap must be at the very end
    expect(sorted[3].symbol).toBe('NO_MCAP');
  });

  it('sorts string fields ascending', () => {
    const sorted = sortScreenerStocks(SAMPLE_STOCKS, {
      field: 'symbol',
      order: 'asc',
    });
    expect(sorted.map((s) => s.symbol)).toEqual(['AAPL', 'JPM', 'NO_MCAP', 'NVDA']);
  });
});
