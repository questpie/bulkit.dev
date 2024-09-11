import Redis from 'ioredis'
import type { CacheAdapter } from '../base-cache'

type RedisAdapterOptions = {
  host: string
  port: number
  password?: string
  /**
   * Used to namespace the cache keys. So clear method can clear only the cache for the app.
   * @default 'cache:'
   */
  prefix?: string
}

/**
 * RedisAdapter implements the CacheAdapter interface using Redis as the backend.
 */
export class RedisAdapter implements CacheAdapter {
  private client: Redis
  private readonly prefix: string = 'cache:'

  constructor(options: RedisAdapterOptions) {
    this.client = new Redis({
      host: options.host,
      port: options.port,
      password: options.password,
    })
    this.prefix = options.prefix ?? 'cache:'
  }

  /**
   * Retrieves a value from the cache.
   * @param key - The key of the value to retrieve.
   * @returns The cached value or null if not found.
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(this.prefix + key)
    return value ? JSON.parse(value) : null
  }

  /**
   * Sets a value in the cache.
   * @param key - The key of the value to set.
   * @param value - The value to cache.
   * @param ttl - Optional time-to-live in seconds.
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const serializedValue = JSON.stringify(value)
    if (ttl) {
      await this.client.set(this.prefix + key, serializedValue, 'EX', ttl)
    } else {
      await this.client.set(this.prefix + key, serializedValue)
    }
  }

  /**
   * Deletes a value from the cache.
   * @param key - The key of the value to delete.
   */
  async delete(key: string): Promise<void> {
    await this.client.del(this.prefix + key)
  }

  /**
   * Clears all values from the cache.
   */
  async clear(): Promise<void> {
    const stream = this.client.scanStream({
      match: `${this.prefix}*`,
    })
    stream.on('data', async (keys: string[]) => {
      if (keys.length) {
        const pipeline = this.client.pipeline()
        for (const key of keys) {
          pipeline.del(key)
        }
        await pipeline.exec()
      }
    })
    return new Promise((resolve, reject) => {
      stream.on('end', resolve)
      stream.on('error', reject)
    })
  }
}
