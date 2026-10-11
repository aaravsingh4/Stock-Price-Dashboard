import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StockTable } from '../components/dashboard/StockTable';
import { INITIAL_STOCKS } from '../services/mockMarketData';

describe('StockTable Component', () => {
  it('renders all equities with formatted prices, change badges, and company names', () => {
    render(<StockTable stocks={INITIAL_STOCKS} />);

    expect(screen.getByText('Equities & Watchlist')).toBeInTheDocument();
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    expect(screen.getByText('MSFT')).toBeInTheDocument();
    expect(screen.getByText('NVDA')).toBeInTheDocument();
  });

  it('filters stock rows by ticker or company name search input', () => {
    render(<StockTable stocks={INITIAL_STOCKS} />);

    const searchInput = screen.getByPlaceholderText(/filter by ticker or name/i);
    fireEvent.change(searchInput, { target: { value: 'NVDA' } });

    expect(screen.getByText('NVDA')).toBeInTheDocument();
    expect(screen.queryByText('MSFT')).not.toBeInTheDocument();
  });

  it('filters stock rows by sector pill selection', () => {
    render(<StockTable stocks={INITIAL_STOCKS} />);

    const semPill = screen.getByRole('button', { name: 'Semiconductors' });
    fireEvent.click(semPill);

    expect(screen.getByText('NVDA')).toBeInTheDocument();
    expect(screen.queryByText('AAPL')).not.toBeInTheDocument();
  });

  it('triggers onToggleWatchlist when star is clicked', () => {
    const handleToggleWatchlist = vi.fn();
    render(
      <StockTable
        stocks={INITIAL_STOCKS}
        onToggleWatchlist={handleToggleWatchlist}
      />
    );

    const starBtn = screen.getByRole('button', { name: /toggle watchlist for AAPL/i });
    fireEvent.click(starBtn);

    expect(handleToggleWatchlist).toHaveBeenCalledWith('AAPL');
  });

  it('triggers onSelectStock when row is clicked', () => {
    const handleSelectStock = vi.fn();
    render(
      <StockTable
        stocks={INITIAL_STOCKS}
        onSelectStock={handleSelectStock}
      />
    );

    const aaplRow = screen.getByText('AAPL');
    fireEvent.click(aaplRow);

    expect(handleSelectStock).toHaveBeenCalled();
    expect(handleSelectStock.mock.calls[0][0].symbol).toBe('AAPL');
  });
});
