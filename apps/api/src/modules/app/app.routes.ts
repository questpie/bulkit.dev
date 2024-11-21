import { injectDatabase } from '@bulkit/api/db/db.client'
import { envApi } from '@bulkit/api/envApi'
import { ioc, iocResolve } from '@bulkit/api/ioc'
import { injectLemonSqueezy } from '@bulkit/api/lemon-squeezy/lemon-squeezy.service'
import { injectAppSettingsService } from '@bulkit/api/modules/auth/admin/services/app-settings.service'
import type { Platform } from '@bulkit/shared/constants/db.constants'
import Elysia from 'elysia'
import { AppSettingsResponseSchema } from '@bulkit/shared/modules/app/app-schemas'

export const appRoutes = new Elysia({
  prefix: '/app',
  detail: {
    tags: ['App'],
  },
})
  .get('/healthy', () => 'ok', {
    detail: { description: 'Health check' },
  })
  // .use(protectedMiddleware)
  .use(injectAppSettingsService)
  .use(injectDatabase)
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

      let currency = 'USD'

      if (envApi.DEPLOYMENT_TYPE === 'cloud') {
        const lemonSqueezy = iocResolve(ioc.use(injectLemonSqueezy)).lemonSqueezy
        currency = await lemonSqueezy
          .getStore()
          .then((s) => s.data?.attributes.currency)
          .catch(() => 'USD')
      }

      console.log(currency)

      return {
        platforms,
        deploymentType: envApi.DEPLOYMENT_TYPE,
        currency,
      }
    },
    {
      response: {
        200: AppSettingsResponseSchema,
      },
    }
  )
