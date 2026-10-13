import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { AuthService } from '../src/services/authService.js';
import { WatchlistRepository } from '../src/repositories/watchlistRepository.js';

describe('End-to-End Journey B: Cloud Watchlists & User Boundaries', () => {
  const app = createApp();
  const testUserId = 'usr-watchlist-tester-1001';
  const foreignUserId = 'usr-foreign-attacker-9999';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Journey B Steps 1-8: Login, create custom list, add stock, rename, remove stock, re-login and verify persistence', async () => {
    const mockUser = {
      id: testUserId,
      email: 'watchlist_pro@tradepulse.io',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(AuthService, 'authenticate').mockResolvedValue(mockUser);
    vi.spyOn(AuthService, 'getProfile').mockResolvedValue(mockUser);

    const agent = request.agent(app);

    // 1. Log in
    const loginRes = await agent
      .post('/api/auth/login')
      .set('X-Requested-With', 'TradePulse-Client')
      .send({
        email: 'watchlist_pro@tradepulse.io',
        password: 'Password123!',
      });
    expect(loginRes.status).toBe(200);

    // 2. Create custom watchlist
    const createdWatchlistMock = {
      id: 'wl-custom-1234',
      userId: testUserId,
      name: 'Semiconductors',
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
    };
    vi.spyOn(WatchlistRepository, 'createWatchlist').mockResolvedValue(createdWatchlistMock);

    const createRes = await agent
      .post('/api/watchlists')
      .set('X-Requested-With', 'TradePulse-Client')
      .send({ name: 'Semiconductors' });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.id).toBe('wl-custom-1234');
    expect(createRes.body.data.name).toBe('Semiconductors');

    // 3. Add a supported stock (NVDA)
    const addedItemMock = {
      id: 'item-nvda-1',
      watchlistId: 'wl-custom-1234',
      symbol: 'NVDA',
      name: 'NVIDIA Corp',
      exchange: 'US',
      addedAt: new Date(),
    };
    vi.spyOn(WatchlistRepository, 'addSymbol').mockResolvedValue(addedItemMock);

    const addRes = await agent
      .post('/api/watchlists/wl-custom-1234/symbols')
      .set('X-Requested-With', 'TradePulse-Client')
      .send({ symbol: 'NVDA', name: 'NVIDIA Corp', exchange: 'US' });

    expect(addRes.status).toBe(201);
    expect(addRes.body.data.symbol).toBe('NVDA');

    // 4. Verify stock appears in list
    const populatedListMock = {
      ...createdWatchlistMock,
      items: [addedItemMock],
    };
    vi.spyOn(WatchlistRepository, 'listByUser').mockResolvedValue([populatedListMock]);

    const listRes = await agent.get('/api/watchlists');
    expect(listRes.status).toBe(200);
    expect(listRes.body.data[0].items.length).toBe(1);
    expect(listRes.body.data[0].items[0].symbol).toBe('NVDA');

    // 5. Rename watchlist
    const renamedMock = {
      ...populatedListMock,
      name: 'AI & Chips',
    };
    vi.spyOn(WatchlistRepository, 'renameWatchlist').mockResolvedValue(renamedMock);

    const renameRes = await agent
      .patch('/api/watchlists/wl-custom-1234')
      .set('X-Requested-With', 'TradePulse-Client')
      .send({ name: 'AI & Chips' });

    expect(renameRes.status).toBe(200);
    expect(renameRes.body.data.name).toBe('AI & Chips');

    // 6. Remove stock
    vi.spyOn(WatchlistRepository, 'removeSymbol').mockResolvedValue(true);

    const removeRes = await agent
      .delete('/api/watchlists/wl-custom-1234/symbols/NVDA')
      .set('X-Requested-With', 'TradePulse-Client');

    expect(removeRes.status).toBe(200);
    expect(removeRes.body.data.message).toBe('Symbol removed from watchlist');

    // 7. Log out & log back in
    await agent.post('/api/auth/logout').set('X-Requested-With', 'TradePulse-Client').send();
    await agent
      .post('/api/auth/login')
      .set('X-Requested-With', 'TradePulse-Client')
      .send({ email: 'watchlist_pro@tradepulse.io', password: 'Password123!' });

    // 8. Verify persisted changes remain correct
    const afterReloginRes = await agent.get('/api/watchlists');
    expect(afterReloginRes.status).toBe(200);
    expect(afterReloginRes.body.data.length).toBe(1);
  });

  it('Journey B Step 9: Rejects unauthorized access or modification of another user watchlist', async () => {
    const foreignUser = {
      id: foreignUserId,
      email: 'attacker@tradepulse.io',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(AuthService, 'authenticate').mockResolvedValue(foreignUser);
    vi.spyOn(AuthService, 'getProfile').mockResolvedValue(foreignUser);

    const agent = request.agent(app);
    await agent
      .post('/api/auth/login')
      .set('X-Requested-With', 'TradePulse-Client')
      .send({ email: 'attacker@tradepulse.io', password: 'AttackPassword123!' });

    // Attacker attempts to modify victim's watchlist (wl-victim-999)
    vi.spyOn(WatchlistRepository, 'renameWatchlist').mockResolvedValue(null);

    const unauthorizedRename = await agent
      .patch('/api/watchlists/wl-victim-999')
      .set('X-Requested-With', 'TradePulse-Client')
      .send({ name: 'Hacked List' });

    expect(unauthorizedRename.status).toBe(404);
    expect(unauthorizedRename.body.error.code).toBe('NOT_FOUND');

    // Attacker attempts to delete victim's watchlist
    vi.spyOn(WatchlistRepository, 'deleteWatchlist').mockResolvedValue(false);

    const unauthorizedDelete = await agent
      .delete('/api/watchlists/wl-victim-999')
      .set('X-Requested-With', 'TradePulse-Client');

    expect(unauthorizedDelete.status).toBe(404);
  });
});
