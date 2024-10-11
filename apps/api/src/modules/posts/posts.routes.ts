import { PaginationSchema } from '@bulkit/api/common/common.schemas'
import { selectRelatedEntitiesM2M } from '@bulkit/api/db/db-utils'
import { channelsTable, postsTable, scheduledPostsTable } from '@bulkit/api/db/db.schema'
import { injectChannelService } from '@bulkit/api/modules/channels/services/channels.service'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import { publishPostJob } from '@bulkit/api/modules/posts/jobs/publish-post.job'
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
        const errors = await ctx.postService.validate(ctx.body)

        if (errors) {
          return ctx.error(400, errors)
        }

        const post = await ctx.postService.update(trx, {
          orgId: ctx.organization!.id,
          post: ctx.body,
        })

        if (!post) {
          return ctx.error(404, { message: 'Post not found' })
        }

        return post
      })
    },
    {
      body: PostSchema,
      response: {
        400: PostValidationResultSchema,
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
        return ctx.error(400, errors)
      }

      for (const channel of post.channels) {
        if (!channel.scheduledPost) continue
        const scheduledAt = channel.scheduledPost.scheduledAt ?? post.scheduledAt

        let delay = 1000

        if (scheduledAt) {
          delay = Math.max(new Date(scheduledAt).getTime() - new Date().getTime(), 1000)
        }

        await publishPostJob.invoke(
          {
            scheduledPostId: channel.scheduledPost.id,
          },
          {
            jobId: channel.scheduledPost.id,
            delay,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 1000,
            },
          }
        )
      }

      await ctx.db
        .update(postsTable)
        .set({
          status: 'scheduled',
        })
        .where(eq(postsTable.id, post.id))

      return {
        ...post,
        status: 'scheduled',
      }
    },
    {
      response: {
        400: PostValidationResultSchema,
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
