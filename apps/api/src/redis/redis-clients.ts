import { envApi } from '@bulkit/api/envApi'
import { RedisManager } from '@bulkit/redis/redis-manager'

/**
 * Specify your redis clients here
 */
export const redisManager = new RedisManager({
  default: envApi.REDIS_URL,
  queue: {
    ...RedisManager.parseRedisUrl(envApi.REDIS_URL),
    maxRetriesPerRequest: null,
  },
  // add another client here
  // and get it with redisManager.get('queue')
  // queue: env.REDIS_URL
})
