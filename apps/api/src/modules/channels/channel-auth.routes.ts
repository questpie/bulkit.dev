import { databasePlugin } from '@bulkit/api/db/db.client'
import { getChannelManager } from '@bulkit/api/modules/channels/channel-utils'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import { PLATFORMS } from '@bulkit/shared/constants/db.constants'
import { StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import Elysia, { t } from 'elysia'

export const channelAuthRotes = new Elysia({ prefix: '/auth/:platform' })
  .use(databasePlugin())
  .guard({
    params: t.Object({
      platform: StringLiteralEnum(PLATFORMS),
    }),
  })
  .get(
    '/callback',
    async (ctx) => {
      const { platform } = ctx.params
      const channelManager = getChannelManager(platform)
      return channelManager.authenticator.handleAuthCallback(ctx as any)
      // const { code, state } = query

      // const { organizationId, redirectTo } = JSON.parse(Buffer.from(state, 'base64').toString())
      // const { channel } = await channelManager.handleCallback(db, code, organizationId, cookie)

      // if (redirectTo) {
      //   // {{cId}} can also be encoded in the URL so we need to decode it
      //   return ctx.redirect(decodeURI(redirectTo).replace('{{cId}}', channel.id), 302)
      // }

      // return { success: true }
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
      const channelManager = getChannelManager(ctx.params.platform)
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
        redirectTo: t.Optional(
          t.String({
            minLength: 1,
            description:
              'URL to redirect to after authorization. Use {{cId}} to replace with created channel ID.',
          })
        ),
      }),
    }
  )
