export interface UserProfile {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface WatchlistItemDto {
  id: string;
  watchlistId: string;
  symbol: string;
  name: string | null;
  exchange: string | null;
  addedAt: string;
}

export interface WatchlistDto {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  items: WatchlistItemDto[];
}

export interface CloudPriceAlertDto {
  id: string;
  userId: string;
  symbol: string;
  condition: 'ABOVE' | 'BELOW';
  targetPrice: number | string;
  status: 'ACTIVE' | 'TRIGGERED' | 'DISABLED';
  createdAt: string;
  triggeredAt: string | null;
  triggeredPrice: number | string | null;
  eventTime: string | null;
}

export interface CloudAlertHistoryDto {
  id: string;
  userId: string;
  alertId: string | null;
  symbol: string;
  condition: 'ABOVE' | 'BELOW';
  targetPrice: number | string;
  observedPrice: number | string;
  eventTime: string | null;
  triggeredAt: string;
  dedupId: string;
}

export interface LocalDataMigrationPayload {
  watchlists?: Array<{
    name?: string;
    symbols?: Array<{ symbol: string; name?: string; exchange?: string }>;
  }>;
  alerts?: Array<{
    symbol: string;
    condition: string;
    targetPrice: number;
  }>;
}

export interface MigrationSummaryResponse {
  success: boolean;
  summary: {
    watchlists: { imported: number; skipped: number; failed: number };
    symbols: { imported: number; skipped: number; failed: number };
    alerts: { imported: number; skipped: number; failed: number };
  };
}
