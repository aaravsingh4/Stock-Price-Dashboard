export type AlertCondition = 'ABOVE' | 'BELOW';
export type AlertStatus = 'ACTIVE' | 'TRIGGERED' | 'DISABLED';

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: AlertCondition;
  createdAt: string;
  status: AlertStatus;
  triggeredAt?: string;
  observedPrice?: number;
  note?: string;
}

export interface TriggeredAlertEvent {
  alert: PriceAlert;
  observedPrice: number;
  timestamp: string;
}
