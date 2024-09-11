import { type Platform, PLATFORM_TO_NAME } from '@bulkit/api/db/db.constants'
import { protectedMiddleware } from '@bulkit/api/modules/auth/auth.middleware'
import { FacebookChannelManager } from '@bulkit/api/modules/channels/providers/fb/fb-channel.manager'
import { InstagramChannelManager } from '@bulkit/api/modules/channels/providers/instagram/instagram-channel.manager'
import { LinkedInChannelManager } from '@bulkit/api/modules/channels/providers/linkedin/linkedin-channel.manager'
import { TikTokChannelManager } from '@bulkit/api/modules/channels/providers/tiktok/tiktok-channel.manager'
import { XChannelManager } from '@bulkit/api/modules/channels/providers/x/x-channel.manager'
import { YouTubeChannelManager } from '@bulkit/api/modules/channels/providers/youtube/youtube-channel.manager'
import Elysia, { t } from 'elysia'

export function getChannelManager<TPlatform extends Platform>(platform: TPlatform) {
  switch (platform) {
    case 'instagram':
      return new InstagramChannelManager()
    case 'facebook':
      return new FacebookChannelManager()
    case 'tiktok':
      return new TikTokChannelManager()
    case 'youtube':
      return new YouTubeChannelManager()
    case 'x':
      return new XChannelManager()
    case 'linkedin':
      return new LinkedInChannelManager()
    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}

export function createChannelRoutes<const TPlatform extends Platform>(platform: TPlatform) {
  return new Elysia({
    prefix: `/${platform}`,
    detail: { tags: [PLATFORM_TO_NAME[platform]] },
  })
    .derive({ as: 'scoped' }, () => ({ channelManager: getChannelManager(platform) }))
    .get(
      '/auth',
      async ({ query, channelManager }) => {
        const { name, organizationId } = query
        const authUrl = await channelManager.getAuthorizationUrl(organizationId)
        return { authUrl }
      },
      {
        detail: {
          description: `OAuth2 Authorization for ${PLATFORM_TO_NAME[platform]}`,
        },
        query: t.Object({
          name: t.String({ minLength: 1 }),
          organizationId: t.String({ minLength: 1 }),
        }),
      }
    )
    .get(
      '/callback',
      async ({ query, channelManager }) => {
        const { code, state } = query
        const { organizationId } = JSON.parse(Buffer.from(state, 'base64').toString())
        const { channel } = await channelManager.handleCallback(code, organizationId)
        return { channel }
      },
      {
        detail: {
          description: `OAuth2 Callback for ${PLATFORM_TO_NAME[platform]}`,
        },
        query: t.Object({
          code: t.String({ minLength: 1 }),
          state: t.String({ minLength: 1 }),
        }),
      }
    )
}

export const channelRoutes = new Elysia({ prefix: '/channels' })
  .use(protectedMiddleware)
  .use(createChannelRoutes('youtube'))
  .use(createChannelRoutes('instagram'))
  .use(createChannelRoutes('facebook'))
  .use(createChannelRoutes('tiktok'))
  .use(createChannelRoutes('youtube'))
  .use(createChannelRoutes('x'))
  .use(createChannelRoutes('linkedin'))
