import { PaginationSchema } from '@bulkit/api/common/common.schemas'
import { injectDatabase } from '@bulkit/api/db/db.client'
import { channelsTable, selectChannelSchema } from '@bulkit/api/db/db.schema'
import { iocRegister } from '@bulkit/api/ioc'
import { channelAuthRoutes } from '@bulkit/api/modules/channels/channel-auth.routes'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import { PLATFORMS } from '@bulkit/shared/constants/db.constants'
import { StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import { treaty } from '@elysiajs/eden'
import { and, desc, eq, ilike } from 'drizzle-orm'
import Elysia, { t } from 'elysia'

export const channelRoutes = new Elysia({ prefix: '/channels' })
  .use(channelAuthRoutes)
  .use(injectDatabase)
  .use(organizationMiddleware)
  .get(
    '/',
    async (ctx) => {
      const { limit = 10, cursor, platform, q, isActive } = ctx.query

      const channels = await ctx.db
        .select()
        .from(channelsTable)
        .where(
          and(
            eq(channelsTable.organizationId, ctx.organization!.id),
            platform ? eq(channelsTable.platform, platform) : undefined,
            isActive !== undefined
              ? eq(channelsTable.status, isActive ? 'active' : 'inactive')
              : undefined,
            q ? ilike(channelsTable.name, `${q}%`) : undefined
          )
        )
        .orderBy(desc(channelsTable.name))
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
          isActive: t.Optional(t.BooleanString()),
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
  .delete(
    '/:id',
    async (ctx) => {
      const { id } = ctx.params

      const result = await ctx.db
        .delete(channelsTable)
        .where(
          and(eq(channelsTable.id, id), eq(channelsTable.organizationId, ctx.organization!.id))
        )
        .returning()

      if (result.length === 0) {
        return ctx.error(404, { message: 'Channel not found' })
      }

      return { message: 'Channel deleted successfully' }
    },
    {
      detail: {
        tags: ['Channels'],
      },
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: t.Object({
          message: t.String(),
        }),
        404: t.Object({
          message: t.String(),
        }),
      },
    }
  )
