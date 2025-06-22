import { ioc } from '@bulkit/api/ioc'
import { injectRedis } from '@bulkit/api/redis/redis-clients'
import { RedisAdapter } from '@bulkit/cache/adapters'
import { CacheClient } from '@bulkit/cache/base-cache'

export const injectCache = ioc.register('cache', () => {
  const { redis } = ioc.resolve([injectRedis])

  return new CacheClient(new RedisAdapter(redis.get()))
})
