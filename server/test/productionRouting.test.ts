import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import path from 'path';
import fs from 'fs';

describe('Production Runtime Routing & Asset Serving', () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('serves API health endpoint with 200 and proper status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toContain('TradePulse Pro');
  });

  it('returns clean 404 JSON for unknown /api/* routes without serving HTML SPA fallback', async () => {
    const res = await request(app).get('/api/unknown-nonexistent-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toBe('API endpoint not found');
  });

  it('serves compiled index.html for root path and frontend SPA routes when dist exists', async () => {
    const clientDistPath = path.resolve(process.cwd(), 'dist');
    const indexPath = path.join(clientDistPath, 'index.html');

    if (fs.existsSync(indexPath)) {
      // Root route /
      const rootRes = await request(app).get('/');
      expect(rootRes.status).toBe(200);
      expect(rootRes.headers['content-type']).toContain('text/html');
      expect(rootRes.text).toContain('<!doctype html>');
      expect(rootRes.text).toContain('TradePulse');

      // SPA client-side route /screener
      const spaRes = await request(app).get('/screener');
      expect(spaRes.status).toBe(200);
      expect(spaRes.headers['content-type']).toContain('text/html');
      expect(spaRes.text).toContain('<!doctype html>');

      // SPA client-side route /watchlist
      const watchlistSpaRes = await request(app).get('/watchlist');
      expect(watchlistSpaRes.status).toBe(200);
      expect(watchlistSpaRes.headers['content-type']).toContain('text/html');
    }
  });

  it('serves static assets like favicon.svg from dist when requested', async () => {
    const faviconPath = path.resolve(process.cwd(), 'dist', 'favicon.svg');
    if (fs.existsSync(faviconPath)) {
      const res = await request(app).get('/favicon.svg');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('image/svg+xml');
    }
  });
});
