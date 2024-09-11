/**
 * Interface for cache adapters.
 */
export interface CacheAdapter {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
}

export type CacheOptions = {
  /**
   * Time-to-live in seconds. If not provided, the value will be cached indefinitely.
   * Can be overridden by the ttl parameter in the `set` and `withCached` methods.
   */
  ttl?: number
}

/**
 * CacheClient provides a high-level API for interacting with a cache.
 */
export class CacheClient {
  constructor(
    private readonly adapter: CacheAdapter,
    private readonly options: CacheOptions = {}
  ) {}

  /**
   * Retrieves a value from the cache.
   * @param key - The key of the value to retrieve.
   * @returns The cached value or null if not found.
   */
  async get<T>(key: string): Promise<T | null> {
    return this.adapter.get<T>(key)
  }

  /**
   * Sets a value in the cache.
   * @param key - The key of the value to set.
   * @param value - The value to cache.
   * @param ttl - Optional time-to-live in seconds.
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    return this.adapter.set(key, value, ttl ?? this.options.ttl)
  }

  /**
   * Deletes a value from the cache.
   * @param key - The key of the value to delete.
   */
  async delete(key: string): Promise<void> {
    return this.adapter.delete(key)
  }

  /**
   * Clears all values from the cache.
   */
  async clear(): Promise<void> {
    return this.adapter.clear()
  }

  /**
   * Retrieves a value from the cache, or fetches it using the provided function if not found.
   * @param key - The key of the value to retrieve.
   * @param fetchFunction - The function to fetch the value if not found in the cache.
   * @param ttl - Optional time-to-live in seconds. If not provided, the default TTL from the cache options will be used.
   * @returns The cached or fetched value.
   */
  async withCached<T>(key: string, fetchFunction: () => Promise<T>, ttl?: number): Promise<T> {
    const cachedValue = await this.get<T>(key)
    if (cachedValue !== null) {
      return cachedValue
    }

    const value = await fetchFunction()
    await this.set(key, value, ttl ?? this.options.ttl)
    return value
  }
}
