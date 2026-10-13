import http from 'http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { streamGateway } from './services/streamGateway.js';
import { cloudAlertService } from './services/cloudAlertService.js';
import { prisma } from './db.js';

const app = createApp();
const server = http.createServer(app);

// Initialize client WebSocket streaming gateway on /api/stream
streamGateway.init(server);

// Initialize cloud alert background monitoring if database is active
if (env.isDatabaseConfigured) {
  cloudAlertService.init().catch((err) => {
    console.error('[TradePulse Pro Server] Failed to initialize cloud alerts:', err);
  });
}

// Bind to 0.0.0.0 for containerized / Render production runtime
const host = '0.0.0.0';

server.listen(env.port, host, () => {
  console.log(`[TradePulse Pro Server] Market Data Gateway active on http://${host}:${env.port}`);
  console.log(`[TradePulse Pro Server] Finnhub Provider Status: ${env.isFinnhubConfigured ? 'Configured (Live feeds enabled)' : 'Unconfigured (Operating in demo simulation mode)'}`);
  console.log(`[TradePulse Pro Server] Neon Database Status: ${env.isDatabaseConfigured ? 'Connected (Branch: tradepulse-dev)' : 'Disabled'}`);
  console.log(`[TradePulse Pro Server] Client Streaming Gateway listening at ws://${host}:${env.port}/api/stream`);
});

const gracefulShutdown = (signal: string) => {
  console.log(`[TradePulse Pro Server] Received ${signal}. Shutting down gracefully...`);
  streamGateway.shutdown();
  server.close(async () => {
    try {
      await prisma.$disconnect();
    } catch {
      // Ignore disconnect errors during termination
    }
    console.log('[TradePulse Pro Server] Terminated gracefully');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

