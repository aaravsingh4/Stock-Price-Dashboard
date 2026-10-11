import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { App } from '../App';

// Mock react-chartjs-2 to avoid canvas issues in JSDOM
vi.mock('react-chartjs-2', () => ({
  Line: ({ data }: { data: unknown }) => (
    <div data-testid="mock-chart-line" data-chart={JSON.stringify(data)}>
      Mock Line Chart
    </div>
  ),
}));

describe('Dashboard Interactions & Chart Integration', () => {
  it('renders benchmark cards in Market Overview', async () => {
    render(<App />);

    expect(await screen.findByText('Market Benchmarks')).toBeInTheDocument();
    expect(screen.getByText('S&P 500')).toBeInTheDocument();
    expect(screen.getByText('NASDAQ')).toBeInTheDocument();
    expect(screen.getByText('DOW')).toBeInTheDocument();
    expect(screen.getByText('RUSSELL')).toBeInTheDocument();
  });

  it('initially displays AAPL in the main chart and updates when another stock is selected', async () => {
    render(<App />);

    const chartSection = await screen.findByRole('region', { name: 'Interactive Stock Chart' });
    expect(within(chartSection).getByText('AAPL')).toBeInTheDocument();
    expect(within(chartSection).getByText('Apple Inc.')).toBeInTheDocument();

    // Select NVDA from the stock table
    const tableSection = screen.getByRole('region', { name: 'Stock Quotes Table' });
    const nvdaRow = within(tableSection).getByText('NVDA');
    fireEvent.click(nvdaRow);

    // Main chart section is now updated to NVDA
    expect(within(chartSection).getByText('NVDA')).toBeInTheDocument();
    expect(within(chartSection).getByText('NVIDIA Corporation')).toBeInTheDocument();

    // Also detail modal opens with NVDA
    const modal = screen.getByRole('dialog', { name: /NVIDIA Corporation details/i });
    expect(modal).toBeInTheDocument();

    // Close the modal
    const closeBtn = screen.getByRole('button', { name: /close dialog/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Main chart retains NVDA
    expect(within(chartSection).getByText('NVDA')).toBeInTheDocument();
  });

  it('updates chart when a mover card in Market Movers is clicked', async () => {
    render(<App />);

    const chartSection = await screen.findByRole('region', { name: 'Interactive Stock Chart' });
    const moversSection = screen.getByRole('region', { name: 'Market Movers' });

    // Click Top Losers tab in movers
    const losersTab = within(moversSection).getByRole('button', { name: /top losers/i });
    fireEvent.click(losersTab);

    // TSLA is in top losers
    const tslaCard = within(moversSection).getByText('TSLA');
    fireEvent.click(tslaCard);

    // Chart updates to TSLA
    expect(within(chartSection).getByText('TSLA')).toBeInTheDocument();
    expect(within(chartSection).getByText('Tesla, Inc.')).toBeInTheDocument();

    // Close modal
    const closeBtn = screen.getByRole('button', { name: /close dialog/i });
    fireEvent.click(closeBtn);
  });

  it('allows switching chart time ranges in the main chart', async () => {
    render(<App />);

    const chartSection = await screen.findByRole('region', { name: 'Interactive Stock Chart' });

    // Click 1Y range button
    const range1Y = within(chartSection).getByRole('button', { name: '1Y' });
    fireEvent.click(range1Y);

    // Check that range window label reflects 1Y and button is active
    expect(range1Y).toHaveClass('shadow-subtle');
    expect(within(chartSection).getByText(/Range Window:/i)).toHaveTextContent('1Y');
  });

  it('switches navigation tabs and shows milestone notice, with return action', async () => {
    render(<App />);

    await screen.findByText('Market Overview & Analytics');

    // Click Explore in navigation (Header nav)
    const exploreTabs = screen.getAllByRole('button', { name: /Explore/i });
    fireEvent.click(exploreTabs[0]);

    expect(screen.getByText('Explore Securities & Technical Screeners')).toBeInTheDocument();
    expect(screen.getByText(/scheduled for Phase 4/i)).toBeInTheDocument();

    // Click return to dashboard
    const returnBtn = screen.getByRole('button', { name: /Return to Dashboard/i });
    fireEvent.click(returnBtn);

    expect(screen.getByText('Market Overview & Analytics')).toBeInTheDocument();
  });

  it('toggles watchlist state synchronously across components', async () => {
    render(<App />);

    const chartSection = await screen.findByRole('region', { name: 'Interactive Stock Chart' });
    const tableSection = screen.getByRole('region', { name: 'Stock Quotes Table' });

    // AAPL is initially watchlisted in INITIAL_STOCKS
    const chartStar = within(chartSection).getByRole('button', { name: /toggle watchlist for AAPL/i });
    expect(chartStar.querySelector('svg')).toHaveClass('fill-amber-400');

    // Toggle AAPL watchlist in table (toggles off)
    const tableStarBtn = within(tableSection).getByRole('button', { name: /toggle watchlist for AAPL/i });
    fireEvent.click(tableStarBtn);

    // Verify star in chart is no longer filled
    expect(chartStar.querySelector('svg')).not.toHaveClass('fill-amber-400');

    // Toggle again in table (toggles back on)
    fireEvent.click(tableStarBtn);
    expect(chartStar.querySelector('svg')).toHaveClass('fill-amber-400');
  });
});
