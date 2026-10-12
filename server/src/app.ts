import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { sessionMiddleware } from './middleware/session.js';
import { marketRouter } from './routes/marketRoutes.js';
import { authRouter } from './routes/authRoutes.js';
import { watchlistRouter } from './routes/watchlistRoutes.js';
import { alertRouter } from './routes/alertRoutes.js';
import { migrationRouter } from './routes/migrationRoutes.js';

export function createApp() {
  const app = express();

  // Trust first proxy when in production HTTPS environment
  if (env.isProduction) {
    app.set('trust proxy', 1);
  }

  // CORS configuration for SPA with credentials support
  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );

  app.use(express.json());

  // Attach PostgreSQL-backed session middleware if database is configured
  if (env.isDatabaseConfigured) {
    app.use(sessionMiddleware);
  }

  // Health check endpoint (Public, does not require authentication)
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'TradePulse Pro Market Data Gateway',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      provider: {
        name: 'finnhub',
        configured: env.isFinnhubConfigured,
        mode: env.isFinnhubConfigured ? 'provider' : 'demo-fallback',
      },
      database: {
        provider: 'neon-postgres',
        configured: env.isDatabaseConfigured,
        branch: 'tradepulse-dev',
      },
      uptimeSeconds: Math.floor(process.uptime()),
    });
  });

  // Mount API route handlers
  app.use('/api/market', marketRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/watchlists', watchlistRouter);
  app.use('/api/alerts', alertRouter);
  app.use('/api/migrate', migrationRouter);

  // Global error handler (Never disclose internal secrets or stack traces in production)
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    const status = (err as unknown as { status?: number }).status || 500;
    const message =
      status === 500 && env.nodeEnv === 'production'
        ? 'Internal server error'
        : err.message || 'An unexpected error occurred';

    res.status(status).json({
      error: {
        message,
        code: (err as unknown as { code?: string }).code || 'SERVER_ERROR',
      },
    });
  });

  return app;
}
