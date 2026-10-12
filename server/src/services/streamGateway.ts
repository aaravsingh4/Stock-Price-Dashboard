import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer } from 'http';
import { finnhubWsClient } from '../providers/finnhubWsClient.js';
import {
  ClientStreamMessage,
  ServerStreamMessage,
  NormalizedTradeEvent,
} from '../types/market.js';
import { env } from '../config/env.js';

interface ClientState {
  ws: WebSocket;
  subscriptions: Set<string>;
}

export class StreamGateway {
  private wss: WebSocketServer | null = null;
  private clients = new Map<WebSocket, ClientState>();
  private readonly maxSymbolsPerClient = 15;

  init(server: HttpServer): void {
    this.wss = new WebSocketServer({ server, path: '/api/stream' });

    this.wss.on('connection', (ws: WebSocket) => {
      const state: ClientState = {
        ws,
        subscriptions: new Set<string>(),
      };
      this.clients.set(ws, state);

      // Send initial status immediately
      this.sendToClient(ws, {
        type: 'status',
        provider: 'finnhub',
        connected: finnhubWsClient.isConnected,
        streamingAvailable: finnhubWsClient.isStreamingAvailable,
      });

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString()) as ClientStreamMessage;
          this.handleClientMessage(state, msg);
        } catch {
          this.sendToClient(ws, {
            type: 'error',
            message: 'Invalid stream message format. Expected JSON.',
            code: 'INVALID_FORMAT',
          });
        }
      });

      ws.on('close', () => {
        this.cleanupClient(ws);
      });

      ws.on('error', () => {
        this.cleanupClient(ws);
      });
    });

    // Listen to provider trade updates
    finnhubWsClient.onTrade((trade: NormalizedTradeEvent) => {
      this.broadcastTrade(trade);
    });

    // Listen to upstream status changes and broadcast to clients
    finnhubWsClient.onStatus((connected, streamingAvailable) => {
      this.broadcastStatus(connected, streamingAvailable);
    });
  }

  private handleClientMessage(state: ClientState, msg: ClientStreamMessage): void {
    if (!msg || typeof msg !== 'object') return;

    if (msg.action === 'ping') {
      this.sendToClient(state.ws, { type: 'pong' });
      return;
    }

    if (msg.action === 'subscribe') {
      if (!Array.isArray(msg.symbols)) {
        this.sendToClient(state.ws, {
          type: 'error',
          message: 'Subscribe requires a symbols array.',
          code: 'INVALID_SYMBOLS',
        });
        return;
      }

      const validSymbols: string[] = [];
      for (const rawSym of msg.symbols) {
        if (typeof rawSym === 'string') {
          const clean = rawSym.trim().toUpperCase();
          if (clean && clean.length <= 10 && /^[A-Z0-9.:_-]+$/.test(clean)) {
            if (state.subscriptions.size < this.maxSymbolsPerClient) {
              state.subscriptions.add(clean);
              validSymbols.push(clean);
              // Register symbol with upstream provider
              finnhubWsClient.subscribe(clean);
            }
          }
        }
      }

      this.sendToClient(state.ws, {
        type: 'subscribed',
        symbols: validSymbols,
      });
      return;
    }

    if (msg.action === 'unsubscribe') {
      if (!Array.isArray(msg.symbols)) return;

      const unsubs: string[] = [];
      for (const rawSym of msg.symbols) {
        if (typeof rawSym === 'string') {
          const clean = rawSym.trim().toUpperCase();
          if (state.subscriptions.has(clean)) {
            state.subscriptions.delete(clean);
            unsubs.push(clean);
            this.evaluateUpstreamUnsubscription(clean);
          }
        }
      }

      this.sendToClient(state.ws, {
        type: 'unsubscribed',
        symbols: unsubs,
      });
      return;
    }
  }

  private evaluateUpstreamUnsubscription(symbol: string): void {
    // Check if any other connected client is still subscribed to this symbol
    let stillNeeded = false;
    for (const client of this.clients.values()) {
      if (client.subscriptions.has(symbol)) {
        stillNeeded = true;
        break;
      }
    }

    if (!stillNeeded) {
      finnhubWsClient.unsubscribe(symbol);
    }
  }

  private broadcastTrade(trade: NormalizedTradeEvent): void {
    const payload: ServerStreamMessage = {
      type: 'trade',
      data: trade,
    };
    const messageStr = JSON.stringify(payload);

    for (const [ws, client] of this.clients.entries()) {
      if (ws.readyState === WebSocket.OPEN && client.subscriptions.has(trade.symbol)) {
        try {
          ws.send(messageStr);
        } catch {
          // Client failed send; cleanup will be handled by ws.on('close'/'error')
        }
      }
    }
  }

  private broadcastStatus(connected: boolean, streamingAvailable: boolean): void {
    const payload: ServerStreamMessage = {
      type: 'status',
      provider: 'finnhub',
      connected,
      streamingAvailable,
    };
    const messageStr = JSON.stringify(payload);

    for (const [ws] of this.clients.entries()) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageStr);
        } catch {
          // Ignore
        }
      }
    }
  }

  private sendToClient(ws: WebSocket, msg: ServerStreamMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(msg));
      } catch {
        // Ignore
      }
    }
  }

  private cleanupClient(ws: WebSocket): void {
    const state = this.clients.get(ws);
    if (!state) return;

    this.clients.delete(ws);
    // Unsubscribe unused symbols from upstream provider
    state.subscriptions.forEach((symbol) => {
      this.evaluateUpstreamUnsubscription(symbol);
    });
  }

  get connectedClientsCount(): number {
    return this.clients.size;
  }

  shutdown(): void {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    this.clients.clear();
  }
}

export const streamGateway = new StreamGateway();
