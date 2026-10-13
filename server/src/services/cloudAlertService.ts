import { finnhubWsClient } from '../providers/finnhubWsClient.js';
import { AlertRepository } from '../repositories/alertRepository.js';
import { AlertCondition } from '@prisma/client';
import type { NormalizedTradeEvent } from '../types/market.js';
import { EventEmitter } from 'events';

export interface AlertTriggerNotification {
  userId: string;
  alertId: string;
  symbol: string;
  condition: AlertCondition;
  targetPrice: number;
  observedPrice: number;
  triggeredAt: string;
}

export class CloudAlertService extends EventEmitter {
  private activeSymbols = new Set<string>();
  private initialized = false;

  /**
   * Initializes cloud alert service by loading ACTIVE rules and subscribing to upstream market feed.
   */
  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    await this.reconcileSubscriptions();

    // Listen to incoming trades from provider WebSocket
    finnhubWsClient.onTrade((trade: NormalizedTradeEvent) => {
      this.evaluateTrade(trade).catch((err) => {
        console.error('[CloudAlertService] Error evaluating trade:', err);
      });
    });

    // Reconcile and restore subscriptions when provider reconnects
    finnhubWsClient.onStatus((connected) => {
      if (connected) {
        console.log('[CloudAlertService] Upstream reconnected — restoring cloud alert subscriptions');
        this.reconcileSubscriptions().catch(console.error);
      }
    });
  }

  /**
   * Reconciles active alert symbols with the upstream provider subscription pool.
   */
  async reconcileSubscriptions(): Promise<void> {
    try {
      const activeAlerts = await AlertRepository.listActiveAlerts();
      const currentActiveSymbols = new Set<string>(activeAlerts.map((a) => a.symbol.toUpperCase()));

      // Subscribe new symbols to finnhubWsClient
      for (const symbol of currentActiveSymbols) {
        if (!this.activeSymbols.has(symbol)) {
          finnhubWsClient.subscribe(symbol);
          this.activeSymbols.add(symbol);
        }
      }

      // Unsubscribe symbols that no longer have active alerts
      for (const symbol of this.activeSymbols) {
        if (!currentActiveSymbols.has(symbol)) {
          this.activeSymbols.delete(symbol);
          finnhubWsClient.unsubscribe(symbol);
        }
      }
    } catch (err) {
      console.error('[CloudAlertService] Failed to reconcile subscriptions:', err);
    }
  }

  /**
   * Evaluates a trade event against active database rules with exact-once transactional triggers.
   */
  async evaluateTrade(trade: NormalizedTradeEvent): Promise<void> {
    const symbol = trade.symbol.toUpperCase();
    if (!this.activeSymbols.has(symbol)) return;

    const matchingAlerts = await AlertRepository.listActiveBySymbol(symbol);
    if (!matchingAlerts.length) return;

    for (const alert of matchingAlerts) {
      const targetPrice = Number(alert.targetPrice);
      const currentPrice = trade.price;

      let triggered = false;
      if (alert.condition === AlertCondition.ABOVE && currentPrice >= targetPrice) {
        triggered = true;
      } else if (alert.condition === AlertCondition.BELOW && currentPrice <= targetPrice) {
        triggered = true;
      }

      if (triggered) {
        // Atomic transaction: marks status = TRIGGERED and inserts history with deduplication key
        const result = await AlertRepository.triggerAlertTransaction(
          alert.id,
          currentPrice,
          new Date(trade.timestamp)
        );

        if (result) {
          console.log(`[CloudAlertService] 🔔 Alert Triggered for User ${alert.userId}: ${symbol} ${alert.condition} ${targetPrice} (Observed: ${currentPrice})`);
          
          const notification: AlertTriggerNotification = {
            userId: alert.userId,
            alertId: alert.id,
            symbol: alert.symbol,
            condition: alert.condition,
            targetPrice,
            observedPrice: currentPrice,
            triggeredAt: result.history.triggeredAt.toISOString(),
          };

          this.emit('alert_triggered', notification);
          // Re-evaluate symbol subscription after alert state changed
          await this.reconcileSubscriptions();
        }
      }
    }
  }

  isSymbolMonitored(symbol: string): boolean {
    return this.activeSymbols.has(symbol.toUpperCase());
  }

  get monitoredSymbols(): string[] {
    return Array.from(this.activeSymbols);
  }
}

export const cloudAlertService = new CloudAlertService();
