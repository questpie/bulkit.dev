import { PaginationSchema } from '@bulkit/api/common/common.schemas'
import { HttpErrorSchema } from '@bulkit/api/common/http-error-handler'
import { coalesce, selectRelatedEntitiesM2M } from '@bulkit/api/db/db-utils'
import {
  channelsTable,
  postMetricsHistoryTable,
  postsTable,
  scheduledPostsTable,
} from '@bulkit/api/db/db.schema'
import { injectChannelService } from '@bulkit/api/modules/channels/services/channels.service'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import { PostCantBeDeletedException } from '@bulkit/api/modules/posts/exceptions/post-cant-be-deleted.exception'
import { injectPublishPostJob } from '@bulkit/api/modules/posts/jobs/publish-post.job'
import { postMetricsRoutes } from '@bulkit/api/modules/posts/post-metrics.routes'
import { scheduledPostsRoutes } from '@bulkit/api/modules/posts/scheduled-post.routes'
import { injectPostService } from '@bulkit/api/modules/posts/services/posts.service'
import { POST_STATUS, POST_TYPE } from '@bulkit/shared/constants/db.constants'
import { ORDER_TYPE } from '@bulkit/shared/constants/misc.constants'
import {
  POST_SORTABLE_FIELDS,
  type PostSortableField,
} from '@bulkit/shared/modules/posts/posts.constants'
import {
  PostChannelSchema,
  PostDetailsSchema,
  PostListItemSchema,
  PostSchema,
  PostValidationResultSchema,
} from '@bulkit/shared/modules/posts/posts.schemas'
import {
  MaybeArraySchema,
  PaginatedResponseSchema,
  StringLiteralEnum,
} from '@bulkit/shared/schemas/misc'
import { appLogger } from '@bulkit/shared/utils/logger'
import { unwrapMaybeArray } from '@bulkit/shared/utils/misc'
import { and, asc, desc, eq, inArray, isNull, sql, type SQLWrapper } from 'drizzle-orm'
import Elysia, { t } from 'elysia'
import { HttpError } from 'elysia-http-error'

