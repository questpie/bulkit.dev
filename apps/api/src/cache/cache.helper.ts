import { ioc, iocRegister, iocResolve } from '@bulkit/api/ioc'
import { injectRedis } from '@bulkit/api/redis/redis-clients'
import { RedisAdapter } from '@bulkit/cache/adapters'
import { CacheClient } from '@bulkit/cache/base-cache'

export const injectCache = iocRegister('cache', () => {
  const { redis } = iocResolve(ioc.use(injectRedis))

  return new CacheClient(new RedisAdapter(redis.get()))
})
