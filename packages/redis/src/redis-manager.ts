import { Redis, type RedisOptions } from 'ioredis'
import type { Constructor as RedisMockConstructor } from 'ioredis-mock'

export type RedisConfig = {
  default: RedisOptions | string
  [key: string]: RedisOptions | string
}

export class RedisManager<const TRedisConfig extends RedisConfig> {
  private clients: Map<keyof TRedisConfig, Redis> = new Map()
  private defaultClient: keyof TRedisConfig = 'default'
  private static useMock = false
  private static RedisMock: RedisMockConstructor | null = null

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

  static async enableMock(): Promise<void> {
    try {
      // Dynamic import of ioredis-mock
      const module = await import('ioredis-mock')
      RedisManager.RedisMock = module.default
      RedisManager.useMock = true
    } catch (error) {
      throw new Error('ioredis-mock is not installed. Please install it as a dev dependency.')
    }
  }

  static disableMock(): void {
    RedisManager.useMock = false
    RedisManager.RedisMock = null
  }

  get(name?: keyof TRedisConfig): Redis {
    const clientName = name ?? this.defaultClient

    if (!this.clients.has(clientName)) {
      const clientConfig = this.redisConfig[clientName]
      if (!clientConfig) {
        throw new Error(`Redis configuration for '${String(clientName)}' not found`)
      }
      const ClientClass = RedisManager.useMock ? RedisManager.RedisMock! : Redis
      const newClient = new ClientClass(clientConfig as RedisOptions)
      this.clients.set(clientName, newClient)
    }
    return this.clients.get(clientName)!
  }
}
