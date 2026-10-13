import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import fs from 'fs';
import path from 'path';

describe('Staging Runtime & Blueprint Configuration Validation', () => {
  const app = createApp();

  it('validates render.staging.yaml structure and schema properties', () => {
    const blueprintPath = path.resolve(process.cwd(), 'render.staging.yaml');
    expect(fs.existsSync(blueprintPath)).toBe(true);

    const content = fs.readFileSync(blueprintPath, 'utf8');

    // Name & runtime
    expect(content).toContain('name: tradepulse-pro-staging');
    expect(content).toContain('type: web');
    expect(content).toContain('runtime: node');
    expect(content).toContain('plan: free');
    expect(content).toContain('region: ohio');

    // Branch & deployment safety trigger
    expect(content).toContain('branch: staging');
    expect(content).toContain('autoDeployTrigger: off');

    // Build & start commands matching actual package.json scripts
    expect(content).toContain('buildCommand: npm ci && npm run db:generate && npm run build');
    expect(content).toContain('startCommand: npm run start:server');
    expect(content).toContain('healthCheckPath: /api/health');

    // Required environment variables configured without hardcoded secrets
    expect(content).toContain('key: NODE_ENV');
    expect(content).toContain('value: production');
    expect(content).toContain('key: APP_ENV');
    expect(content).toContain('value: staging');
    expect(content).toContain('key: DATABASE_URL');
    expect(content).toContain('sync: false');
    expect(content).toContain('key: DIRECT_URL');
    expect(content).toContain('key: SESSION_SECRET');
    expect(content).toContain('generateValue: true');
    expect(content).toContain('key: FINNHUB_API_KEY');

    // Strict safety check: No raw credentials or database URIs in blueprint
    expect(content).not.toContain('postgres://');
    expect(content).not.toContain('postgresql://');
    expect(content).not.toContain('prisma migrate dev');
  });

  it('serves health check for Render staging service', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toContain('TradePulse Pro');
    expect(res.body.database.branch).toBe('tradepulse-dev');
  });

  it('isolates API routes and returns 404 JSON on unrecognized staging endpoints', async () => {
    const res = await request(app).get('/api/v1/invalid-route');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toBe('API endpoint not found');
  });
});
