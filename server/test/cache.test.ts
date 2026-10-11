import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryCache } from '../src/services/cache.js';

describe('MemoryCache Service', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache();
  });

  it('stores and retrieves value within TTL', () => {
    cache.set('quote:AAPL', { price: 150 }, 60);
    const result = cache.get<{ price: number }>('quote:AAPL');

    expect(result).not.toBeNull();
    expect(result?.value.price).toBe(150);
    expect(result?.isStale).toBe(false);
  });

  it('returns null for nonexistent keys and records a cache miss', () => {
    const result = cache.get('quote:UNKNOWN');
    expect(result).toBeNull();

    const stats = cache.getStats();
    expect(stats.misses).toBe(1);
    expect(stats.hits).toBe(0);
  });

  it('detects stale entries when TTL has elapsed', () => {
    vi.useFakeTimers();
    try {
      cache.set('quote:TSLA', { price: 200 }, 10); // 10s TTL

      // Advance clock by 15s
      vi.advanceTimersByTime(15000);

      const result = cache.get<{ price: number }>('quote:TSLA');
      expect(result).not.toBeNull();
      expect(result?.isStale).toBe(true);
      expect(result?.value.price).toBe(200);
    } finally {
      vi.useRealTimers();
    }
  });

  it('deduplicates concurrent in-flight requests for identical key', async () => {
    let executionCount = 0;
    const fetcher = async () => {
      executionCount++;
      await new Promise((resolve) => setTimeout(resolve, 50));
      return { data: 'result' };
    };

    // Invoke deduplicate simultaneously 5 times
    const promises = [
      cache.deduplicate('test:key', fetcher),
      cache.deduplicate('test:key', fetcher),
      cache.deduplicate('test:key', fetcher),
      cache.deduplicate('test:key', fetcher),
      cache.deduplicate('test:key', fetcher),
    ];

    const results = await Promise.all(promises);

    expect(executionCount).toBe(1);
    results.forEach((res) => {
      expect(res).toEqual({ data: 'result' });
    });
  });

  it('clears all entries and resets stats', () => {
    cache.set('key1', 'val1', 60);
    cache.set('key2', 'val2', 60);
    cache.get('key1'); // hit

    cache.clear();
    const stats = cache.getStats();

    expect(stats.totalEntries).toBe(0);
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
  });
});
