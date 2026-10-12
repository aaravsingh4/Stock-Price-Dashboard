import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/db.js';
import { UserRepository } from '../src/repositories/userRepository.js';
import { WatchlistRepository } from '../src/repositories/watchlistRepository.js';
import { AlertRepository } from '../src/repositories/alertRepository.js';
import { AuthService } from '../src/services/authService.js';
import { AlertCondition, AlertStatus } from '@prisma/client';

describe('Neon PostgreSQL Development Branch Database Integration', () => {
  const testEmail = `test_investor_${Date.now()}@example.com`;
  const testPassword = 'StrongPassword123!';
  let createdUserId = '';
  let customListId = '';

  beforeAll(async () => {
    // Confirm connection to development database
    const result = await prisma.$queryRaw<Array<{ current_database: string }>>`SELECT current_database();`;
    expect(result[0].current_database).toBe('neondb');
  }, 20000);

  afterAll(async () => {
    // Cleanup created test records
    if (createdUserId) {
      await prisma.user.delete({ where: { id: createdUserId } }).catch(() => {});
    }
    await prisma.$disconnect();
  }, 20000);

  describe('User Registration & Default Watchlist Atomicity', () => {
    it('creates a user and automatically provisions a default watchlist in a single transaction', async () => {
      const user = await AuthService.register(testEmail, testPassword);
      createdUserId = user.id;

      expect(user.id).toBeDefined();
      expect(user.email).toBe(testEmail.toLowerCase());

      // Verify default watchlist was created atomically
      const userWatchlists = await WatchlistRepository.listByUser(user.id);
      expect(userWatchlists.length).toBeGreaterThanOrEqual(1);

      const defaultList = userWatchlists.find((w) => w.isDefault);
      expect(defaultList).toBeDefined();
      expect(defaultList?.name).toBe('My Watchlist');
      expect(defaultList?.items.length).toBe(3); // AAPL, MSFT, NVDA
    }, 20000);

    it('rejects duplicate email registrations', async () => {
      await expect(AuthService.register(testEmail, testPassword)).rejects.toThrow(
        'An account with this email already exists'
      );
    }, 20000);

    it('authenticates user and verifies bcrypt password hash accurately', async () => {
      const authResult = await AuthService.authenticate(testEmail, testPassword);
      expect(authResult.id).toBe(createdUserId);

      // Verify bad password fails
      await expect(AuthService.authenticate(testEmail, 'WrongPassword123!')).rejects.toThrow(
        'Invalid email or password'
      );
    }, 20000);
  });

  describe('Watchlist CRUD & User Isolation Boundaries', () => {
    it('creates a custom watchlist for the authenticated user', async () => {
      const customList = await WatchlistRepository.createWatchlist(createdUserId, 'Tech Momentum');
      customListId = customList.id;

      expect(customList.id).toBeDefined();
      expect(customList.name).toBe('Tech Momentum');
      expect(customList.isDefault).toBe(false);
    }, 20000);

    it('adds and enforces unique symbols per watchlist', async () => {
      const item1 = await WatchlistRepository.addSymbol(customListId, createdUserId, 'TSLA', 'Tesla Inc.', 'US');
      expect(item1.symbol).toBe('TSLA');

      // Adding duplicate symbol returns existing without creating duplicate
      const item2 = await WatchlistRepository.addSymbol(customListId, createdUserId, 'TSLA', 'Tesla Inc.', 'US');
      expect(item2.id).toBe(item1.id);

      const listWithItems = await WatchlistRepository.findById(customListId, createdUserId);
      expect(listWithItems?.items.length).toBe(1);
    }, 20000);

    it('renames a custom watchlist', async () => {
      const renamed = await WatchlistRepository.renameWatchlist(customListId, createdUserId, 'EV & Growth');
      expect(renamed?.name).toBe('EV & Growth');
    }, 20000);

    it('prevents cross-user unauthorized access', async () => {
      const foreignUserId = '00000000-0000-0000-0000-000000000000';
      const unauthorizedFetch = await WatchlistRepository.findById(customListId, foreignUserId);
      expect(unauthorizedFetch).toBeNull();

      await expect(
        WatchlistRepository.addSymbol(customListId, foreignUserId, 'GOOGL')
      ).rejects.toThrow('Watchlist not found or unauthorized');
    }, 20000);

    it('removes symbol from watchlist and prevents deleting default list', async () => {
      const removed = await WatchlistRepository.removeSymbol(customListId, createdUserId, 'TSLA');
      expect(removed).toBe(true);

      const userLists = await WatchlistRepository.listByUser(createdUserId);
      const defaultList = userLists.find((w) => w.isDefault)!;

      await expect(
        WatchlistRepository.deleteWatchlist(defaultList.id, createdUserId)
      ).rejects.toThrow('Cannot delete your default watchlist');

      const deletedCustom = await WatchlistRepository.deleteWatchlist(customListId, createdUserId);
      expect(deletedCustom).toBe(true);
    }, 20000);
  });

  describe('Price Alerts & Exact-Once Transactional Triggers', () => {
    let alertId = '';

    it('persists a price alert in PostgreSQL', async () => {
      const alert = await AlertRepository.createAlert(
        createdUserId,
        'NVDA',
        AlertCondition.ABOVE,
        150.0
      );
      alertId = alert.id;

      expect(alert.id).toBeDefined();
      expect(alert.symbol).toBe('NVDA');
      expect(alert.condition).toBe('ABOVE');
      expect(Number(alert.targetPrice)).toBe(150.0);
      expect(alert.status).toBe(AlertStatus.ACTIVE);
    }, 20000);

    it('triggers the alert exactly once transactionally and writes history record', async () => {
      const triggerResult = await AlertRepository.triggerAlertTransaction(
        alertId,
        152.5,
        new Date()
      );

      expect(triggerResult).not.toBeNull();
      expect(triggerResult?.alert.status).toBe(AlertStatus.TRIGGERED);
      expect(Number(triggerResult?.alert.triggeredPrice)).toBe(152.5);
      expect(triggerResult?.history.dedupId).toBeDefined();

      // Second trigger attempt on already-triggered alert must return null (exact-once semantics)
      const secondAttempt = await AlertRepository.triggerAlertTransaction(
        alertId,
        155.0,
        new Date()
      );
      expect(secondAttempt).toBeNull();
    }, 20000);

    it('fetches persistent alert trigger history', async () => {
      const history = await AlertRepository.listHistory(createdUserId);
      expect(history.length).toBeGreaterThanOrEqual(1);
      expect(history[0].symbol).toBe('NVDA');
      expect(Number(history[0].observedPrice)).toBe(152.5);
    }, 20000);
  });
});
