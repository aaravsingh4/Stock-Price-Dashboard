import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MarketMovers } from '../components/dashboard/MarketMovers';
import { INITIAL_STOCKS } from '../services/mockMarketData';

describe('MarketMovers Component', () => {
  it('renders top gainers by default and displays correct mover stats', () => {
    render(<MarketMovers stocks={INITIAL_STOCKS} />);

    expect(screen.getByText('Market Movers')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /top gainers/i })).toBeInTheDocument();

    // In INITIAL_STOCKS, NVDA has +3.15% (highest gainer)
    expect(screen.getByText('NVDA')).toBeInTheDocument();
  });

  it('switches between categories and shows top losers and most active stocks', () => {
    render(<MarketMovers stocks={INITIAL_STOCKS} />);

    // Click Top Losers tab
    const losersTab = screen.getByRole('button', { name: /top losers/i });
    fireEvent.click(losersTab);

    // In INITIAL_STOCKS, TSLA has -2.44% (top loser)
    expect(screen.getByText('TSLA')).toBeInTheDocument();

    // Click Most Active tab
    const activeTab = screen.getByRole('button', { name: /most active/i });
    fireEvent.click(activeTab);

    // In INITIAL_STOCKS, TSLA (72M) or NVDA (67M) are top volume
    expect(screen.getByText('TSLA')).toBeInTheDocument();
    expect(screen.getByText('NVDA')).toBeInTheDocument();
  });

  it('calls onSelectStock when a mover stock card is clicked', () => {
    const handleSelectStock = vi.fn();
    render(<MarketMovers stocks={INITIAL_STOCKS} onSelectStock={handleSelectStock} />);

    // Click NVDA card in top gainers
    const nvdaSymbol = screen.getByText('NVDA');
    fireEvent.click(nvdaSymbol);

    expect(handleSelectStock).toHaveBeenCalled();
    expect(handleSelectStock.mock.calls[0][0].symbol).toBe('NVDA');
  });
});
