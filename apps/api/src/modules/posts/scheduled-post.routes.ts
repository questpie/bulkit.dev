import { PaginationSchema } from '@bulkit/api/common/common.schemas'
import { coalesce } from '@bulkit/api/db/db-utils'
import { channelsTable, postsTable, scheduledPostsTable } from '@bulkit/api/db/db.schema'
import { injectChannelService } from '@bulkit/api/modules/channels/services/channels.service'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import { injectPostService } from '@bulkit/api/modules/posts/services/posts.service'
import { PLATFORMS, SCHEDULED_POST_STATUS } from '@bulkit/shared/constants/db.constants'
import { ScheduledPostSchema } from '@bulkit/shared/modules/posts/scheduled-posts.schemas'
import { StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import { appLogger } from '@bulkit/shared/utils/logger'
import { and, desc, eq, gte, isNotNull, lte } from 'drizzle-orm'
import Elysia, { t } from 'elysia'

export const scheduledPostsRoutes = new Elysia({
  prefix: '/scheduled-posts',
  detail: { tags: ['Scheduled Posts'] },
})
  .use(injectPostService)
  .use(injectChannelService)
  .use(organizationMiddleware)
  .get(
    '/',
    async (ctx) => {
      const { limit, cursor } = ctx.query

      const scheduledAtField = coalesce<string>(
        scheduledPostsTable.scheduledAt,
        postsTable.scheduledAt
      )

      const scheduledPosts = await ctx.db
        .select({
          id: scheduledPostsTable.id,
          status: scheduledPostsTable.status,
          scheduledAt: scheduledAtField,
          publishedAt: scheduledPostsTable.publishedAt,
          failedAt: scheduledPostsTable.failedAt,
          failureReason: scheduledPostsTable.failureReason,
          startedAt: scheduledPostsTable.startedAt,
          createdAt: scheduledPostsTable.createdAt,
          updatedAt: scheduledPostsTable.updatedAt,
          channel: {
            id: channelsTable.id,
            name: channelsTable.name,
            imageUrl: channelsTable.imageUrl,
            platform: channelsTable.platform,
          },
          post: {
            id: postsTable.id,
            name: postsTable.name,
            status: postsTable.status,
            type: postsTable.type,
          },
        })
        .from(scheduledPostsTable)
        .where(
          and(
            eq(postsTable.organizationId, ctx.organization!.id),
            isNotNull(scheduledAtField),
            ctx.query.platform ? eq(channelsTable.platform, ctx.query.platform) : undefined,
            ctx.query.status ? eq(scheduledPostsTable.status, ctx.query.status) : undefined,
            ctx.query.dateFrom ? gte(scheduledAtField, ctx.query.dateFrom) : undefined,
            ctx.query.dateTo ? lte(scheduledAtField, ctx.query.dateTo) : undefined
          )
        )
        .orderBy(desc(scheduledAtField))
        .innerJoin(postsTable, eq(scheduledPostsTable.postId, postsTable.id))
        .innerJoin(channelsTable, eq(scheduledPostsTable.channelId, channelsTable.id))
        .limit(limit + 1)
        .offset(cursor)

      appLogger.info({ scheduledPosts })

      const hasNextPage = scheduledPosts.length > limit
      const results = scheduledPosts.slice(0, limit)

      const nextCursor = hasNextPage ? cursor + limit : null

      return {
        data: results,
        nextCursor,
      }
    },
    {
      query: t.Composite([
        PaginationSchema,
        t.Object({
          platform: t.Optional(StringLiteralEnum(PLATFORMS)),
          status: t.Optional(StringLiteralEnum(SCHEDULED_POST_STATUS)),
          dateFrom: t.Optional(t.String()),
          dateTo: t.Optional(t.String()),
        }),
      ]),
      response: t.Object({
        data: t.Array(ScheduledPostSchema),
        nextCursor: t.Nullable(t.Number()),
      }),
    }
  )
