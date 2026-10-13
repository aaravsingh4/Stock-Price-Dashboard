export interface RealtimeTrade {
  type: 'trade';
  symbol: string;
  price: number;
  timestamp: string;
  providerTimestamp: number;
  volume: number;
  provider: 'finnhub' | 'simulated';
  dataStatus: 'live' | 'delayed' | 'cached' | 'simulated' | 'stale' | 'unavailable';
}

export type ConnectionStatus =
  | 'connected'
  | 'connecting'
  | 'reconnecting'
  | 'disconnected'
  | 'unavailable'
  | 'demo';

export type TradeHandler = (trade: RealtimeTrade) => void;
export type StatusHandler = (status: ConnectionStatus) => void;

class MarketStreamClient {
  private ws: WebSocket | null = null;
  private subscribedSymbols = new Set<string>();
  private tradeHandlers = new Set<TradeHandler>();
  private statusHandlers = new Set<StatusHandler>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private currentStatus: ConnectionStatus = 'disconnected';
  private isIntentionallyClosed = false;

  constructor() {
    // Determine initial status based on environment
  }

  get status(): ConnectionStatus {
    return this.currentStatus;
  }

  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isIntentionallyClosed = false;
    this.setStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const url = `${protocol}//${host}/api/stream`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus('connected');

        // Resubscribe active symbols
        if (this.subscribedSymbols.size > 0) {
          this.send({
            action: 'subscribe',
            symbols: Array.from(this.subscribedSymbols),
          });
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'trade' && msg.data) {
            const trade: RealtimeTrade = msg.data;
            this.tradeHandlers.forEach((handler) => {
              try {
                handler(trade);
              } catch (e) {
                console.error('Trade handler error:', e);
              }
            });
          } else if (msg.type === 'status') {
            if (!msg.streamingAvailable) {
              this.setStatus(msg.provider === 'finnhub' ? 'unavailable' : 'demo');
            } else if (msg.connected) {
              this.setStatus('connected');
            }
          }
        } catch {
          // Ignore malformed message
        }
      };

      this.ws.onclose = () => {
        this.ws = null;
        if (!this.isIntentionallyClosed) {
          this.setStatus('disconnected');
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        this.setStatus('disconnected');
      };
    } catch {
      this.setStatus('disconnected');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.isIntentionallyClosed) return;
    this.reconnectAttempts++;
    const delay = Math.min(10000, 1000 * Math.pow(1.5, this.reconnectAttempts));
    this.setStatus('reconnecting');
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isIntentionallyClosed) {
        this.connect();
      }
    }, delay);
  }

  private setStatus(status: ConnectionStatus): void {
    this.currentStatus = status;
    this.statusHandlers.forEach((h) => h(status));
  }

  private send(payload: Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  subscribe(symbol: string): void {
    const clean = symbol.trim().toUpperCase();
    if (!clean) return;

    this.subscribedSymbols.add(clean);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({ action: 'subscribe', symbols: [clean] });
    } else {
      this.connect();
    }
  }

  unsubscribe(symbol: string): void {
    const clean = symbol.trim().toUpperCase();
    if (this.subscribedSymbols.has(clean)) {
      this.subscribedSymbols.delete(clean);
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ action: 'unsubscribe', symbols: [clean] });
      }
    }
  }

  onTrade(handler: TradeHandler): () => void {
    this.tradeHandlers.add(handler);
    return () => {
      this.tradeHandlers.delete(handler);
    };
  }

  onStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    handler(this.currentStatus);
    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('disconnected');
  }
}

export const marketStreamClient = new MarketStreamClient();
