import { PaginationSchema } from '@bulkit/api/common/common.schemas'
import { selectRelatedEntitiesM2M } from '@bulkit/api/db/db-utils'
import { channelsTable, postsTable, scheduledPostsTable } from '@bulkit/api/db/db.schema'
import { injectChannelService } from '@bulkit/api/modules/channels/services/channels.service'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import { PostCantBeDeletedException } from '@bulkit/api/modules/posts/exceptions/post-cant-be-deleted.exception'
import { publishPostJob } from '@bulkit/api/modules/posts/jobs/publish-post.job'
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
import { and, desc, eq, isNull } from 'drizzle-orm'
import Elysia, { t } from 'elysia'

export const postsRoutes = new Elysia({ prefix: '/posts', detail: { tags: ['Posts'] } })
  .use(scheduledPostsRoutes)
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
        return ctx.error(404, { message: 'Post not found' })
      }

      return post
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        404: t.Object({ message: t.String() }),
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
          return ctx.error(404, { message: 'Post not found' })
        }

        const errors = await ctx.postService.validate(post)

        if (errors) {
          return ctx.error(400, { errors, post })
        }

        return post
      })
    },
    {
      body: PostSchema,
      response: {
        400: t.Object({ errors: PostValidationResultSchema, post: PostSchema }),
        404: t.Object({ message: t.String() }),
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
        return ctx.error(404, { message: 'Post not found' })
      }

      // validate
      const errors = await ctx.postService.validate(post)
      if (errors) {
        return ctx.error(400, { errors, message: 'Post validation failed' })
      }

      const areAllScheduledPostsDraft = post.channels.every(
        (channel) => channel.scheduledPost?.status === 'draft'
      )

      if (post.status !== 'draft' || !areAllScheduledPostsDraft) {
        // TODO: implement the reschedule and unschedule functionality
        return ctx.error(400, {
          message:
            "Cannot publish post already scheduled post. Please use the 'reschedule' functionality instead",
        })
      }

      await ctx.db.transaction(async (trx) => {
        for (const channel of post.channels) {
          if (!channel.scheduledPost) continue
          const scheduledAt = channel.scheduledPost.scheduledAt ?? post.scheduledAt

          let delay = 1000

          if (scheduledAt) {
            delay = Math.max(new Date(scheduledAt).getTime() - new Date().getTime(), 1000)
          }

          await trx.transaction(async (trx) => {
            // mark scheduledPost as status scheduled
            await trx
              .update(scheduledPostsTable)
              .set({
                status: 'scheduled',
              })
              .where(eq(scheduledPostsTable.id, channel.scheduledPost!.id))

            await publishPostJob.invoke(
              {
                scheduledPostId: channel.scheduledPost!.id,
              },
              {
                jobId: channel.scheduledPost!.id,
                delay,
                attempts: 3,
                backoff: {
                  type: 'exponential',
                  delay: 1000,
                },
              }
            )
          })
        }

        await trx
          .update(postsTable)
          .set({
            // if we added another channel to a scheduled post and again published it,
            //  we want to keep existing status
            status: post.status === 'draft' ? 'scheduled' : post.status,
          })
          .where(eq(postsTable.id, post.id))
      })
      return {
        ...post,
        status: 'scheduled',
      }
    },
    {
      response: {
        400: t.Object({ errors: t.Optional(PostValidationResultSchema), message: t.String() }),
        404: t.Object({ message: t.String() }),
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
        return ctx.error(404, { message: 'Post not found' })
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
          return ctx.error(404, { message: 'Post not found' })
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
          return ctx.error(400, { message: err.message })
        }

        appLogger.error(err)
        return ctx.error(500, { message: 'Error while deleting post' })
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        404: t.Object({ message: t.String() }),
        200: t.Object({ success: t.Boolean() }),
        500: t.Object({ message: t.String() }),
        400: t.Object({ message: t.String() }),
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
        return ctx.error(404, { message: 'Post not found' })
      }

      return { success: true }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        404: t.Object({ message: t.String() }),
        200: t.Object({ success: t.Boolean() }),
      },
    }
  )
