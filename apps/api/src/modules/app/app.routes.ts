import { envApi } from '@bulkit/api/envApi'
import { protectedMiddleware } from '@bulkit/api/modules/auth/auth.middleware'
import { injectStockImageService } from '@bulkit/api/modules/resources/stock-image/stock-image.service'
import { PLATFORMS, type Platform } from '@bulkit/shared/constants/db.constants'
import { StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import Elysia, { t } from 'elysia'

export const appRoutes = new Elysia({
  prefix: '/app',
  detail: {
    tags: ['App'],
  },
})
  .get('/healthy', () => 'ok', {
    detail: { description: 'Health check' },
  })
  .use(protectedMiddleware)
  .use(injectStockImageService)
  .get(
    '/settings',
    async (ctx) => {
      const platforms: Record<Platform, boolean> = {
        facebook: envApi.FACEBOOK_ENABLED,
        tiktok: envApi.TIKTOK_ENABLED,
        linkedin: envApi.LINKEDIN_ENABLED,
        instagram: envApi.INSTAGRAM_ENABLED,
        youtube: envApi.GOOGLE_ENABLED,
        x: envApi.X_ENABLED,
      }

      return {
        platforms,
        stockImageProviders: ctx.stockImageService.getAvailableProviders(),
      }
    },
    {
      response: {
        200: t.Object({
          platforms: t.Record(StringLiteralEnum(PLATFORMS), t.Boolean()),
        }),
      },
    }
  )