export const postsRoutes = new Elysia({ prefix: '/posts', detail: { tags: ['Posts'] } })
  .use(scheduledPostsRoutes)
  .use(postMetricsRoutes)
  .use(injectPostService)
  .use(injectChannelService)
  .use(organizationMiddleware)
  .use(injectPublishPostJob)
  .get(
    '/',
    async (ctx) => {
      const { limit, cursor } = ctx.query

      const querySort = unwrapMaybeArray(
        ctx.query.sort ?? [
          {
            by: 'createdAt',
            order: 'desc',
          },
        ]
      )

      const posts = await ctx.db
        .select({
          id: postsTable.id,
          name: postsTable.name,
          status: postsTable.status,
          type: postsTable.type,
          createdAt: postsTable.createdAt,
          scheduledAt: postsTable.scheduledAt,
          channels: selectRelatedEntitiesM2M({
            select: {
              id: channelsTable.id,
              name: channelsTable.name,
              platform: channelsTable.platform,
              imageUrl: channelsTable.imageUrl,
            },
            joinOn: eq(scheduledPostsTable.channelId, channelsTable.id),
            joinTable: scheduledPostsTable,
            table: channelsTable,
            where: eq(scheduledPostsTable.postId, postsTable.id),
          }),

          totalLikes: coalesce(
            sql<number>`cast(sum(${postMetricsHistoryTable.likes}) as int)`,
            sql<number>`0`
          ),
          totalImpressions: coalesce(
            sql<number>`cast(sum(${postMetricsHistoryTable.impressions}) as int)`,
            sql<number>`0`
          ),
          totalComments: coalesce(
            sql<number>`cast(sum(${postMetricsHistoryTable.comments}) as int)`,
            sql<number>`0`
          ),
          totalShares: coalesce(
            sql<number>`cast(sum(${postMetricsHistoryTable.shares}) as int)`,
            sql<number>`0`
          ),
        })
        .from(postsTable)
        .where(
          and(
            eq(postsTable.organizationId, ctx.organization!.id),
            isNull(postsTable.archivedAt),
            ctx.query.type ? inArray(postsTable.type, unwrapMaybeArray(ctx.query.type)) : undefined,
            ctx.query.status
              ? inArray(postsTable.status, unwrapMaybeArray(ctx.query.status))
              : undefined,
            ctx.query.channelId
              ? inArray(scheduledPostsTable.channelId, unwrapMaybeArray(ctx.query.channelId))
              : undefined
          )
        )
        .leftJoin(scheduledPostsTable, eq(scheduledPostsTable.postId, postsTable.id))
        .leftJoin(
          postMetricsHistoryTable,
          eq(scheduledPostsTable.id, postMetricsHistoryTable.scheduledPostId)
        )
        .orderBy(
          ...querySort.map((q) => {
            const sortBy = POST_SORTABLE_COLUMNS[q.by ?? 'createdAt']
            const orderFn = q.order === 'asc' ? asc : desc

            return orderFn(sortBy)
          })
        )
        .groupBy(postsTable.id)
        .limit(limit + 1)
        .offset(cursor)

      const hasNextPage = posts.length > limit
      const results = posts.slice(0, limit)

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
          type: t.Optional(MaybeArraySchema(StringLiteralEnum(POST_TYPE))),
          status: t.Optional(MaybeArraySchema(StringLiteralEnum(POST_STATUS))),
          channelId: t.Optional(MaybeArraySchema(t.String())),

          dateFrom: t.Optional(t.String()),
          dateTo: t.Optional(t.String()),

          sort: t.Optional(
            MaybeArraySchema(
              t.Object({
                order: t.Optional(StringLiteralEnum(ORDER_TYPE, { default: 'desc' })),
                by: StringLiteralEnum(POST_SORTABLE_FIELDS, { default: 'createdAt' }),
              })
            )
          ),
        }),
      ]),
      response: { 200: PaginatedResponseSchema(PostListItemSchema) },
    }
  )
  .get(
    '/:id',
    async (ctx) => {
      const post = await ctx.postService.getById(ctx.db, {
        orgId: ctx.organization!.id,
        postId: ctx.params.id,
      })

      if (!post) {
        throw HttpError.NotFound('Post not found')
      }

      return post
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        404: HttpErrorSchema(),
        200: PostSchema,
      },
    }
  )
  .post(
    '/',
    async (ctx) => {
      return ctx.db.transaction(async (trx) => {
        const post = await ctx.postService.create(trx, {
          orgId: ctx.organization!.id,
          type: ctx.body.type,
        })

        return post
      })
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        type: StringLiteralEnum(POST_TYPE),
      }),
      response: PostSchema,
    }
  )
  .put(
    '/',
    async (ctx) => {
      return ctx.db.transaction(async (trx) => {
        const post = await ctx.postService.update(trx, {
          orgId: ctx.organization!.id,
          post: ctx.body,
        })

        if (!post) {
          throw HttpError.NotFound('Post not found')
        }

        const errors = await ctx.postService.validate(post)

        if (errors) {
          throw HttpError.BadRequest('Validation failed', { errors, post })
        }

        return post
      })
    },
    {
      body: PostSchema,
      response: {
        400: HttpErrorSchema(t.Object({ errors: PostValidationResultSchema, post: PostSchema })),
        404: HttpErrorSchema(),
        200: PostSchema,
      },
    }
  )
  .patch(
    '/:id/publish',
    async (ctx) => {
      return ctx.postService.publish(ctx.db, {
        orgId: ctx.organization!.id,
        postId: ctx.params.id,
      })
    },
    {
      response: {
        400: HttpErrorSchema(t.Object({ errors: t.Optional(PostValidationResultSchema) })),
        404: HttpErrorSchema(),
        200: t.Composite([
          PostSchema,
          t.Object({
            scheduledPosts: t.Array(t.Object({ scheduledPostId: t.String(), delay: t.Number() })),
          }),
        ]),
      },
    }
  )
  .post('/:id/duplicate', async (ctx) => {
    return await ctx.db.transaction(async (trx) => {
      const post = await ctx.postService.getById(trx, {
        orgId: ctx.organization!.id,
        postId: ctx.params.id,
      })

      if (!post) {
        throw HttpError.NotFound('Post not found')
      }

      const newPost = await ctx.postService.create(trx, {
        orgId: ctx.organization!.id,
        type: post.type,
        name: `Duplicate of ${post.name}`,
      })

      return ctx.postService.update(trx, {
        orgId: ctx.organization!.id,
        post: {
          ...post,
          id: newPost.id,
        },
      })
    })
  })
  .delete(
    '/:id',
    async (ctx) => {
      try {
        const deleted = await ctx.postService.deleteById(ctx.db, {
          orgId: ctx.organization!.id,
          postId: ctx.params.id,
        })

        if (!deleted) {
          throw HttpError.NotFound('Post not found')
        }

        // remove jobs of scheduled posts
        for (const channel of deleted.channels) {
          if (channel.scheduledPost?.status === 'scheduled') {
            /**
             * This will throw if scheduled job is not in queue, but we should not fail the request because of it
             */
            await ctx.jobPublishPost.remove(channel.scheduledPost.id).catch(() => null)
          }
        }

        return { success: true }
      } catch (err) {
        if (err instanceof PostCantBeDeletedException) {
          throw HttpError.BadRequest(err.message)
        }

        appLogger.error(err)
        throw HttpError.Internal('Error while deleting post')
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: t.Object({ success: t.Boolean() }),
        404: HttpErrorSchema(),
        500: HttpErrorSchema(),
        400: HttpErrorSchema(),
      },
    }
  )
  .patch(
    '/:id/archive',
    async (ctx) => {
      const archived = await ctx.postService.archiveById(ctx.db, {
        orgId: ctx.organization!.id,
        postId: ctx.params.id,
      })

      if (!archived) {
        throw HttpError.NotFound('Post not found')
      }

      return { success: true }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: t.Object({ success: t.Boolean() }),
        404: HttpErrorSchema(),
      },
    }
  )
  .patch(
    '/:id/return-to-draft',
    async (ctx) => {
      const post = await ctx.postService.returnToDraft(ctx.db, {
        orgId: ctx.organization!.id,
        postId: ctx.params.id,
      })

      if (!post) {
        throw HttpError.NotFound('Post not found')
      }

      return post
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: PostSchema,
        404: HttpErrorSchema(),
      },
    }
  )
  .patch(
    '/:id/rename',
    async (ctx) => {
      const post = await ctx.postService.rename(ctx.db, {
        orgId: ctx.organization!.id,
        postId: ctx.params.id,
        name: ctx.body.name,
      })

      if (!post) {
        throw HttpError.NotFound('Post not found')
      }

      return post
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.String(),
      }),
      response: {
        200: PostSchema,
        404: HttpErrorSchema(),
      },
    }
  )

const POST_SORTABLE_COLUMNS: Record<PostSortableField, SQLWrapper> = {
  likes: coalesce(sql<number>`cast(sum(${postMetricsHistoryTable.likes}) as int)`, sql<number>`0`),
  impressions: coalesce(
    sql<number>`cast(sum(${postMetricsHistoryTable.impressions}) as int)`,
    sql<number>`0`
  ),
  comments: coalesce(
    sql<number>`cast(sum(${postMetricsHistoryTable.comments}) as int)`,
    sql<number>`0`
  ),
  shares: coalesce(
    sql<number>`cast(sum(${postMetricsHistoryTable.shares}) as int)`,
    sql<number>`0`
  ),
  createdAt: postsTable.createdAt,
  name: postsTable.name,
  scheduledAt: postsTable.scheduledAt,
}
