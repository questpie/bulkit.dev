import { PaginationSchema } from '@bulkit/api/common/common.schemas'
import { HttpErrorSchema } from '@bulkit/api/common/http-error-handler'
import { injectDatabase } from '@bulkit/api/db/db.client'
import { channelsTable, scheduledPostsTable, selectChannelSchema } from '@bulkit/api/db/db.schema'
import { channelAuthRoutes } from '@bulkit/api/modules/channels/channel-auth.routes'
import { ChannelCantBeDeletedException } from '@bulkit/api/modules/channels/exceptions/channel-cant-be-deleted.exception'
import { injectChannelService } from '@bulkit/api/modules/channels/services/channels.service'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import { PLATFORMS, POST_TYPE } from '@bulkit/shared/constants/db.constants'
import { getAllowedPlatformsFromPostType } from '@bulkit/shared/modules/admin/utils/platform-settings.utils'
import { PaginatedResponseSchema, StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import { and, desc, eq, getTableColumns, ilike, inArray, sql } from 'drizzle-orm'
import Elysia, { t } from 'elysia'
import { HttpError } from 'elysia-http-error'
import { ChannelListItemSchema } from '@bulkit/shared/modules/channels/channels.schemas'

export const channelRoutes = new Elysia({ prefix: '/channels' })
  .use(channelAuthRoutes)
  .use(organizationMiddleware)
  .use(injectDatabase)
  .use(injectChannelService)
  .get(
    '/',
    async (ctx) => {
      const { limit = 10, cursor, platform, q, isActive } = ctx.query

      const platforms = ctx.query.postType
        ? getAllowedPlatformsFromPostType(ctx.query.postType)
        : undefined

      const channels = await ctx.db
        .select({
          ...getTableColumns(channelsTable),
          postsCount: sql<string>`COUNT(${scheduledPostsTable.id})`,
          publishedPostsCount: sql<string>`COUNT(CASE WHEN ${scheduledPostsTable.publishedAt} IS NOT NULL THEN 1 ELSE NULL END)`,
          scheduledPostsCount: sql<string>`COUNT(CASE WHEN ${scheduledPostsTable.publishedAt} IS NULL AND ${scheduledPostsTable.scheduledAt} IS NOT NULL THEN 1 ELSE NULL END)`,
        })
        .from(channelsTable)
        .where(
          and(
            eq(channelsTable.organizationId, ctx.organization!.id),
            platform ? eq(channelsTable.platform, platform) : undefined,
            isActive !== undefined
              ? eq(channelsTable.status, isActive ? 'active' : 'inactive')
              : undefined,
            q ? ilike(channelsTable.name, `${q}%`) : undefined,
            platforms ? inArray(channelsTable.platform, platforms) : undefined
          )
        )
        .orderBy(desc(channelsTable.name))
        .leftJoin(scheduledPostsTable, eq(scheduledPostsTable.channelId, channelsTable.id))
        .groupBy(channelsTable.id)
        .limit(limit + 1)
        .offset(cursor)

      const hasNextPage = channels.length > limit
      const results = channels.slice(0, limit)

      const nextCursor = hasNextPage ? cursor + limit : null

      return {
        data: results.map((r) => ({
          ...r,
          postsCount: Number(r.postsCount),
          publishedPostsCount: Number(r.publishedPostsCount),
          scheduledPostsCount: Number(r.scheduledPostsCount),
        })),
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
          postType: t.Optional(StringLiteralEnum(POST_TYPE)),
        }),
      ]),
      response: {
        200: PaginatedResponseSchema(ChannelListItemSchema),
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
        throw HttpError.NotFound('Channel not found')
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
        404: HttpErrorSchema(),
      },
    }
  )
  .delete(
    '/:id',
    async (ctx) => {
      const { id } = ctx.params

      try {
        const channel = await ctx.channelsService.deleteById(ctx.db, {
          id: id,
          organizationId: ctx.organization!.id,
        })

        if (channel) {
          throw HttpError.NotFound('Channel not found')
        }

        return { message: 'Channel deleted successfully' }
      } catch (err) {
        if (err instanceof ChannelCantBeDeletedException) {
          throw HttpError.BadRequest(err.message)
        }

        throw HttpError.Internal()
      }
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
        404: HttpErrorSchema(),
        400: HttpErrorSchema(),
        500: HttpErrorSchema(),
      },
    }
  )
  .patch(
    '/:id/archive',
    async (ctx) => {
      const { id } = ctx.params

      const channel = await ctx.channelsService.archiveById(ctx.db, {
        id,
        organizationId: ctx.organization!.id,
      })

      if (!channel) {
        throw HttpError.NotFound('Channel not found')
      }

      return { message: 'Channel archived successfully' }
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
        404: HttpErrorSchema(),
        500: HttpErrorSchema(),
      },
    }
  )
