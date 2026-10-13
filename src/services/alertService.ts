import { PriceAlert, TriggeredAlertEvent, AlertCondition } from '../types/alerts';
import { RealtimeTrade } from './marketStreamClient';

const STORAGE_KEY_ALERTS = 'tradepulse_price_alerts_v1';
const STORAGE_KEY_HISTORY = 'tradepulse_alert_history_v1';
const MAX_ALERTS_PER_USER = 25;

export type AlertTriggerListener = (event: TriggeredAlertEvent) => void;
export type AlertChangeListener = (alerts: PriceAlert[]) => void;

class AlertService {
  private alerts: PriceAlert[] = [];
  private history: TriggeredAlertEvent[] = [];
  private triggerListeners = new Set<AlertTriggerListener>();
  private changeListeners = new Set<AlertChangeListener>();
  private evaluatedTradeKeys = new Set<string>();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const rawAlerts = localStorage.getItem(STORAGE_KEY_ALERTS);
        if (rawAlerts) {
          this.alerts = JSON.parse(rawAlerts);
        }
        const rawHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
        if (rawHistory) {
          this.history = JSON.parse(rawHistory);
        }
      }
    } catch {
      // Fallback to in-memory if storage is corrupted or disabled
      this.alerts = [];
      this.history = [];
    }
  }

  private saveToStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(this.alerts));
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(this.history.slice(0, 50)));
      }
    } catch {
      // Storage quota exceeded or disabled
    }
  }

  getAlerts(): PriceAlert[] {
    return [...this.alerts];
  }

  getHistory(): TriggeredAlertEvent[] {
    return [...this.history];
  }

  createAlert(symbol: string, targetPrice: number, condition: AlertCondition, note?: string): PriceAlert {
    const cleanSymbol = symbol.trim().toUpperCase();
    if (!cleanSymbol) {
      throw new Error('Stock symbol is required');
    }
    if (typeof targetPrice !== 'number' || Number.isNaN(targetPrice) || targetPrice <= 0) {
      throw new Error('Target price must be a positive finite number');
    }
    if (condition !== 'ABOVE' && condition !== 'BELOW') {
      throw new Error('Condition must be ABOVE or BELOW');
    }

    const activeCount = this.alerts.filter((a) => a.status === 'ACTIVE').length;
    if (activeCount >= MAX_ALERTS_PER_USER) {
      throw new Error(`Maximum limit of ${MAX_ALERTS_PER_USER} active alerts reached`);
    }

    const newAlert: PriceAlert = {
      id: `alt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      symbol: cleanSymbol,
      targetPrice: Number(targetPrice.toFixed(2)),
      condition,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      note: note?.trim(),
    };

    this.alerts.unshift(newAlert);
    this.saveToStorage();
    this.notifyChange();
    return newAlert;
  }

  deleteAlert(alertId: string): void {
    this.alerts = this.alerts.filter((a) => a.id !== alertId);
    this.saveToStorage();
    this.notifyChange();
  }

  toggleAlert(alertId: string): void {
    this.alerts = this.alerts.map((a) => {
      if (a.id === alertId) {
        return {
          ...a,
          status: a.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
        };
      }
      return a;
    });
    this.saveToStorage();
    this.notifyChange();
  }

  clearHistory(): void {
    this.history = [];
    this.saveToStorage();
  }

  /**
   * Central deterministic evaluation against validated price ticks
   */
  evaluateTrade(trade: RealtimeTrade): TriggeredAlertEvent[] {
    if (!trade || typeof trade.price !== 'number' || trade.price <= 0) {
      return [];
    }

    // Deduplicate identical trade event checks
    const tradeKey = `${trade.symbol}:${trade.price}:${trade.providerTimestamp}`;
    if (this.evaluatedTradeKeys.has(tradeKey)) {
      return [];
    }
    this.evaluatedTradeKeys.add(tradeKey);
    // Keep deduplication set bounded
    if (this.evaluatedTradeKeys.size > 2000) {
      this.evaluatedTradeKeys.clear();
    }

    const triggeredEvents: TriggeredAlertEvent[] = [];
    const nowIso = new Date().toISOString();

    this.alerts = this.alerts.map((alert) => {
      if (alert.status !== 'ACTIVE' || alert.symbol !== trade.symbol) {
        return alert;
      }

      let isTriggered = false;
      if (alert.condition === 'ABOVE' && trade.price >= alert.targetPrice) {
        isTriggered = true;
      } else if (alert.condition === 'BELOW' && trade.price <= alert.targetPrice) {
        isTriggered = true;
      }

      if (isTriggered) {
        const updatedAlert: PriceAlert = {
          ...alert,
          status: 'TRIGGERED',
          triggeredAt: nowIso,
          observedPrice: trade.price,
        };

        const event: TriggeredAlertEvent = {
          alert: updatedAlert,
          observedPrice: trade.price,
          timestamp: nowIso,
        };

        triggeredEvents.push(event);
        this.history.unshift(event);
        return updatedAlert;
      }

      return alert;
    });

    if (triggeredEvents.length > 0) {
      this.saveToStorage();
      this.notifyChange();

      // Dispatch to trigger listeners
      triggeredEvents.forEach((ev) => {
        this.triggerListeners.forEach((listener) => {
          try {
            listener(ev);
          } catch (e) {
            console.error('Alert trigger listener error:', e);
          }
        });
      });
    }

    return triggeredEvents;
  }

  onTrigger(listener: AlertTriggerListener): () => void {
    this.triggerListeners.add(listener);
    return () => this.triggerListeners.delete(listener);
  }

  onChange(listener: AlertChangeListener): () => void {
    this.changeListeners.add(listener);
    listener(this.getAlerts());
    return () => this.changeListeners.delete(listener);
  }

  private notifyChange(): void {
    const list = this.getAlerts();
    this.changeListeners.forEach((l) => {
      try {
        l(list);
      } catch (e) {
        console.error('Alert change listener error:', e);
      }
    });
  }
}

export const alertService = new AlertService();
