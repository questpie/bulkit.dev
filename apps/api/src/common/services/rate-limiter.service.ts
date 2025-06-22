import { ioc } from '@bulkit/api/ioc'
import { injectRedis } from '@bulkit/api/redis/redis-clients'
import type { RedisClient } from '@bulkit/redis/redis-manager'
import { appLogger } from '@bulkit/shared/utils/logger'
import type { Context } from 'elysia'
import { HttpError } from 'elysia-http-error'
import { createHash } from 'node:crypto'

type RateLimitTier = {
  points: number
  duration: number
  blockDuration?: number
}

type RateLimitOptions = {
  anonymous: RateLimitTier
  authenticated: RateLimitTier
  keyPrefix?: string
}

type RateLimitError = {
  code: 'RATE_LIMITED' | 'BLOCKED'
  retryAfter: number
  limit: number
  remaining: number
}

export class RateLimiter {
  private redis: RedisClient
  private readonly RATE_LIMIT_COOKIE = 'blk_rl'
  private readonly COOKIE_MAX_AGE = 86400 * 30 // 30 days

  constructor(private options: RateLimitOptions) {
    this.validateOptions(options)
    const container = ioc.resolve([injectRedis])
    this.redis = container.redis.get()
  }

  private validateOptions(options: RateLimitOptions): void {
    const tiers = [options.anonymous, options.authenticated]

    for (const tier of tiers) {
      if (tier.points <= 0) throw new Error('Points must be greater than 0')
      if (tier.duration <= 0) throw new Error('Duration must be greater than 0')
      if (tier.blockDuration !== undefined && tier.blockDuration <= 0) {
        throw new Error('Block duration must be greater than 0')
      }
    }
  }

  private generateClientId(): string {
    return createHash('sha256').update(crypto.randomUUID()).digest('hex')
  }

  private getKey(identifier: string, type: 'client' | 'user' = 'client'): string {
    const prefix = this.options.keyPrefix || 'rate_limit'
    return `${prefix}:${type}:${identifier}`
  }

  private getBlockKey(key: string): string {
    return `${key}:blocked`
  }

  private getTier(userId?: string): RateLimitTier {
    return userId ? this.options.authenticated : this.options.anonymous
  }

  private createRateLimitError(error: RateLimitError, ctx: Context): HttpError {
    return HttpError.TooManyRequests(
      `Rate limit exceeded. Try again in ${error.retryAfter} seconds`
    )
  }

  private setRateLimitHeaders(ctx: Context, error: RateLimitError): void {
    ctx.set.headers['Retry-After'] = error.retryAfter.toString()
    ctx.set.headers['X-RateLimit-Limit'] = error.limit.toString()
    ctx.set.headers['X-RateLimit-Remaining'] = error.remaining.toString()
  }

  private async checkSlidingWindowLimit(key: string, tier: RateLimitTier): Promise<number> {
    const now = Date.now()
    const windowStart = now - tier.duration * 1000

    await this.redis
      .multi()
      .zremrangebyscore(key, 0, windowStart)
      .zadd(key, now, now.toString())
      .expire(key, tier.duration)
      .exec()

    const requestCount = await this.redis.zcount(key, windowStart, '+inf')
    return tier.points - requestCount
  }

  private getClientIdentifier(ctx: Context): string {
    // Try to get IP from various proxy headers
    const ip =
      ctx.request.headers.get('x-forwarded-for')?.split(',')[0] || // Get first IP if multiple
      ctx.request.headers.get('x-real-ip') ||
      ctx.request.headers.get('x-cloudflare-ip') ||
      ctx.request.headers.get('cf-connecting-ip') // Additional Cloudflare header

    if (ip) {
      return `ip:${ip}`
    }

    // Fall back to cookie-based client ID
    let clientId = ctx.cookie[this.RATE_LIMIT_COOKIE]?.value
    if (!clientId) {
      clientId = this.generateClientId()
      ctx.cookie[this.RATE_LIMIT_COOKIE]!.set({
        value: clientId,
        maxAge: this.COOKIE_MAX_AGE,
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
      })
    }

    return `client:${clientId}`
  }

  async isAllowed(
    ctx: Context,
    userId?: string
  ): Promise<{
    allowed: boolean
    remaining: number
    resetIn: number
    headers: Record<string, string>
  }> {
    const tier = this.getTier(userId)
    const identifier = this.getClientIdentifier(ctx)

    appLogger.debug({
      msg: 'Rate limit check started',
      userId,
      identifier,
      tierType: userId ? 'authenticated' : 'anonymous',
      points: tier.points,
      duration: tier.duration,
    })

    // Check both client and user-based limits if authenticated
    const keys = userId
      ? [this.getKey(identifier, 'client'), this.getKey(userId, 'user')]
      : [this.getKey(identifier, 'client')]

    for (const key of keys) {
      const blockKey = this.getBlockKey(key)

      const blocked = await this.redis.get(blockKey)
      if (blocked) {
        const blockTTL = await this.redis.ttl(blockKey)
        appLogger.debug({
          msg: 'Request blocked by rate limiter',
          key,
          blockTTL,
          userId,
        })
        this.setRateLimitHeaders(ctx, {
          code: 'BLOCKED',
          retryAfter: blockTTL,
          limit: tier.points,
          remaining: 0,
        })
        throw this.createRateLimitError(
          {
            code: 'BLOCKED',
            retryAfter: blockTTL,
            limit: tier.points,
            remaining: 0,
          },
          ctx
        )
      }

      const remaining = await this.checkSlidingWindowLimit(key, tier)

      if (remaining <= 0) {
        appLogger.debug({
          msg: 'Rate limit exceeded',
          key,
          userId,
          blockDuration: tier.blockDuration,
        })
        if (tier.blockDuration) {
          await this.redis.multi().set(blockKey, '1').expire(blockKey, tier.blockDuration).exec()
        }

        this.setRateLimitHeaders(ctx, {
          code: 'RATE_LIMITED',
          retryAfter: tier.duration,
          limit: tier.points,
          remaining: 0,
        })
        throw this.createRateLimitError(
          {
            code: 'RATE_LIMITED',
            retryAfter: tier.duration,
            limit: tier.points,
            remaining: 0,
          },
          ctx
        )
      }
    }

    const mainKey = userId ? this.getKey(userId, 'user') : this.getKey(identifier, 'client')
    const [remaining, ttl] = await Promise.all([
      this.redis.zcount(mainKey, '-inf', '+inf'),
      this.redis.ttl(mainKey),
    ])

    const remainingPoints = tier.points - remaining

    appLogger.debug({
      msg: 'Rate limit check completed',
      userId,
      mainKey,
      remainingPoints,
      resetIn: ttl,
    })

    return {
      allowed: true,
      remaining: remainingPoints,
      resetIn: ttl,
      headers: {
        'X-RateLimit-Limit': tier.points.toString(),
        'X-RateLimit-Remaining': remainingPoints.toString(),
        'X-RateLimit-Reset': (Math.floor(Date.now() / 1000) + ttl).toString(),
      },
    }
  }
}
