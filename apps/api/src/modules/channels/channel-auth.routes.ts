import { injectDatabase } from '@bulkit/api/db/db.client'
import { bindContainer } from '@bulkit/api/ioc'
import { resolveChannelManager } from '@bulkit/api/modules/channels/channel-utils'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import { PLATFORMS } from '@bulkit/shared/constants/db.constants'
import { StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import Elysia, { t } from 'elysia'

export const channelAuthRoutes = new Elysia({ prefix: '/auth/:platform' })
  .use(bindContainer([injectDatabase]))
  .guard({
    params: t.Object({
      platform: StringLiteralEnum(PLATFORMS),
    }),
  })
  .get(
    '/callback',
    async (ctx) => {
      const { platform } = ctx.params
      const channelManager = resolveChannelManager(platform)
      return channelManager.authenticator.handleAuthCallback(ctx as any)
    },
    {
      hasRole: false,
      isSignedIn: false,
      detail: {
        description: 'Auth Callback for channel platform',
      },
    }
  )
  .use(organizationMiddleware)
  .get(
    '/',
    async (ctx) => {
      const channelManager = resolveChannelManager(ctx.params.platform)
      const authUrl = await channelManager.authenticator.handleAuthRequest(ctx as any)
      return { authUrl }
    },
    {
      detail: {
        description: 'Authorization handler for channel platform',
      },
      response: {
        200: t.Object({
          authUrl: t.String(),
        }),
      },
      query: t.Object({
        redirectToOnSuccess: t.Optional(
          t.String({
            minLength: 1,
            description:
              'URL to redirect to after authorization. Use {{cId}} to replace with created channel ID.',
          })
        ),
        redirectToOnDeny: t.Optional(
          t.String({
            minLength: 1,
            description: 'URL to redirect to after authorization is denied.',
          })
        ),
      }),
    }
  )
