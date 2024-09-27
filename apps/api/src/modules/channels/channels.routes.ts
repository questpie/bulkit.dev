import { PaginationSchema } from '@bulkit/api/common/common.schemas'
import { injectDatabase } from '@bulkit/api/db/db.client'
import { channelsTable, selectChannelSchema } from '@bulkit/api/db/db.schema'
import { channelAuthRotes } from '@bulkit/api/modules/channels/channel-auth.routes'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import { PLATFORMS } from '@bulkit/shared/constants/db.constants'
import { StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import { and, desc, eq, ilike } from 'drizzle-orm'
import Elysia, { t } from 'elysia'

export const channelRoutes = new Elysia({ prefix: '/channels' })
  .use(channelAuthRotes)
  .use(injectDatabase)
  .use(organizationMiddleware)
  .get(
    '/',
    async (ctx) => {
      const { limit = 10, cursor, platform, q } = ctx.query

      const channels = await ctx.db
        .select()
        .from(channelsTable)
        .where(
          and(
            eq(channelsTable.organizationId, ctx.organization!.id),
            platform ? eq(channelsTable.platform, platform) : undefined,
            q ? ilike(channelsTable.name, `${q}%`) : undefined
          )
        )
        .orderBy(desc(channelsTable.id))
        .limit(limit + 1)
        .offset(cursor)

      const hasNextPage = channels.length > limit
      const results = channels.slice(0, limit)

      const nextCursor = hasNextPage ? cursor + limit : null

      return {
        data: results,
        nextCursor,
      }
    },
    {
      detail: {
        tags: ['Channels'],
      },
      query: t.Composite([
        PaginationSchema,
        t.Object({
          platform: t.Optional(StringLiteralEnum(PLATFORMS)),
          q: t.Optional(t.String()),
        }),
      ]),
      response: {
        200: t.Object({
          data: t.Array(selectChannelSchema),
          nextCursor: t.Nullable(t.Numeric()),
        }),
      },
    }
  )
  .get(
    '/:id',
    async (ctx) => {
      const { id } = ctx.params

      const channel = await ctx.db.query.channelsTable.findFirst({
        where: and(
          eq(channelsTable.id, id),
          eq(channelsTable.organizationId, ctx.organization!.id)
        ),
      })

      if (!channel) {
        return ctx.error(404, { message: 'Channel not found' })
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
      response: {
        200: selectChannelSchema,
        404: t.Object({
          message: t.String(),
        }),
      },
    }
  )
