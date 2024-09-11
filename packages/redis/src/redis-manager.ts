import { Redis, type RedisOptions } from 'ioredis'

export type RedisConfig = {
  default: RedisOptions | string
  [key: string]: RedisOptions | string
}

export class RedisManager<const TRedisConfig extends RedisConfig> {
  private clients: Map<keyof TRedisConfig, Redis> = new Map()
  private defaultClient: keyof TRedisConfig = 'default'

  constructor(private redisConfig: TRedisConfig) {}

  static parseRedisUrl(url: string): RedisOptions {
    const parsedUrl = new URL(url)
    const db = Number(parsedUrl.pathname.split('/')[1]) ?? undefined
    return {
      host: parsedUrl.hostname,
      port: Number(parsedUrl.port),
      password: parsedUrl.password,
      db: Number.isNaN(db) ? undefined : db,
    }
  }

  get(name?: keyof TRedisConfig): Redis {
    const clientName = name ?? this.defaultClient

    if (!this.clients.has(clientName)) {
      const clientConfig = this.redisConfig[clientName]
      if (!clientConfig) {
        throw new Error(`Redis configuration for '${String(clientName)}' not found`)
      }
      const newClient = new Redis(clientConfig as RedisOptions)
      this.clients.set(clientName, newClient)
    }
    return this.clients.get(clientName)!
  }
}
