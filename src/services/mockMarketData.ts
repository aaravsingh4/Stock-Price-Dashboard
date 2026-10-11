import { MarketIndex, MarketOverviewStats, StockQuote } from '../types/stock';

export const INITIAL_MARKET_INDICES: MarketIndex[] = [
  {
    symbol: 'S&P 500',
    name: 'S&P 500 Index',
    value: 5751.07,
    change: 32.14,
    changePercent: 0.56,
    dataStatus: 'SIMULATED',
  },
  {
    symbol: 'NASDAQ',
    name: 'Nasdaq Composite',
    value: 18137.85,
    change: 142.30,
    changePercent: 0.79,
    dataStatus: 'SIMULATED',
  },
  {
    symbol: 'DOW',
    name: 'Dow Jones Industrial',
    value: 42313.00,
    change: -115.20,
    changePercent: -0.27,
    dataStatus: 'SIMULATED',
  },
  {
    symbol: 'RUSSELL',
    name: 'Russell 2000',
    value: 2218.40,
    change: 8.65,
    changePercent: 0.39,
    dataStatus: 'SIMULATED',
  },
];

export const INITIAL_STOCKS: StockQuote[] = [
  {
    symbol: 'AAPL',
    companyName: 'Apple Inc.',
    price: 227.63,
    change: 1.85,
    changePercent: 0.82,
    dayHigh: 228.40,
    dayLow: 225.10,
    open: 226.00,
    previousClose: 225.78,
    volume: 48920100,
    marketCap: 3460000000000,
    peRatio: 33.4,
    sector: 'Technology',
    dataStatus: 'SIMULATED',
    lastUpdated: new Date().toISOString(),
    isWatchlisted: true,
  },
  {
    symbol: 'MSFT',
    companyName: 'Microsoft Corporation',
    price: 418.15,
    change: 3.42,
    changePercent: 0.83,
    dayHigh: 419.80,
    dayLow: 414.25,
    open: 415.00,
    previousClose: 414.73,
    volume: 21340000,
    marketCap: 3110000000000,
    peRatio: 34.8,
    sector: 'Technology',
    dataStatus: 'SIMULATED',
    lastUpdated: new Date().toISOString(),
    isWatchlisted: true,
  },
  {
    symbol: 'NVDA',
    companyName: 'NVIDIA Corporation',
    price: 134.80,
    change: 4.12,
    changePercent: 3.15,
    dayHigh: 135.50,
    dayLow: 130.20,
    open: 131.00,
    previousClose: 130.68,
    volume: 67840100,
    marketCap: 3310000000000,
    peRatio: 58.2,
    sector: 'Semiconductors',
    dataStatus: 'SIMULATED',
    lastUpdated: new Date().toISOString(),
    isWatchlisted: false,
  },
  {
    symbol: 'AMZN',
    companyName: 'Amazon.com, Inc.',
    price: 186.65,
    change: -1.24,
    changePercent: -0.66,
    dayHigh: 188.40,
    dayLow: 185.90,
    open: 188.00,
    previousClose: 187.89,
    volume: 38200500,
    marketCap: 1950000000000,
    peRatio: 42.1,
    sector: 'Consumer Discretionary',
    dataStatus: 'SIMULATED',
    lastUpdated: new Date().toISOString(),
    isWatchlisted: false,
  },
  {
    symbol: 'GOOGL',
    companyName: 'Alphabet Inc.',
    price: 164.20,
    change: 1.10,
    changePercent: 0.67,
    dayHigh: 165.30,
    dayLow: 163.15,
    open: 163.50,
    previousClose: 163.10,
    volume: 19800200,
    marketCap: 2040000000000,
    peRatio: 23.7,
    sector: 'Communication Services',
    dataStatus: 'SIMULATED',
    lastUpdated: new Date().toISOString(),
    isWatchlisted: true,
  },
  {
    symbol: 'TSLA',
    companyName: 'Tesla, Inc.',
    price: 217.80,
    change: -5.45,
    changePercent: -2.44,
    dayHigh: 223.10,
    dayLow: 216.50,
    open: 222.00,
    previousClose: 223.25,
    volume: 72150900,
    marketCap: 694000000000,
    peRatio: 64.9,
    sector: 'Automotive',
    dataStatus: 'SIMULATED',
    lastUpdated: new Date().toISOString(),
    isWatchlisted: false,
  },
  {
    symbol: 'JPM',
    companyName: 'JPMorgan Chase & Co.',
    price: 222.40,
    change: 2.15,
    changePercent: 0.98,
    dayHigh: 223.50,
    dayLow: 219.80,
    open: 220.50,
    previousClose: 220.25,
    volume: 11200400,
    marketCap: 635000000000,
    peRatio: 12.3,
    sector: 'Financials',
    dataStatus: 'SIMULATED',
    lastUpdated: new Date().toISOString(),
    isWatchlisted: false,
  },
  {
    symbol: 'LLY',
    companyName: 'Eli Lilly and Company',
    price: 890.30,
    change: -4.20,
    changePercent: -0.47,
    dayHigh: 898.00,
    dayLow: 887.10,
    open: 895.00,
    previousClose: 894.50,
    volume: 2410800,
    marketCap: 846000000000,
    peRatio: 112.5,
    sector: 'Healthcare',
    dataStatus: 'SIMULATED',
    lastUpdated: new Date().toISOString(),
    isWatchlisted: false,
  },
];

