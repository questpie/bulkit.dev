import { db } from '@bulkit/api/db/db.client'
import { PLATFORM_TO_NAME, PLATFORMS, type Platform } from '@bulkit/api/db/db.constants'
import { channelsTable } from '@bulkit/api/db/db.schema'
import { FacebookChannelManager } from '@bulkit/api/modules/channels/providers/fb/fb-channel.manager'
import { InstagramChannelManager } from '@bulkit/api/modules/channels/providers/instagram/instagram-channel.manager'
import { LinkedInChannelManager } from '@bulkit/api/modules/channels/providers/linkedin/linkedin-channel.manager'
import { TikTokChannelManager } from '@bulkit/api/modules/channels/providers/tiktok/tiktok-channel.manager'
import { XChannelManager } from '@bulkit/api/modules/channels/providers/x/x-channel.manager'
import { YouTubeChannelManager } from '@bulkit/api/modules/channels/providers/youtube/youtube-channel.manager'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import { StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import { and, desc, eq } from 'drizzle-orm'
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
    .guard((app) =>
      app.use(organizationMiddleware).get(
        '/auth',
        async ({ channelManager, organization, cookie }) => {
          const authUrl = await channelManager.getAuthorizationUrl(organization!.id, cookie)
          return { authUrl: authUrl.toString() }
        },
        {
          detail: {
            description: `OAuth2 Authorization for ${PLATFORM_TO_NAME[platform]}`,
          },
        }
      )
    )
    .get(
      '/callback',
      async ({ query, channelManager, cookie }) => {
        const { code, state } = query
        const { organizationId } = JSON.parse(Buffer.from(state, 'base64').toString())
        const { channel } = await channelManager.handleCallback(code, organizationId, cookie)
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
  .use(createChannelRoutes('youtube'))
  .use(createChannelRoutes('instagram'))
  .use(createChannelRoutes('facebook'))
  .use(createChannelRoutes('tiktok'))
  .use(createChannelRoutes('youtube'))
  .use(createChannelRoutes('x'))
  .use(createChannelRoutes('linkedin'))
  .use(organizationMiddleware)
  .get(
    '/',
    async (ctx) => {
      const { limit = 10, cursor, platform } = ctx.query

      const query = db
        .select()
        .from(channelsTable)
        .where(
          and(
            eq(channelsTable.organizationId, ctx.organization!.id),
            platform ? eq(channelsTable.platform, platform) : undefined,
            platform ? eq(channelsTable.platform, platform) : undefined
          )
        )
        .orderBy(desc(channelsTable.id))
        .limit(limit)
        .offset(cursor)

      const channels = await query

      const hasNextCursor = channels.length > limit
      const nextCursor = hasNextCursor ? cursor + limit : null

      return {
        data: channels,
        nextCursor,
      }
    },
    {
      detail: {
        tags: ['Channels'],
      },
      query: t.Object({
        limit: t.Numeric({
          default: 10,
        }),
        cursor: t.Numeric({
          default: 0,
        }),
        platform: t.Optional(StringLiteralEnum(PLATFORMS)),
      }),
    }
  )
  .get(
    '/:id',
    async (ctx) => {
      const { id } = ctx.params

      const channel = await db.query.channelsTable.findFirst({
        where: and(
          eq(channelsTable.id, id),
          eq(channelsTable.organizationId, ctx.organization!.id)
        ),
      })

      if (!channel) {
        ctx.error(404, 'Channel not found')
      }

      return channel
    },
    {
      detail: {
        tags: ['Channels'],
      },
      params: t.Object({
        id: t.String(),
      }),
    }
  )
