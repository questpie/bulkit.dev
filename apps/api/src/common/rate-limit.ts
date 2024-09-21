import { Elysia } from 'elysia'
import { createHash } from 'node:crypto'
import { ip } from 'elysia-ip'
import { redisPlugin } from '@bulkit/api/redis/redis-clients'

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

  /**
   *
   * @param ctx Elysia context, defined as any because of difficult type inference
   */
  buildIdentifierKey?(ctx: any): Promise<string> | string
}

export const rateLimit = () => {
  return new Elysia({ name: 'rate-limit' })
    .use(ip())
    .use(redisPlugin())
    .macro(({ onBeforeHandle }) => ({
      applyRateLimit(options?: RateLimitOptions) {
        if (!options) return

        onBeforeHandle(async (ctx) => {
          const limit = options.limit ?? 100
          const window = options.window ?? 60
          const keyPrefix = options.keyPrefix ?? 'rate-limit:'

          let key: string

          if (options.buildIdentifierKey) {
            key = await options.buildIdentifierKey(ctx)
          } else {
            const ip = ctx.ip || 'unknown'
            const path = new URL(ctx.request.url).pathname
            const hash = createHash('md5').update(`${ip}:${path}`).digest('hex')
            key = `${keyPrefix}${hash}`
          }

          const redis = ctx.redis.get('default')
          const multi = redis.multi()
          multi.incr(key)
          multi.expire(key, window)
          const result = await multi.exec()
          const count = result ? result[0] : null

          const remaining = Math.max(0, limit - (count?.[1] as number))
          const reset = (Math.ceil(Date.now() / 1000) + window) * 1000

          // set ratelimit response headers
          ctx.set.headers['x-ratelimit-limit'] = String(limit)
          ctx.set.headers['x-ratelimit-remaining'] = String(remaining)
          ctx.set.headers['x-ratelimit-reset'] = String(reset)

          if (remaining === 0) {
            return ctx.error(429, 'Too many requests')
          }
        })
      },
    }))
    .as('plugin')
}

export const applyRateLimit = (options: RateLimitOptions = {}) =>
  new Elysia().use(rateLimit()).guard({ applyRateLimit: options }).as('plugin')
