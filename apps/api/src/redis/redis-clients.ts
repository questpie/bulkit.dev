import { envApi } from '@bulkit/api/envApi'
import { ioc } from '@bulkit/api/ioc'
import { RedisManager } from '@bulkit/redis/redis-manager'
import Elysia from 'elysia'

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

export const redisPlugin = () =>
  ioc.use(
    new Elysia({
      name: 'ioc.redis',
    }).decorate('redis', redisManager)
  )
