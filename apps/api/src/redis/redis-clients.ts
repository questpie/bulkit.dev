import { env } from '@questpie/api/env'
import { RedisManager } from '@questpie/redis/redis-manager'

/**
 * Specify your redis clients here
 */
export const redisManager = new RedisManager({
  default: env.REDIS_URL,
  queue: {
    ...RedisManager.parseRedisUrl(env.REDIS_URL),
    maxRetriesPerRequest: null,
  },
  // add another client here
  // and get it with redisManager.get('queue')
  // queue: env.REDIS_URL
})
