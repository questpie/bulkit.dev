import { redisManager } from '@questpie/api/redis/redis-clients'
import { Elysia } from 'elysia'
import { createHash } from 'node:crypto'

interface RateLimitOptions {
  /**
   * @default 100
   */
  limit?: number
  /**
   * @default 60
   */
  window?: number // in seconds
  keyPrefix?: string
}

export const rateLimit = () => {
  return new Elysia({ name: 'rate-limit' })
    .macro(({ onBeforeHandle }) => ({
      applyRateLimit(options?: RateLimitOptions) {
        if (!options) return

        onBeforeHandle(async ({ request, set, error }) => {
          const limit = options.limit ?? 100
          const window = options.window ?? 60
          const keyPrefix = options.keyPrefix ?? 'rate-limit:'

          const ip = request.headers.get('x-forwarded-for') || 'unknown'
          const path = new URL(request.url).pathname
          const hash = createHash('md5').update(`${ip}:${path}`).digest('hex')
          const key = `${keyPrefix}${hash}`

          const redis = redisManager.get('default')
          const multi = redis.multi()
          multi.incr(key)
          multi.expire(key, window)
          const result = await multi.exec()
          const count = result ? result[0] : null

          const remaining = Math.max(0, limit - (count?.[1] as number))
          //   const reset = Math.ceil(Date.now() / 1000) + window

          if (remaining === 0) {
            return error(429, 'Too many requests')
          }
        })
      },
    }))
    .as('plugin')
}

export const applyRateLimit = (options: RateLimitOptions = {}) =>
  new Elysia().use(rateLimit()).guard({ applyRateLimit: options }).as('plugin')
