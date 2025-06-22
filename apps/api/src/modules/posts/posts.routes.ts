import { HttpErrorSchema } from '@bulkit/api/common/http-error-handler'
import { applyRateLimit } from '@bulkit/api/common/rate-limit'
import { coalesce } from '@bulkit/api/db/db-utils'
import { injectDatabase } from '@bulkit/api/db/db.client'
import { postMetricsHistoryTable, postsTable } from '@bulkit/api/db/db.schema'
import { bindContainer } from '@bulkit/api/ioc'
import { injectChannelService } from '@bulkit/api/modules/channels/services/channels.service'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import { PostCantBeDeletedException } from '@bulkit/api/modules/posts/exceptions/post-cant-be-deleted.exception'
import { injectPublishPostJob } from '@bulkit/api/modules/posts/jobs/publish-post.job'
import { postMetricsRoutes } from '@bulkit/api/modules/posts/post-metrics.routes'
import { scheduledPostsRoutes } from '@bulkit/api/modules/posts/scheduled-post.routes'
import { injectPostService } from '@bulkit/api/modules/posts/services/posts.service'
import { POST_TYPE } from '@bulkit/shared/constants/db.constants'
import type { PostSortableField } from '@bulkit/shared/modules/posts/posts.constants'
import {
  PostGetAllQuerySchema,
  PostListItemSchema,
  PostSchema,
  PostValidationResultSchema,
} from '@bulkit/shared/modules/posts/posts.schemas'
import {
  PaginatedResponseSchema,
  StringLiteralEnum,
  PaginationQuerySchema,
} from '@bulkit/shared/schemas/misc'
import { appLogger } from '@bulkit/shared/utils/logger'
import { sql, type SQLWrapper } from 'drizzle-orm'
import Elysia, { t } from 'elysia'
import { HttpError } from 'elysia-http-error'

export const postsRoutes = new Elysia({ prefix: '/posts', detail: { tags: ['Posts'] } })
  .use(
    applyRateLimit({
      tiers: {
        authenticated: {
          points: 300, // 300 requests
          duration: 300, // per 5 minutes
          blockDuration: 600, // 10 minute block
        },
      },
    })
  )
  .use(scheduledPostsRoutes)
  .use(postMetricsRoutes)
  .use(
    bindContainer([injectPostService, injectChannelService, injectPublishPostJob, injectDatabase])
  )
  .use(organizationMiddleware)
  .get(
    '/',
    async (ctx) => {
      return ctx.postService.getAll(ctx.db, ctx.organization!.id, {
        limit: ctx.query.limit,
        cursor: ctx.query.cursor,
        type: ctx.query.type,
        status: ctx.query.status,
        channelId: ctx.query.channelId,
        dateFrom: ctx.query.dateFrom,
        dateTo: ctx.query.dateTo,
        sort: ctx.query.sort,
      })
    },
    {
      query: t.Composite([PaginationQuerySchema, PostGetAllQuerySchema]),
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
      const post = await ctx.db.transaction(async (trx) => {
        const post = await ctx.postService.update(trx, {
          orgId: ctx.organization!.id,
          post: ctx.body,
        })

        if (!post) {
          throw HttpError.NotFound('Post not found')
        }

        return post
      })

      const errors = await ctx.postService.validate(post)

      if (errors) {
        throw HttpError.BadRequest('Validation failed', { errors, post })
      }

      return post
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
