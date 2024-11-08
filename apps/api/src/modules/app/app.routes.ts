import { envApi } from '@bulkit/api/envApi'
import { PLATFORMS, type Platform } from '@bulkit/shared/constants/db.constants'
import { DEPLOYMENT_TYPES } from '@bulkit/shared/modules/app/app-constants'
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
  // .use(protectedMiddleware)
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
        deploymentType: envApi.DEPLOYMENT_TYPE,
      }
    },
    {
      response: {
        200: t.Object({
          platforms: t.Record(StringLiteralEnum(PLATFORMS), t.Boolean()),
          deploymentType: StringLiteralEnum(DEPLOYMENT_TYPES),
        }),
      },
    }
  )
