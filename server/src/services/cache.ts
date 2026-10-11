interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  cachedAt: number;
}

export class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private inFlight = new Map<string, Promise<unknown>>();
  private hits = 0;
  private misses = 0;

  get<T>(key: string): { value: T; isStale: boolean; cachedAt: number } | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) {
      this.misses++;
      return null;
    }

    const now = Date.now();
    const isStale = now > entry.expiresAt;
    this.hits++;
    return {
      value: entry.value,
      isStale,
      cachedAt: entry.cachedAt,
    };
  }

  set<T>(key: string, value: T, ttlSeconds: number): void {
    const now = Date.now();
    this.store.set(key, {
      value,
      expiresAt: now + ttlSeconds * 1000,
      cachedAt: now,
    });
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
    this.inFlight.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Deduplicates concurrent in-flight requests for the identical cache key
   */
  async deduplicate<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key) as Promise<T> | undefined;
    if (existing) {
      return existing;
    }

    const promise = (async () => {
      try {
        return await fetcher();
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);
    return promise;
  }

  getStats() {
    return {
      totalEntries: this.store.size,
      activeInFlight: this.inFlight.size,
      hits: this.hits,
      misses: this.misses,
      hitRatio: this.hits + this.misses > 0 ? (this.hits / (this.hits + this.misses)).toFixed(2) : '0.00',
    };
  }
}

// Global cache singletons with explicit TTL constants (in seconds)
export const CACHE_TTL = {
  QUOTE: 30, // 30s quote freshness
  CANDLES: 300, // 5m candle intervals
  SEARCH: 3600, // 1h search catalog
} as const;

export const marketCache = new MemoryCache();
