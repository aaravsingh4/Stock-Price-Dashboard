import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StockScreenerWorkspace } from '../components/screener/StockScreenerWorkspace';
import { ScreenerTable } from '../components/screener/ScreenerTable';
import { ScreenerFilterPanel } from '../components/screener/ScreenerFilterPanel';
import { StockComparisonView } from '../components/screener/StockComparisonView';
import { ScreenerStockItem, ScreenerFilterCriteria, ScreenerSortCriteria } from '../types/screener';
import { StockQuote } from '../types/stock';

const MOCK_STOCK_QUOTES: StockQuote[] = [
  {
    symbol: 'AAPL',
    companyName: 'Apple Inc.',
    price: 225.0,
    change: 2.0,
    changePercent: 0.9,
    open: 223.0,
    dayHigh: 226.0,
    dayLow: 222.0,
    previousClose: 223.0,
    volume: 50000000,
    marketCap: 3400000000000,
    sector: 'Technology',
    dataStatus: 'LIVE',
    lastUpdated: new Date().toISOString(),
    isWatchlisted: false,
  },
  {
    symbol: 'JPM',
    companyName: 'JPMorgan Chase & Co.',
    price: 210.0,
    change: -2.0,
    changePercent: -0.94,
    open: 212.0,
    dayHigh: 212.5,
    dayLow: 209.0,
    previousClose: 212.0,
    volume: 15000000,
    marketCap: 600000000000,
    sector: 'Financial Services',
    dataStatus: 'CACHED',
    lastUpdated: new Date().toISOString(),
    isWatchlisted: true,
  },
];

const MOCK_SCREENER_ITEMS: ScreenerStockItem[] = [
  {
    symbol: 'AAPL',
    companyName: 'Apple Inc.',
    exchange: 'NASDAQ',
    sector: 'Technology',
    currency: 'USD',
    price: 225.0,
    change: 2.0,
    changePercent: 0.9,
    open: 223.0,
    dayHigh: 226.0,
    dayLow: 222.0,
    previousClose: 223.0,
    volume: 50000000,
    marketCap: 3400000000000,
    dataStatus: 'LIVE',
    provider: 'finnhub',
    lastUpdated: new Date().toISOString(),
    isWatchlisted: false,
  },
  {
    symbol: 'JPM',
    companyName: 'JPMorgan Chase & Co.',
    exchange: 'NYSE',
    sector: 'Financial Services',
    currency: 'USD',
    price: 210.0,
    change: -2.0,
    changePercent: -0.94,
    open: 212.0,
    dayHigh: 212.5,
    dayLow: 209.0,
    previousClose: 212.0,
    volume: 15000000,
    marketCap: 600000000000,
    dataStatus: 'CACHED',
    provider: 'finnhub',
    lastUpdated: new Date().toISOString(),
    isWatchlisted: true,
  },
];

describe('Stock Screener UI Components', () => {
  describe('ScreenerFilterPanel', () => {
    it('calls onChange when exchange or sector is modified', () => {
      const handleChange = vi.fn();
      const criteria: ScreenerFilterCriteria = {
        searchQuery: '',
        exchange: 'ALL',
        sector: 'ALL',
      };

      render(
        <ScreenerFilterPanel
          criteria={criteria}
          onChange={handleChange}
          onReset={vi.fn()}
          availableExchanges={['NASDAQ', 'NYSE']}
          availableSectors={['Technology', 'Financial Services']}
          resultsCount={2}
          totalCount={2}
        />
      );

      const exchangeSelect = screen.getByLabelText(/Exchange/i);
      fireEvent.change(exchangeSelect, { target: { value: 'NASDAQ' } });

      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({ exchange: 'NASDAQ' })
      );
    });
  });

  describe('ScreenerTable', () => {
    it('triggers sort callback on header click', () => {
      const handleSort = vi.fn();
      const sort: ScreenerSortCriteria = { field: 'price', order: 'desc' };

      render(
        <ScreenerTable
          stocks={MOCK_SCREENER_ITEMS}
          sort={sort}
          onSortChange={handleSort}
          onSelectStock={vi.fn()}
          comparedSymbols={[]}
        />
      );

      fireEvent.click(screen.getByText('Security'));
      expect(handleSort).toHaveBeenCalledWith('symbol');
    });

    it('triggers addToCompare when Compare button is clicked', () => {
      const handleCompare = vi.fn();
      render(
        <ScreenerTable
          stocks={MOCK_SCREENER_ITEMS}
          sort={{ field: 'price', order: 'desc' }}
          onSortChange={vi.fn()}
          onSelectStock={vi.fn()}
          onAddToCompare={handleCompare}
          comparedSymbols={[]}
        />
      );

      const compareButtons = screen.getAllByRole('button', { name: /Compare/i });
      fireEvent.click(compareButtons[0]);
      expect(handleCompare).toHaveBeenCalledWith(MOCK_SCREENER_ITEMS[0]);
    });
  });

  describe('StockComparisonView', () => {
    it('renders comparison matrix and triggers onRemove when item is closed', () => {
      const handleRemove = vi.fn();
      render(
        <StockComparisonView
          comparedStocks={MOCK_SCREENER_ITEMS}
          onRemove={handleRemove}
          onClear={vi.fn()}
          onSelectStock={vi.fn()}
        />
      );

      expect(screen.getByText(/Securities Comparison Matrix \(2 of 4\)/i)).toBeInTheDocument();
      const removeButtons = screen.getAllByTitle('Remove from comparison');
      fireEvent.click(removeButtons[0]);
      expect(handleRemove).toHaveBeenCalledWith('AAPL');
    });
  });

  describe('StockScreenerWorkspace Full Integration', () => {
    it('renders search bar, filter panel, and table rows', () => {
      render(
        <StockScreenerWorkspace
          initialStocks={MOCK_STOCK_QUOTES}
          onSelectStock={vi.fn()}
        />
      );

      expect(screen.getByText(/Explore Stocks & Multi-Exchange Screener/i)).toBeInTheDocument();
      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('JPM')).toBeInTheDocument();
    });
  });
});
