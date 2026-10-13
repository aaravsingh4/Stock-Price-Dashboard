import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StreamGateway } from '../src/services/streamGateway.js';
import { finnhubWsClient } from '../src/providers/finnhubWsClient.js';
import { ServerStreamMessage, NormalizedTradeEvent } from '../src/types/market.js';
import WebSocket from 'ws';
import http from 'http';

describe('StreamGateway (/api/stream)', () => {
  let gateway: StreamGateway;
  let server: http.Server;
  let clientWs: WebSocket;
  let port: number;

  beforeEach(async () => {
    server = http.createServer();
    gateway = new StreamGateway();
    gateway.init(server);

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address();
        port = typeof addr === 'object' && addr ? addr.port : 5098;
        resolve();
      });
    });
  });

  afterEach(async () => {
    if (clientWs && clientWs.readyState === WebSocket.OPEN) {
      clientWs.close();
    }
    gateway.shutdown();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('accepts client connection and immediately sends status message', async () => {
    const received: ServerStreamMessage[] = [];
    clientWs = new WebSocket(`ws://127.0.0.1:${port}/api/stream`);

    await new Promise<void>((resolve) => {
      clientWs.on('open', () => {
        clientWs.on('message', (data) => {
          received.push(JSON.parse(data.toString()) as ServerStreamMessage);
          resolve();
        });
      });
    });

    expect(received.length).toBeGreaterThan(0);
    expect(received[0].type).toBe('status');
    if (received[0].type === 'status') {
      expect(received[0].provider).toBe('finnhub');
    }
  });

  it('handles client subscription and broadcasts trades to subscribed clients', async () => {
    clientWs = new WebSocket(`ws://127.0.0.1:${port}/api/stream`);

    await new Promise<void>((resolve) => clientWs.on('open', () => resolve()));

    const received: ServerStreamMessage[] = [];
    clientWs.on('message', (data) => {
      received.push(JSON.parse(data.toString()) as ServerStreamMessage);
    });

    // Send subscribe
    clientWs.send(JSON.stringify({ action: 'subscribe', symbols: ['AAPL'] }));

    // Wait for subscribed confirmation
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(received.some((m) => m.type === 'subscribed' && m.symbols.includes('AAPL'))).toBe(true);

    // Simulate provider emitting AAPL trade
    // @ts-expect-error - Trigger internal private trade listener for test
    finnhubWsClient['tradeListeners'].forEach((listener: (e: NormalizedTradeEvent) => void) => {
      listener({
        type: 'trade',
        symbol: 'AAPL',
        price: 182.5,
        timestamp: new Date().toISOString(),
        providerTimestamp: Date.now(),
        volume: 50,
        provider: 'finnhub',
        dataStatus: 'live',
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    const tradeMsg = received.find((m) => m.type === 'trade');
    expect(tradeMsg).toBeDefined();
    if (tradeMsg && tradeMsg.type === 'trade') {
      expect(tradeMsg.data.symbol).toBe('AAPL');
      expect(tradeMsg.data.price).toBe(182.5);
    }
  });

  it('handles client ping with pong', async () => {
    clientWs = new WebSocket(`ws://127.0.0.1:${port}/api/stream`);
    await new Promise<void>((resolve) => clientWs.on('open', () => resolve()));

    const received: ServerStreamMessage[] = [];
    clientWs.on('message', (data) => {
      received.push(JSON.parse(data.toString()) as ServerStreamMessage);
    });

    clientWs.send(JSON.stringify({ action: 'ping' }));
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(received.some((m) => m.type === 'pong')).toBe(true);
  });
});
