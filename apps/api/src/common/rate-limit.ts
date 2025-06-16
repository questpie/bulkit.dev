import { authMiddleware } from '@bulkit/api/modules/auth/auth.middleware'
import { Elysia } from 'elysia'
import { HttpError } from 'elysia-http-error'
import { RateLimiter } from './services/rate-limiter.service'

type RateLimitTier = {
  points: number
  duration: number
  blockDuration?: number
}

type RateLimitOptions = {
  tiers?: {
    anonymous?: RateLimitTier
    authenticated?: RateLimitTier
  }
  keyPrefix?: string
}

const DEFAULT_TIERS = {
  anonymous: {
    points: 100,
    duration: 60,
    blockDuration: 300,
  },
  authenticated: {
    points: 200,
    duration: 60,
    blockDuration: 300,
  },
}

const defaultOptions: RateLimitOptions = {
  tiers: DEFAULT_TIERS,
}

export const rateLimit = new Elysia({ name: 'rate-limit' })
  .use(authMiddleware)
  .macro(({ onBeforeHandle }) => ({
    applyRateLimit(options: RateLimitOptions = defaultOptions) {
      if (!options) return

      const limiter = new RateLimiter({
        anonymous: options.tiers?.anonymous ?? DEFAULT_TIERS.anonymous,
        authenticated: options.tiers?.authenticated ?? DEFAULT_TIERS.authenticated,
        keyPrefix: options.keyPrefix,
      })

      onBeforeHandle(async (ctx) => {
        try {
          const { headers } = await limiter.isAllowed(ctx, ctx.auth?.user?.id)

          for (const [header, value] of Object.entries(headers)) {
            ctx.set.headers[header.toLowerCase()] = value
          }
        } catch (error) {
          if (error instanceof HttpError) {
            throw error
          }
          throw HttpError.TooManyRequests('Too Many Requests')
        }
      })
    },
  }))
  .as('plugin')

export const applyRateLimit = (options: RateLimitOptions = defaultOptions) => {
  return new Elysia() //.use(rateLimit).guard({ applyRateLimit: options }).as('plugin')
}
