import { envApi } from '@bulkit/api/envApi'
import { ioc } from '@bulkit/api/ioc'
import { RedisManager } from '@bulkit/redis/redis-manager'

/**
 * For testing purposes, you can enable the mock by calling `RedisManager.enableMock()`
 */
export const injectRedis = ioc.register(
  'redis',
  () =>
    new RedisManager({
      default: envApi.REDIS_URL,
      queue: {
        ...RedisManager.parseRedisUrl(envApi.REDIS_URL),
        maxRetriesPerRequest: null,
      },
      // add another client here
      // and get it with redisManager.get('queue')
      // queue: env.REDIS_URL
    })
)
