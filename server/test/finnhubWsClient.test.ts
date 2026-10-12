import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FinnhubWsClient } from '../src/providers/finnhubWsClient.js';
import { env } from '../src/config/env.js';
import WebSocket from 'ws';

// Mock ws
vi.mock('ws');

describe('FinnhubWsClient (Upstream Provider)', () => {
  let client: FinnhubWsClient;
  let mockWsInstance: any;

  beforeEach(() => {
    (env as unknown as { finnhubApiKey: string }).finnhubApiKey = 'test_token_123';
    
    mockWsInstance = {
      readyState: WebSocket.OPEN,
      on: vi.fn(),
      send: vi.fn(),
      close: vi.fn(),
      ping: vi.fn(),
    };

    (WebSocket as unknown as any).OPEN = 1;
    (WebSocket as unknown as any).CONNECTING = 0;
    (WebSocket as unknown as any).CLOSED = 3;
    (WebSocket as unknown as any).mockImplementation(() => mockWsInstance);

    client = new FinnhubWsClient();
  });

  afterEach(() => {
    client.shutdown();
    vi.clearAllMocks();
  });

  it('connects to Finnhub upstream with configured token and subscribes to symbol', () => {
    client.subscribe('AAPL');

    expect(WebSocket).toHaveBeenCalled();
    const calledUrl = (WebSocket as unknown as any).mock.calls[0][0];
    expect(calledUrl).toContain('wss://ws.finnhub.io?token=test_token_123');

    // Trigger open event
    const openCallback = mockWsInstance.on.mock.calls.find((c: any) => c[0] === 'open')?.[1];
    expect(openCallback).toBeDefined();
    openCallback();

    expect(mockWsInstance.send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'subscribe', symbol: 'AAPL' })
    );
  });

  it('normalizes incoming trade events and emits to trade listeners', () => {
    const tradeCallback = vi.fn();
    client.onTrade(tradeCallback);
    client.subscribe('AAPL');

    // Find message handler
    const messageCallback = mockWsInstance.on.mock.calls.find((c: any) => c[0] === 'message')?.[1];
    expect(messageCallback).toBeDefined();

    const rawMessage = JSON.stringify({
      type: 'trade',
      data: [
        {
          s: 'AAPL',
          p: 185.5,
          t: 1728658800000,
          v: 100,
          c: ['1', '12'],
        },
      ],
    });

    messageCallback(Buffer.from(rawMessage));

    expect(tradeCallback).toHaveBeenCalledTimes(1);
    const event = tradeCallback.mock.calls[0][0];
    expect(event).toMatchObject({
      type: 'trade',
      symbol: 'AAPL',
      price: 185.5,
      volume: 100,
      provider: 'finnhub',
      dataStatus: 'live',
    });
  });

  it('safely discards malformed trade messages and continues running', () => {
    const tradeCallback = vi.fn();
    client.onTrade(tradeCallback);
    client.subscribe('AAPL');

    const messageCallback = mockWsInstance.on.mock.calls.find((c: any) => c[0] === 'message')?.[1];
    expect(messageCallback).toBeDefined();

    // Invalid JSON
    messageCallback(Buffer.from('{invalid: json'));
    // Missing required price
    messageCallback(Buffer.from(JSON.stringify({ type: 'trade', data: [{ s: 'AAPL' }] })));

    expect(tradeCallback).not.toHaveBeenCalled();
  });

  it('unsubscribes from symbol when requested', () => {
    client.subscribe('AAPL');
    const openCallback = mockWsInstance.on.mock.calls.find((c: any) => c[0] === 'open')?.[1];
    openCallback();

    client.unsubscribe('AAPL');
    expect(mockWsInstance.send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'unsubscribe', symbol: 'AAPL' })
    );
    expect(client.activeSubscriptions).not.toContain('AAPL');
  });
});
