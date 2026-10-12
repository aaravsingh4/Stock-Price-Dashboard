import WebSocket from 'ws';
import { env } from '../config/env.js';
import { NormalizedTradeEvent } from '../types/market.js';

interface RawFinnhubTrade {
  p: number; // Last price
  s: string; // Symbol
  t: number; // UNIX milliseconds timestamp
  v: number; // Volume
  c?: string[]; // Trade conditions
}

interface RawFinnhubWsMessage {
  type: string;
  data?: RawFinnhubTrade[];
  msg?: string;
}

export type TradeListener = (event: NormalizedTradeEvent) => void;
export type StatusListener = (connected: boolean, streamingAvailable: boolean) => void;

export class FinnhubWsClient {
  private ws: WebSocket | null = null;
  private subscribedSymbols = new Set<string>();
  private tradeListeners = new Set<TradeListener>();
  private statusListeners = new Set<StatusListener>();
  private isConnecting = false;
  private isShuttingDown = false;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private streamingAvailable = false;

  private readonly maxReconnectDelayMs = 30000;
  private readonly baseReconnectDelayMs = 1500;
  private readonly maxReconnectAttempts = 10;

  constructor() {
    this.streamingAvailable = env.isFinnhubConfigured;
  }

  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  get isStreamingAvailable(): boolean {
    return this.streamingAvailable;
  }

  get activeSubscriptions(): string[] {
    return Array.from(this.subscribedSymbols);
  }

  onTrade(listener: TradeListener): () => void {
    this.tradeListeners.add(listener);
    return () => this.tradeListeners.delete(listener);
  }

  onStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    // Notify immediately
    listener(this.isConnected, this.streamingAvailable);
    return () => this.statusListeners.delete(listener);
  }

  connect(): void {
    if (!env.isFinnhubConfigured) {
      this.streamingAvailable = false;
      this.emitStatus(false, false);
      return;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (this.isConnecting || this.isShuttingDown) {
      return;
    }

    this.isConnecting = true;
    const url = `wss://ws.finnhub.io?token=${env.finnhubApiKey}`;

    try {
      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.streamingAvailable = true;
        this.emitStatus(true, true);

        // Resubscribe active symbols upon reconnection
        this.subscribedSymbols.forEach((symbol) => {
          this.sendSubscription(symbol);
        });

        // Setup periodic ping
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.ping();
          }
        }, 30000);
      });

      this.ws.on('message', (rawData: WebSocket.RawData) => {
        try {
          const parsed = JSON.parse(rawData.toString()) as RawFinnhubWsMessage;
          this.handleIncomingMessage(parsed);
        } catch {
          // Discard malformed JSON without crashing
        }
      });

      this.ws.on('error', (err: Error) => {
        // Safe error logging: Never log connection URL or tokens
        console.error('[FinnhubWsClient] Upstream WebSocket error:', err.message);
      });

      this.ws.on('close', (code: number) => {
        this.isConnecting = false;
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
        }
        this.emitStatus(false, this.streamingAvailable);

        if (!this.isShuttingDown) {
          this.scheduleReconnect();
        }
      });
    } catch (err) {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private handleIncomingMessage(msg: RawFinnhubWsMessage): void {
    if (msg.type === 'ping') {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'pong' }));
      }
      return;
    }

    if (msg.type === 'error') {
      console.warn('[FinnhubWsClient] Upstream provider error event received:', msg.msg || 'Unknown error');
      return;
    }

    if (msg.type === 'trade' && Array.isArray(msg.data)) {
      for (const trade of msg.data) {
        // Validate required trade fields
        if (
          typeof trade.s === 'string' &&
          typeof trade.p === 'number' &&
          !Number.isNaN(trade.p) &&
          trade.p > 0 &&
          typeof trade.t === 'number'
        ) {
          const normalized: NormalizedTradeEvent = {
            type: 'trade',
            symbol: trade.s.toUpperCase(),
            price: Number(trade.p.toFixed(2)),
            timestamp: new Date(trade.t).toISOString(),
            providerTimestamp: trade.t,
            volume: typeof trade.v === 'number' ? trade.v : 0,
            conditions: Array.isArray(trade.c) ? trade.c : undefined,
            provider: 'finnhub',
            dataStatus: 'live',
          };

          this.tradeListeners.forEach((listener) => {
            try {
              listener(normalized);
            } catch (err) {
              console.error('[FinnhubWsClient] Trade listener error:', err);
            }
          });
        }
      }
    }
  }

  subscribe(symbol: string): void {
    const cleanSymbol = symbol.trim().toUpperCase();
    if (!cleanSymbol || cleanSymbol.length > 10) return;

    if (!this.subscribedSymbols.has(cleanSymbol)) {
      this.subscribedSymbols.add(cleanSymbol);
      if (this.isConnected) {
        this.sendSubscription(cleanSymbol);
      } else {
        this.connect();
      }
    }
  }

  unsubscribe(symbol: string): void {
    const cleanSymbol = symbol.trim().toUpperCase();
    if (this.subscribedSymbols.has(cleanSymbol)) {
      this.subscribedSymbols.delete(cleanSymbol);
      if (this.isConnected) {
        this.sendUnsubscription(cleanSymbol);
      }
    }
  }

  private sendSubscription(symbol: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'subscribe', symbol }));
    }
  }

  private sendUnsubscription(symbol: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'unsubscribe', symbol }));
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.isShuttingDown) return;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[FinnhubWsClient] Max reconnect attempts reached. Waiting for next client trigger.');
      return;
    }

    this.reconnectAttempts++;
    // Exponential backoff with jitter
    const delay = Math.min(
      this.maxReconnectDelayMs,
      this.baseReconnectDelayMs * Math.pow(1.5, this.reconnectAttempts) + Math.random() * 500
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isShuttingDown && this.subscribedSymbols.size > 0) {
        this.connect();
      }
    }, delay);
  }

  private emitStatus(connected: boolean, streamingAvailable: boolean): void {
    this.statusListeners.forEach((listener) => {
      try {
        listener(connected, streamingAvailable);
      } catch (err) {
        console.error('[FinnhubWsClient] Status listener error:', err);
      }
    });
  }

  shutdown(): void {
    this.isShuttingDown = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.tradeListeners.clear();
    this.statusListeners.clear();
    this.subscribedSymbols.clear();
  }
}

export const finnhubWsClient = new FinnhubWsClient();
