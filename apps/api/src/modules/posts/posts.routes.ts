import { PaginationSchema } from '@bulkit/api/common/common.schemas'
import { HttpErrorSchema } from '@bulkit/api/common/http-error-handler'
import { selectRelatedEntitiesM2M } from '@bulkit/api/db/db-utils'
import { channelsTable, postsTable, scheduledPostsTable } from '@bulkit/api/db/db.schema'
import { injectChannelService } from '@bulkit/api/modules/channels/services/channels.service'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import { PostCantBeDeletedException } from '@bulkit/api/modules/posts/exceptions/post-cant-be-deleted.exception'
import { publishPostJob } from '@bulkit/api/modules/posts/jobs/publish-post.job'
import { postMetricsRoutes } from '@bulkit/api/modules/posts/post-metrics.routes'
import { scheduledPostsRoutes } from '@bulkit/api/modules/posts/scheduled-post.routes'
import { injectPostService } from '@bulkit/api/modules/posts/services/posts.service'
import { POST_STATUS, POST_TYPE } from '@bulkit/shared/constants/db.constants'
import {
  PostChannelSchema,
  PostDetailsSchema,
  PostSchema,
  PostValidationResultSchema,
} from '@bulkit/shared/modules/posts/posts.schemas'
import { StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import { appLogger } from '@bulkit/shared/utils/logger'
import { addSeconds, isBefore, max } from 'date-fns'
import { and, desc, eq, isNull } from 'drizzle-orm'
import Elysia, { t } from 'elysia'
import { HttpError } from 'elysia-http-error'

export const postsRoutes = new Elysia({ prefix: '/posts', detail: { tags: ['Posts'] } })
  .use(scheduledPostsRoutes)
  .use(postMetricsRoutes)
  .use(injectPostService)
  .use(injectChannelService)
  .use(organizationMiddleware)
  .get(
    '/',
    async (ctx) => {
      const { limit, cursor } = ctx.query

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
        })
        .from(postsTable)
        .where(
          and(
            eq(postsTable.organizationId, ctx.organization!.id),
            isNull(postsTable.archivedAt),
            ctx.query.type ? eq(postsTable.type, ctx.query.type) : undefined,
            ctx.query.status ? eq(postsTable.status, ctx.query.status) : undefined,
            ctx.query.channelId ? eq(scheduledPostsTable.channelId, ctx.query.channelId) : undefined
          )
        )
        .orderBy(desc(postsTable.createdAt))
        .leftJoin(scheduledPostsTable, eq(scheduledPostsTable.postId, postsTable.id))
        .groupBy(postsTable.id)
        .limit(limit + 1)
        .offset(cursor)

      appLogger.info({ posts })

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
          type: t.Optional(StringLiteralEnum(POST_TYPE)),
          status: t.Optional(StringLiteralEnum(POST_STATUS)),
          channelId: t.Optional(t.String()),

          dateFrom: t.Optional(t.String()),
          dateTo: t.Optional(t.String()),
        }),
      ]),
      response: t.Object({
        data: t.Array(
          t.Composite([
            t.Omit(PostDetailsSchema, ['channels']),
            t.Object({
              channels: t.Array(t.Pick(PostChannelSchema, ['id', 'name', 'platform', 'imageUrl'])),
            }),
          ])
        ),
        nextCursor: t.Nullable(t.Number()),
      }),
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
      const post = await ctx.postService.getById(ctx.db, {
        orgId: ctx.organization!.id,
        postId: ctx.params.id,
      })

      if (!post) {
        throw HttpError.NotFound('Post not found')
      }

      // validate
      const errors = await ctx.postService.validate(post)
      if (errors) {
        throw HttpError.BadGateway('Post validation failed', { errors })
      }

      const areAllScheduledPostsDraft = post.channels.every(
        (channel) => channel.scheduledPost?.status === 'draft'
      )

      if (post.status !== 'draft' || !areAllScheduledPostsDraft) {
        // TODO: implement the reschedule and unschedule functionality
        throw HttpError.BadGateway(
          "Cannot publish post already scheduled post. Please use the 'reschedule' functionality instead"
        )
      }

      const scheduledPosts = await ctx.db.transaction(async (trx) => {
        const scheduledPosts: { scheduledPostId: string; delay: number }[] = []
        let earliestScheduledAt: Date | null = null

        for (const channel of post.channels) {
          if (!channel.scheduledPost) continue
          // if user didn't schedule the channel manually, use the post's scheduledAt
          const userDefinedScheduledAt = channel.scheduledPost.scheduledAt ?? post.scheduledAt

          // clamp scheduledAt to now if is set before now
          const scheduledAtClamped = userDefinedScheduledAt
            ? max([new Date(userDefinedScheduledAt), addSeconds(new Date(), 1)])
            : new Date()

          // we are keeping track of the earliest scheduledAt to use it as the post's scheduledAt
          if (earliestScheduledAt === null || isBefore(scheduledAtClamped, earliestScheduledAt)) {
            earliestScheduledAt = scheduledAtClamped
          }

          const delay = Math.max(
            new Date(scheduledAtClamped).getTime() - new Date().getTime(),
            1000
          )

          await trx
            .update(scheduledPostsTable)
            .set({
              status: 'scheduled',
              // if the channel had defined a scheduledAt before we just have to make sure we keep the clamped value
              ...(channel.scheduledPost.scheduledAt
                ? { scheduledAt: scheduledAtClamped.toISOString() }
                : {}),
            })
            .where(eq(scheduledPostsTable.id, channel.scheduledPost!.id))

          scheduledPosts.push({ scheduledPostId: channel.scheduledPost!.id, delay })
        }

        await trx
          .update(postsTable)
          .set({
            // if we added another channel to a scheduled post and again published it,
            //  we want to keep existing status
            status: post.status === 'draft' ? 'scheduled' : post.status,
            // by setting this we are making sure, that we are always able to display the scheduled post on timeline
            // even if the user didn't schedule it manually
            // the earliestScheduledAt will never be sooner than 1 second from now
            scheduledAt: post.scheduledAt ?? earliestScheduledAt?.toISOString(),
          })
          .where(eq(postsTable.id, post.id))

        return scheduledPosts
      })

      // we sucessfully published the post, so we can now schedule the jobs
      for (const { scheduledPostId, delay } of scheduledPosts) {
        await publishPostJob.invoke(
          { scheduledPostId },
          {
            jobId: scheduledPostId,
            delay,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 1000,
            },
          }
        )
      }

      return {
        ...post,
        status: 'scheduled',
      }
    },
    {
      response: {
        400: HttpErrorSchema(t.Object({ errors: t.Optional(PostValidationResultSchema) })),
        404: HttpErrorSchema(),
        200: PostSchema,
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
            await publishPostJob.remove(channel.scheduledPost.id).catch(() => null)
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
