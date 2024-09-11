import { LRUCache } from 'lru-cache'
import type { CacheAdapter } from '../base-cache'

type InMemoryAdapterOptions = {
  max: number
  ttl?: number
}

/**
 * InMemoryAdapter implements the CacheAdapter interface using an in-memory LRU cache.
 */
export class InMemoryAdapter implements CacheAdapter {
  private cache: LRUCache<string, any>

  constructor(options: InMemoryAdapterOptions) {
    this.cache = new LRUCache({ max: options.max, ttl: options.ttl })
  }

  /**
   * Retrieves a value from the cache.
   * @param key - The key of the value to retrieve.
   * @returns The cached value or null if not found.
   */
  async get<T>(key: string): Promise<T | null> {
    return this.cache.get(key) ?? null
  }

  /**
   * Sets a value in the cache.
   * @param key - The key of the value to set.
   * @param value - The value to cache.
   * @param ttl - Optional time-to-live in milliseconds.
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    this.cache.set(key, value, { ttl })
  }

  /**
   * Deletes a value from the cache.
   * @param key - The key of the value to delete.
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key)
  }

  /**
   * Clears all values from the cache.
   */
  async clear(): Promise<void> {
    this.cache.clear()
  }
}
