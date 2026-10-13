import type {
  UserProfile,
  WatchlistDto,
  WatchlistItemDto,
  CloudPriceAlertDto,
  CloudAlertHistoryDto,
  LocalDataMigrationPayload,
  MigrationSummaryResponse,
} from '../types/auth';

const API_BASE = '/api';

class CloudPersistenceClient {
  private customHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'TradePulse-Client',
  };

  // -------------------------------------------------------------
  // Authentication
  // -------------------------------------------------------------
  async getMe(): Promise<UserProfile | null> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: this.customHeaders,
        credentials: 'include',
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.data?.user || null;
    } catch {
      return null;
    }
  }

  async login(email: string, password: string): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: this.customHeaders,
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || 'Login failed');
    }
    return json.data.user;
  }

  async register(email: string, password: string): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: this.customHeaders,
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || 'Registration failed');
    }
    return json.data.user;
  }

  async logout(): Promise<void> {
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: this.customHeaders,
      credentials: 'include',
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error?.message || 'Logout failed');
    }
  }

  // -------------------------------------------------------------
  // Watchlists
  // -------------------------------------------------------------
  async getWatchlists(): Promise<WatchlistDto[]> {
    const res = await fetch(`${API_BASE}/watchlists`, {
      headers: this.customHeaders,
      credentials: 'include',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to fetch watchlists');
    return json.data || [];
  }

  async createWatchlist(name: string): Promise<WatchlistDto> {
    const res = await fetch(`${API_BASE}/watchlists`, {
      method: 'POST',
      headers: this.customHeaders,
      credentials: 'include',
      body: JSON.stringify({ name }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to create watchlist');
    return json.data;
  }

  async renameWatchlist(id: string, name: string): Promise<WatchlistDto> {
    const res = await fetch(`${API_BASE}/watchlists/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: this.customHeaders,
      credentials: 'include',
      body: JSON.stringify({ name }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to rename watchlist');
    return json.data;
  }

  async deleteWatchlist(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/watchlists/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: this.customHeaders,
      credentials: 'include',
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error?.message || 'Failed to delete watchlist');
    }
  }

  async addWatchlistSymbol(
    watchlistId: string,
    symbol: string,
    name?: string,
    exchange?: string
  ): Promise<WatchlistItemDto> {
    const res = await fetch(`${API_BASE}/watchlists/${encodeURIComponent(watchlistId)}/symbols`, {
      method: 'POST',
      headers: this.customHeaders,
      credentials: 'include',
      body: JSON.stringify({ symbol, name, exchange }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to add stock to watchlist');
    return json.data;
  }

  async removeWatchlistSymbol(watchlistId: string, symbol: string): Promise<void> {
    const res = await fetch(
      `${API_BASE}/watchlists/${encodeURIComponent(watchlistId)}/symbols/${encodeURIComponent(symbol)}`,
      {
        method: 'DELETE',
        headers: this.customHeaders,
        credentials: 'include',
      }
    );
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error?.message || 'Failed to remove stock from watchlist');
    }
  }

  // -------------------------------------------------------------
  // Cloud Price Alerts
  // -------------------------------------------------------------
  async getCloudAlerts(): Promise<CloudPriceAlertDto[]> {
    const res = await fetch(`${API_BASE}/alerts`, {
      headers: this.customHeaders,
      credentials: 'include',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to fetch cloud alerts');
    return json.data || [];
  }

  async getCloudAlertHistory(): Promise<CloudAlertHistoryDto[]> {
    const res = await fetch(`${API_BASE}/alerts/history`, {
      headers: this.customHeaders,
      credentials: 'include',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to fetch alert history');
    return json.data || [];
  }

  async createCloudAlert(
    symbol: string,
    condition: 'ABOVE' | 'BELOW',
    targetPrice: number
  ): Promise<CloudPriceAlertDto> {
    const res = await fetch(`${API_BASE}/alerts`, {
      method: 'POST',
      headers: this.customHeaders,
      credentials: 'include',
      body: JSON.stringify({ symbol, condition, targetPrice }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to create alert');
    return json.data;
  }

  async deleteCloudAlert(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/alerts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: this.customHeaders,
      credentials: 'include',
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error?.message || 'Failed to delete alert');
    }
  }

  // -------------------------------------------------------------
  // Data Migration
  // -------------------------------------------------------------
  async migrateLocalData(payload: LocalDataMigrationPayload): Promise<MigrationSummaryResponse> {
    const res = await fetch(`${API_BASE}/migrate/local-data`, {
      method: 'POST',
      headers: this.customHeaders,
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to migrate local data');
    return json.data;
  }
}

export const cloudClient = new CloudPersistenceClient();
