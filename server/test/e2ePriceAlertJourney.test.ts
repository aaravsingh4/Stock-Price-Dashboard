import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { AuthService } from '../src/services/authService.js';
import { AlertRepository } from '../src/repositories/alertRepository.js';
import { CloudAlertService } from '../src/services/cloudAlertService.js';
import { finnhubWsClient } from '../src/providers/finnhubWsClient.js';
import { AlertCondition, AlertStatus, Prisma } from '@prisma/client';
import type { PriceAlert } from '@prisma/client';

describe('End-to-End Journey C: Price Alerts & Exact-Once Trigger Lifecycle', () => {
  const app = createApp();
  const testUserId = 'usr-alert-tester-2002';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Journey C Steps 1-10: Login, create ABOVE/BELOW alerts, feed deterministic trades, verify exact-once triggers & dedup', async () => {
    const mockUser = {
      id: testUserId,
      email: 'alerts_pro@tradepulse.io',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(AuthService, 'authenticate').mockResolvedValue(mockUser);
    vi.spyOn(AuthService, 'getProfile').mockResolvedValue(mockUser);
    vi.spyOn(AlertRepository, 'listActiveAlerts').mockResolvedValue([]);

    const agent = request.agent(app);

    // 1. Log in
    const loginRes = await agent
      .post('/api/auth/login')
      .set('X-Requested-With', 'TradePulse-Client')
      .send({ email: 'alerts_pro@tradepulse.io', password: 'Password123!' });
    expect(loginRes.status).toBe(200);

    // 2. Create an ABOVE alert (TSLA above 250.00)
    const mockAboveAlert: PriceAlert = {
      id: 'alert-above-1',
      userId: testUserId,
      symbol: 'TSLA',
      condition: AlertCondition.ABOVE,
      targetPrice: new Prisma.Decimal(250.0),
      status: AlertStatus.ACTIVE,
      createdAt: new Date(),
      triggeredAt: null,
      triggeredPrice: null,
      eventTime: null,
    };
    vi.spyOn(AlertRepository, 'createAlert').mockResolvedValue(mockAboveAlert);

    const createAboveRes = await agent
      .post('/api/alerts')
      .set('X-Requested-With', 'TradePulse-Client')
      .send({ symbol: 'TSLA', condition: 'ABOVE', targetPrice: 250.0 });

    expect(createAboveRes.status).toBe(201);
    expect(createAboveRes.body.data.symbol).toBe('TSLA');
    expect(createAboveRes.body.data.condition).toBe('ABOVE');

    // 3. Create a BELOW alert (TSLA below 200.00)
    const mockBelowAlert: PriceAlert = {
      id: 'alert-below-2',
      userId: testUserId,
      symbol: 'TSLA',
      condition: AlertCondition.BELOW,
      targetPrice: new Prisma.Decimal(200.0),
      status: AlertStatus.ACTIVE,
      createdAt: new Date(),
      triggeredAt: null,
      triggeredPrice: null,
      eventTime: null,
    };
    vi.spyOn(AlertRepository, 'createAlert').mockResolvedValue(mockBelowAlert);

    const createBelowRes = await agent
      .post('/api/alerts')
      .set('X-Requested-With', 'TradePulse-Client')
      .send({ symbol: 'TSLA', condition: 'BELOW', targetPrice: 200.0 });

    expect(createBelowRes.status).toBe(201);
    expect(createBelowRes.body.data.condition).toBe('BELOW');

    // 4 & 5. Feed deterministic test trade events into alert engine
    const testCloudAlertService = new CloudAlertService();
    const subscribeSpy = vi.spyOn(finnhubWsClient, 'subscribe').mockImplementation(() => {});

    vi.spyOn(AlertRepository, 'listActiveAlerts').mockResolvedValue([mockAboveAlert, mockBelowAlert]);
    await testCloudAlertService.init();

    // Verify symbols subscribed
    expect(subscribeSpy).toHaveBeenCalledWith('TSLA');
    expect(testCloudAlertService.isSymbolMonitored('TSLA')).toBe(true);

    // Track emitted notifications
    const emittedNotifications: import('../src/services/cloudAlertService.js').AlertTriggerNotification[] = [];
    testCloudAlertService.on('alert_triggered', (notif) => emittedNotifications.push(notif));

    // Simulated trade 1: TSLA at 245.00 (below 250, above 200 -> neither triggers)
    vi.spyOn(AlertRepository, 'listActiveBySymbol').mockResolvedValue([mockAboveAlert, mockBelowAlert]);
    await testCloudAlertService.evaluateTrade({
      symbol: 'TSLA',
      price: 245.0,
      volume: 100,
      timestamp: Date.now(),
    });
    expect(emittedNotifications.length).toBe(0);

    // Simulated trade 2: TSLA crosses threshold at 252.50 (triggers ABOVE alert)
    const triggerResultMock = {
      alert: { ...mockAboveAlert, status: AlertStatus.TRIGGERED, triggeredPrice: new Prisma.Decimal(252.5) },
      history: {
        id: 'hist-1',
        userId: testUserId,
        alertId: mockAboveAlert.id,
        symbol: 'TSLA',
        condition: AlertCondition.ABOVE,
        targetPrice: mockAboveAlert.targetPrice,
        observedPrice: new Prisma.Decimal(252.5),
        eventTime: new Date(),
        triggeredAt: new Date(),
        dedupId: 'dedup-above-1',
      },
    };
    const triggerTxSpy = vi.spyOn(AlertRepository, 'triggerAlertTransaction').mockResolvedValue(triggerResultMock);

    await testCloudAlertService.evaluateTrade({
      symbol: 'TSLA',
      price: 252.5,
      volume: 150,
      timestamp: Date.now(),
    });

    // 6. Verify one-shot alert triggered once
    expect(triggerTxSpy).toHaveBeenCalledTimes(1);
    expect(emittedNotifications.length).toBe(1);
    expect(emittedNotifications[0].symbol).toBe('TSLA');
    expect(emittedNotifications[0].observedPrice).toBe(252.5);

    // 7. Verify trigger history is persisted and accessible
    vi.spyOn(AlertRepository, 'listHistory').mockResolvedValue([triggerResultMock.history]);
    const historyRes = await agent.get('/api/alerts/history');
    expect(historyRes.status).toBe(200);
    expect(historyRes.body.data.length).toBe(1);
    expect(historyRes.body.data[0].dedupId).toBe('dedup-above-1');

    // 8. Re-evaluate / simulated backend restart: active subscriptions are restored
    const restartedService = new CloudAlertService();
    // Only mockBelowAlert remains ACTIVE
    vi.spyOn(AlertRepository, 'listActiveAlerts').mockResolvedValue([mockBelowAlert]);
    await restartedService.init();
    expect(restartedService.isSymbolMonitored('TSLA')).toBe(true);

    // 9 & 10. Duplicate/replayed trade events do NOT trigger again (idempotent atomic rejection)
    vi.spyOn(AlertRepository, 'triggerAlertTransaction').mockResolvedValue(null); // Already triggered returns null

    const duplicateEmitted: import('../src/services/cloudAlertService.js').AlertTriggerNotification[] = [];
    restartedService.on('alert_triggered', (notif) => duplicateEmitted.push(notif));

    await restartedService.evaluateTrade({
      symbol: 'TSLA',
      price: 255.0,
      volume: 50,
      timestamp: Date.now(),
    });

    expect(duplicateEmitted.length).toBe(0);
  });
});
