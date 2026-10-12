import http from 'http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { streamGateway } from './services/streamGateway.js';

const app = createApp();
const server = http.createServer(app);

// Initialize client WebSocket streaming gateway on /api/stream
streamGateway.init(server);

server.listen(env.port, () => {
  console.log(`[TradePulse Pro Server] Market Data Gateway active on http://localhost:${env.port}`);
  console.log(`[TradePulse Pro Server] Finnhub Provider Status: ${env.isFinnhubConfigured ? 'Configured (Live feeds enabled)' : 'Unconfigured (Operating in demo simulation mode)'}`);
  console.log(`[TradePulse Pro Server] Client Streaming Gateway listening at ws://localhost:${env.port}/api/stream`);
});

process.on('SIGTERM', () => {
  streamGateway.shutdown();
  server.close(() => {
    console.log('[TradePulse Pro Server] Terminated gracefully');
  });
});

