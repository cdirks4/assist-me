interface CacheItem<T> {
  value: T;
  expiry: number;
}

class InMemoryCache {
  private cache: Map<string, CacheItem<any>> = new Map();

  set<T>(key: string, value: T, ttl: number): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value as T;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const inMemoryCache = new InMemoryCache();
