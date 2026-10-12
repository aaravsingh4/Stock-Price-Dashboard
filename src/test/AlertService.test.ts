import { describe, it, expect, beforeEach } from 'vitest';
import { alertService } from '../services/alertService';
import { RealtimeTrade } from '../services/marketStreamClient';

describe('AlertService', () => {
  beforeEach(() => {
    localStorage.clear();
    // Clear in-memory alerts
    alertService.getAlerts().forEach((a) => alertService.deleteAlert(a.id));
    alertService.clearHistory();
  });

  it('creates an alert with positive target price and validates input', () => {
    const alert = alertService.createAlert('AAPL', 185.5, 'ABOVE', 'Take profit');
    expect(alert.symbol).toBe('AAPL');
    expect(alert.targetPrice).toBe(185.5);
    expect(alert.condition).toBe('ABOVE');
    expect(alert.status).toBe('ACTIVE');

    expect(() => alertService.createAlert('', 100, 'ABOVE')).toThrow('Stock symbol is required');
    expect(() => alertService.createAlert('AAPL', -10, 'ABOVE')).toThrow('Target price must be a positive finite number');
  });

  it('triggers ABOVE alert when trade price meets or exceeds target and triggers only once', () => {
    const alert = alertService.createAlert('AAPL', 190.0, 'ABOVE');

    const tradeBelow: RealtimeTrade = {
      type: 'trade',
      symbol: 'AAPL',
      price: 189.95,
      timestamp: new Date().toISOString(),
      providerTimestamp: 1001,
      volume: 10,
      provider: 'finnhub',
      dataStatus: 'live',
    };

    const result1 = alertService.evaluateTrade(tradeBelow);
    expect(result1).toHaveLength(0);
    expect(alertService.getAlerts().find((a) => a.id === alert.id)?.status).toBe('ACTIVE');

    const tradeAtTarget: RealtimeTrade = {
      type: 'trade',
      symbol: 'AAPL',
      price: 190.05,
      timestamp: new Date().toISOString(),
      providerTimestamp: 1002,
      volume: 50,
      provider: 'finnhub',
      dataStatus: 'live',
    };

    const result2 = alertService.evaluateTrade(tradeAtTarget);
    expect(result2).toHaveLength(1);
    expect(result2[0].observedPrice).toBe(190.05);
    expect(alertService.getAlerts().find((a) => a.id === alert.id)?.status).toBe('TRIGGERED');

    // Subsequent trades must NOT trigger the one-shot alert again
    const tradeSubsequent: RealtimeTrade = {
      type: 'trade',
      symbol: 'AAPL',
      price: 195.0,
      timestamp: new Date().toISOString(),
      providerTimestamp: 1003,
      volume: 10,
      provider: 'finnhub',
      dataStatus: 'live',
    };
    const result3 = alertService.evaluateTrade(tradeSubsequent);
    expect(result3).toHaveLength(0);
  });

  it('triggers BELOW alert when trade price drops to or below target', () => {
    const alert = alertService.createAlert('NVDA', 120.0, 'BELOW');

    const trade: RealtimeTrade = {
      type: 'trade',
      symbol: 'NVDA',
      price: 119.5,
      timestamp: new Date().toISOString(),
      providerTimestamp: 2001,
      volume: 20,
      provider: 'finnhub',
      dataStatus: 'live',
    };

    const res = alertService.evaluateTrade(trade);
    expect(res).toHaveLength(1);
    expect(res[0].alert.id).toBe(alert.id);
  });

  it('persists alerts in localStorage', () => {
    alertService.createAlert('MSFT', 420.0, 'ABOVE');
    const stored = JSON.parse(localStorage.getItem('tradepulse_price_alerts_v1') || '[]') as Array<{ symbol: string }>;
    expect(stored.some((a) => a.symbol === 'MSFT')).toBe(true);
  });
});
