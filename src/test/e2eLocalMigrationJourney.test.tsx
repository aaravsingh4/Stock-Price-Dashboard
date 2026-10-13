import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LocalDataMigrationModal } from '../components/auth/LocalDataMigrationModal';
import { cloudClient } from '../services/cloudClient';

describe('End-to-End Journey D: Local Data Migration & Idempotence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('Journey D Steps 1-5: Discovers valid local guest data, shows import confirmation, imports data with deduplication', async () => {
    // 1. Seed valid guest data into localStorage
    const localAlerts = [
      { id: 'loc-1', symbol: 'AAPL', condition: 'ABOVE', targetPrice: 190.0 },
      { id: 'loc-2', symbol: 'MSFT', condition: 'BELOW', targetPrice: 400.0 },
    ];
    localStorage.setItem('tradepulse_price_alerts_v1', JSON.stringify(localAlerts));

    // 2. Mock cloud migration client response
    const mockMigrationSuccess = {
      success: true,
      summary: {
        watchlists: { imported: 0, skipped: 0, failed: 0 },
        symbols: { imported: 0, skipped: 0, failed: 0 },
        alerts: { imported: 2, skipped: 0, failed: 0 },
      },
    };
    const migrateSpy = vi.spyOn(cloudClient, 'migrateLocalData').mockResolvedValue(mockMigrationSuccess);

    const onComplete = vi.fn();
    const onClose = vi.fn();

    // Render modal
    render(
      <LocalDataMigrationModal
        isOpen={true}
        onClose={onClose}
        onMigrationComplete={onComplete}
      />
    );

    // 3. Verify confirmation prompt appears with correct count
    expect(screen.getByText(/Migrate Browser Data to Cloud/i)).toBeInTheDocument();
    expect(screen.getByText(/We discovered 2 offline alert rule\(s\)/i)).toBeInTheDocument();

    // 4. Click import
    const importBtn = screen.getByRole('button', { name: /Import to Cloud/i });
    fireEvent.click(importBtn);

    // 5. Verify import called and summary rendered
    await waitFor(() => {
      expect(migrateSpy).toHaveBeenCalledWith({
        alerts: [
          { symbol: 'AAPL', condition: 'ABOVE', targetPrice: 190.0 },
          { symbol: 'MSFT', condition: 'BELOW', targetPrice: 400.0 },
        ],
      });
      expect(screen.getByText(/Migration Completed Successfully!/i)).toBeInTheDocument();
      expect(screen.getByText(/Alerts Imported: 2/i)).toBeInTheDocument();
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  it('Journey D Steps 6-8: Simulates failed migration, verifies local data remains intact, and retries idempotently', async () => {
    // 6. Seed valid local data
    const localAlerts = [
      { id: 'loc-1', symbol: 'NVDA', condition: 'ABOVE', targetPrice: 150.0 },
    ];
    localStorage.setItem('tradepulse_price_alerts_v1', JSON.stringify(localAlerts));

    // Simulate network error on first attempt
    const migrateSpy = vi
      .spyOn(cloudClient, 'migrateLocalData')
      .mockRejectedValueOnce(new Error('Network connection interrupted'))
      .mockResolvedValueOnce({
        success: true,
        summary: {
          watchlists: { imported: 0, skipped: 0, failed: 0 },
          symbols: { imported: 0, skipped: 0, failed: 0 },
          alerts: { imported: 1, skipped: 0, failed: 0 },
        },
      });

    const onComplete = vi.fn();
    const onClose = vi.fn();

    render(
      <LocalDataMigrationModal
        isOpen={true}
        onClose={onClose}
        onMigrationComplete={onComplete}
      />
    );

    // Click Import -> fails
    const importBtn = screen.getByRole('button', { name: /Import to Cloud/i });
    fireEvent.click(importBtn);

    // Verify error displayed
    await waitFor(() => {
      expect(screen.getByText(/Network connection interrupted/i)).toBeInTheDocument();
    });

    // 7. Verify original local data remains completely intact after failure
    const rawAfterFail = localStorage.getItem('tradepulse_price_alerts_v1');
    expect(rawAfterFail).not.toBeNull();
    expect(JSON.parse(rawAfterFail!)[0].symbol).toBe('NVDA');

    // 8. Retry import
    fireEvent.click(importBtn);

    await waitFor(() => {
      expect(screen.getByText(/Migration Completed Successfully!/i)).toBeInTheDocument();
      expect(screen.getByText(/Alerts Imported: 1/i)).toBeInTheDocument();
    });
  });
});
