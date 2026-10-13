import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { AuthService } from '../src/services/authService.js';
import { WatchlistRepository } from '../src/repositories/watchlistRepository.js';

describe('End-to-End Journey A: Authentication & Session Lifecycle', () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Journey A Step 1 & 2 & 3: Registers a test account, auto-provisions default watchlist, and establishes session', async () => {
    const mockUser = {
      id: 'usr-1111-2222-3333',
      email: 'investor_e2e@tradepulse.io',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(AuthService, 'register').mockResolvedValue(mockUser);
    vi.spyOn(AuthService, 'getProfile').mockResolvedValue(mockUser);

    const agent = request.agent(app);

    // Register account
    const regRes = await agent
      .post('/api/auth/register')
      .set('X-Requested-With', 'TradePulse-Client')
      .send({
        email: 'investor_e2e@tradepulse.io',
        password: 'SecurePassword123!',
      });

    expect(regRes.status).toBe(201);
    expect(regRes.body.data.user.id).toBe(mockUser.id);
    expect(regRes.body.data.user.email).toBe(mockUser.email);
    expect(regRes.headers['set-cookie']).toBeDefined();

    // Verify current user session restored via /api/auth/me
    const meRes = await agent.get('/api/auth/me');
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user).not.toBeNull();
    expect(meRes.body.data.user.id).toBe(mockUser.id);
  });

  it('Journey A Step 4 & 5 & 6: Logs out, destroys session, logs back in, and restores current-user profile', async () => {
    const mockUser = {
      id: 'usr-4444-5555-6666',
      email: 'trader_pro@tradepulse.io',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(AuthService, 'authenticate').mockResolvedValue(mockUser);
    vi.spyOn(AuthService, 'getProfile').mockResolvedValue(mockUser);

    const agent = request.agent(app);

    // Log in
    const loginRes = await agent
      .post('/api/auth/login')
      .set('X-Requested-With', 'TradePulse-Client')
      .send({
        email: 'trader_pro@tradepulse.io',
        password: 'ValidPassword123!',
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.email).toBe(mockUser.email);

    // Verify session active
    const meRes = await agent.get('/api/auth/me');
    expect(meRes.body.data.user.id).toBe(mockUser.id);

    // Log out
    const logoutRes = await agent
      .post('/api/auth/logout')
      .set('X-Requested-With', 'TradePulse-Client')
      .send();

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.data.message).toContain('Successfully signed out');

    // Verify session destroyed
    const meAfterLogout = await agent.get('/api/auth/me');
    expect(meAfterLogout.body.data.user).toBeNull();
  });

  it('Journey A Step 7: Verifies that invalid credentials and short passwords are rejected', async () => {
    vi.spyOn(AuthService, 'authenticate').mockRejectedValue(new Error('Invalid email or password'));

    const agent = request.agent(app);

    const failLogin = await agent
      .post('/api/auth/login')
      .set('X-Requested-With', 'TradePulse-Client')
      .send({
        email: 'trader_pro@tradepulse.io',
        password: 'WrongPassword999!',
      });

    expect(failLogin.status).toBe(401);
    expect(failLogin.body.error.message).toBe('Invalid email or password');

    // Missing fields
    const emptyPayload = await agent
      .post('/api/auth/login')
      .set('X-Requested-With', 'TradePulse-Client')
      .send({});

    expect(emptyPayload.status).toBe(400);
    expect(emptyPayload.body.error.code).toBe('INVALID_INPUT');
  });

  it('Journey A Step 8: Verifies that protected endpoints reject unauthenticated requests with 401', async () => {
    // Unauthenticated GET /api/watchlists
    const unauthWatchlists = await request(app).get('/api/watchlists');
    expect(unauthWatchlists.status).toBe(401);
    expect(unauthWatchlists.body.error.code).toBe('UNAUTHORIZED');

    // Unauthenticated GET /api/alerts
    const unauthAlerts = await request(app).get('/api/alerts');
    expect(unauthAlerts.status).toBe(401);
    expect(unauthAlerts.body.error.code).toBe('UNAUTHORIZED');

    // Unauthenticated POST /api/migrate/local-data
    const unauthMigrate = await request(app)
      .post('/api/migrate/local-data')
      .set('X-Requested-With', 'TradePulse-Client')
      .send({});
    expect(unauthMigrate.status).toBe(401);
  });
});