export const INITIAL_MARKET_STATS: MarketOverviewStats = {
  totalMarketVolume: 324500000,
  activeGainersCount: 5,
  activeLosersCount: 3,
  marketSentiment: 'BULLISH',
  isMarketOpen: true,
  marketSession: 'Regular Trading Hours (NYSE/NASDAQ)',
  lastRefreshed: new Date().toISOString(),
};

/**
 * Service simulating async fetch from market data feed
 */
export async function fetchSimulatedMarketData(): Promise<{
  indices: MarketIndex[];
  stocks: StockQuote[];
  stats: MarketOverviewStats;
}> {
  // Simulate network latency (300ms)
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    indices: INITIAL_MARKET_INDICES,
    stocks: INITIAL_STOCKS,
    stats: INITIAL_MARKET_STATS,
  };
}

/**
 * Deterministic pseudo-random helper to ensure identical chart curves across renders
 */
function pseudoRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Generates realistic, deterministic historical price trajectories for any stock and time range
 */
export function generateHistoricalData(
  stock: StockQuote,
  range: import('../types/stock').TimeRange = '1M'
): import('../types/stock').StockHistoricalData {
  const symbolSeed = stock.symbol.split('').reduce((acc, char, idx) => acc + char.charCodeAt(0) * (idx + 1), 0);

  // Time range configurations
  const rangeConfig: Record<
    import('../types/stock').TimeRange,
    { count: number; labels: string[]; driftFactor: number }
  > = {
    '1D': {
      count: 7,
      labels: ['09:30 AM', '10:30 AM', '11:30 AM', '12:30 PM', '01:30 PM', '02:30 PM', '04:00 PM'],
      driftFactor: 0.015,
    },
    '1W': {
      count: 5,
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      driftFactor: 0.035,
    },
    '1M': {
      count: 8,
      labels: ['Week 1', 'Day 8', 'Day 12', 'Week 2', 'Day 18', 'Week 3', 'Day 26', 'Today'],
      driftFactor: 0.06,
    },
    '3M': {
      count: 7,
      labels: ['Month -3', 'W2', 'Month -2', 'W6', 'Month -1', 'W10', 'Current'],
      driftFactor: 0.09,
    },
    '6M': {
      count: 7,
      labels: ['6M ago', '5M ago', '4M ago', '3M ago', '2M ago', '1M ago', 'Now'],
      driftFactor: 0.14,
    },
    '1Y': {
      count: 8,
      labels: ['Oct', 'Dec', 'Feb', 'Apr', 'Jun', 'Aug', 'Sep', 'Oct'],
      driftFactor: 0.22,
    },
    'ALL': {
      count: 9,
      labels: ['2021', '2022 Q2', '2022 Q4', '2023 Q2', '2023 Q4', '2024 Q1', '2024 Q2', '2024 Q3', '2024 Q4'],
      driftFactor: 0.45,
    },
  };

  const config = rangeConfig[range];
  const points: import('../types/stock').HistoricalPricePoint[] = [];

  // Anchor the last point to the actual current stock price
  const endPrice = stock.price;
  const isUpTrend = stock.change >= 0;

  // Calculate starting anchor price based on trend and drift
  const totalChangeRate = (isUpTrend ? 1 : -1) * (Math.abs(stock.changePercent) / 100 + config.driftFactor);
  const startPrice = Math.max(1, endPrice / (1 + totalChangeRate));

  for (let i = 0; i < config.count; i++) {
    const progress = i / (config.count - 1);
    const seed = symbolSeed * 17 + i * 31 + range.charCodeAt(0) * 7;
    const noise = (pseudoRandom(seed) - 0.5) * (config.driftFactor * 0.4);

    // Linear interpolation from startPrice to endPrice plus noise
    let price: number;
    if (i === config.count - 1) {
      price = endPrice; // Exact current price for the last point
    } else if (i === 0) {
      price = Number(startPrice.toFixed(2));
    } else {
      const interpolated = startPrice + (endPrice - startPrice) * progress;
      price = Number((interpolated * (1 + noise)).toFixed(2));
    }

    points.push({
      timestamp: new Date(Date.now() - (config.count - 1 - i) * 86400000).toISOString(),
      label: config.labels[i] || `P${i + 1}`,
      price,
      volume: Math.round(stock.volume * (0.8 + pseudoRandom(seed + 99) * 0.4)),
    });
  }

  const startingPrice = points[0].price;
  const priceChange = Number((endPrice - startingPrice).toFixed(2));
  const percentChange = Number(((priceChange / startingPrice) * 100).toFixed(2));

  return {
    symbol: stock.symbol,
    timeRange: range,
    dataStatus: 'SIMULATED',
    points,
    startingPrice,
    endingPrice: endPrice,
    priceChange,
    percentChange,
  };
}
