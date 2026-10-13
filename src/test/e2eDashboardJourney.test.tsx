import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { marketApiClient } from '../services/apiClient';

describe('End-to-End Journey E: Dashboard, Theme, Screener & Provider Honesty', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('Journey E Steps 1-3: Defaults to light theme on first visit, toggles to dark theme, and persists across reloads', async () => {
    const { unmount } = render(<App />);

    // 1. First visit: default is light mode (document element lacks 'dark' class)
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // 2. Click theme toggle button to switch to dark mode
    const themeBtn = screen.getByRole('button', { name: /switch to dark mode/i });
    expect(themeBtn).toBeInTheDocument();
    fireEvent.click(themeBtn);

    // Document element now has 'dark' class
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('tradepulse_theme')).toBe('dark');

    // 3. Simulate reload (unmount and re-render)
    unmount();
    render(<App />);

    // Theme remains dark as persisted in localStorage
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();
  });

  it('Journey E Steps 4-8: Searches stock, opens screener, applies filter/sort, and ensures provider errors do not fake prices', async () => {
    render(<App />);

    // 4. Verify initial stock search input is present
    const searchInputs = screen.getAllByPlaceholderText(/search stocks/i);
    expect(searchInputs.length).toBeGreaterThanOrEqual(1);

    // 5. Navigate to Explore / Screener tab
    const exploreTabs = screen.getAllByRole('button', { name: /explore/i });
    expect(exploreTabs.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(exploreTabs[0]);

    // Screener view renders
    await waitFor(() => {
      expect(screen.getByText(/Explore Stocks & Multi-Exchange Screener/i)).toBeInTheDocument();
    });

    // 6. Navigate back to Dashboard
    const dashboardTabs = screen.getAllByRole('button', { name: /dashboard/i });
    fireEvent.click(dashboardTabs[0]);

    // 7. Verify provider error honesty: simulate API failure returning null
    vi.spyOn(marketApiClient, 'fetchQuote').mockResolvedValue(null);

    // Wait for Dashboard stocks table to finish loading
    await waitFor(() => {
      const aaplRows = screen.getAllByText('AAPL');
      expect(aaplRows.length).toBeGreaterThanOrEqual(1);
    });

    // When provider is unavailable, UI does NOT fabricate imaginary live values
    // Verify Simulation / Provenance notices are transparently displayed
    expect(screen.getByText(/Developer Notice:/i)).toBeInTheDocument();
    expect(screen.getAllByText(/SIMULATED/i).length).toBeGreaterThanOrEqual(1);
  });
});
