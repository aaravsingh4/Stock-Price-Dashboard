import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { marketRouter } from './routes/marketRoutes.js';

export function createApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check endpoint
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
      uptimeSeconds: Math.floor(process.uptime()),
    });
  });

  // Mount market routes
  app.use('/api/market', marketRouter);

  // Global error handler (Never disclose internal secrets or stack traces in production)
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    const status = (err as unknown as { status?: number }).status || 500;
    const message = status === 500 && env.nodeEnv === 'production' 
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
