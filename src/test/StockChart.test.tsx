import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StockChart } from '../components/dashboard/StockChart';
import { generateHistoricalData, INITIAL_STOCKS } from '../services/mockMarketData';
import { ThemeProvider } from '../context/ThemeContext';
import { TimeRange } from '../types/stock';

// Mock react-chartjs-2 to avoid canvas context rendering in JSDOM
vi.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: { data: unknown; options: unknown }) => (
    <div data-testid="mock-chart-line" data-chart={JSON.stringify({ data, options })}>
      Mock Line Chart
    </div>
  ),
}));

describe('StockChart & Historical Data Service', () => {
  const sampleStock = INITIAL_STOCKS[0]; // AAPL

  it('generates deterministic historical price points across all supported time ranges', () => {
    const ranges: TimeRange[] = ['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'];

    ranges.forEach((range) => {
      const series1 = generateHistoricalData(sampleStock, range);
      const series2 = generateHistoricalData(sampleStock, range);

      expect(series1.points.length).toBeGreaterThan(0);
      expect(series1.timeRange).toBe(range);
      expect(series1.dataStatus).toBe('SIMULATED');

      // Final point equals the stock's actual current price
      const lastPoint = series1.points[series1.points.length - 1];
      expect(lastPoint.price).toBe(sampleStock.price);

      // Determinism: two runs on same stock & range produce identical outputs
      expect(series1.points).toEqual(series2.points);
      expect(series1.priceChange).toBe(series2.priceChange);
      expect(series1.percentChange).toBe(series2.percentChange);
    });
  });

  it('renders stock symbol, company name, formatted price, and chart canvas', () => {
    render(
      <ThemeProvider>
        <StockChart stock={sampleStock} />
      </ThemeProvider>
    );

    expect(screen.getByText(sampleStock.symbol)).toBeInTheDocument();
    expect(screen.getByText(sampleStock.companyName)).toBeInTheDocument();
    expect(screen.getAllByText(/\$227\.63/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId('mock-chart-line')).toBeInTheDocument();
    expect(screen.getByText(/SIMULATED/i)).toBeInTheDocument();
  });

  it('triggers onTimeRangeChange when a time range button is clicked', () => {
    const handleTimeRangeChange = vi.fn();

    render(
      <ThemeProvider>
        <StockChart
          stock={sampleStock}
          timeRange="1M"
          onTimeRangeChange={handleTimeRangeChange}
        />
      </ThemeProvider>
    );

    const button1Y = screen.getByRole('button', { name: '1Y' });
    fireEvent.click(button1Y);

    expect(handleTimeRangeChange).toHaveBeenCalledWith('1Y');
  });

  it('triggers onToggleWatchlist when watchlist star button is clicked', () => {
    const handleToggleWatchlist = vi.fn();

    render(
      <ThemeProvider>
        <StockChart
          stock={sampleStock}
          onToggleWatchlist={handleToggleWatchlist}
        />
      </ThemeProvider>
    );

    const starBtn = screen.getByRole('button', { name: new RegExp(`toggle watchlist for ${sampleStock.symbol}`, 'i') });
    fireEvent.click(starBtn);

    expect(handleToggleWatchlist).toHaveBeenCalledWith(sampleStock.symbol);
  });
});
