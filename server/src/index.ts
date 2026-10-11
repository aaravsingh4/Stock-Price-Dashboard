import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`[TradePulse Pro Server] Market Data Gateway active on http://localhost:${env.port}`);
  console.log(`[TradePulse Pro Server] Finnhub Provider Status: ${env.isFinnhubConfigured ? 'Configured (Live feeds enabled)' : 'Unconfigured (Operating in demo simulation mode)'}`);
});

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('[TradePulse Pro Server] Terminated gracefully');
  });
});
