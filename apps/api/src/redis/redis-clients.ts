import { envApi } from '@bulkit/api/envApi'
import { iocRegister } from '@bulkit/api/ioc'
import { RedisManager } from '@bulkit/redis/redis-manager'

export const injectRedis = iocRegister(
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
