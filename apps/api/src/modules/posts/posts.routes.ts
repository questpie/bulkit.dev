import { PaginationSchema } from '@bulkit/api/common/common.schemas'
import { db } from '@bulkit/api/db/db.client'
import { postDetailsTable, postsTable } from '@bulkit/api/db/db.schema'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import { createPost, getPost, updatePost } from '@bulkit/api/modules/posts/dal/posts.dal'
import { POST_STATUS, POST_TYPE } from '@bulkit/shared/constants/db.constants'
import { PostDetailsSchema, PostSchema } from '@bulkit/shared/modules/posts/posts.schemas'
import { StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import { appLogger } from '@bulkit/shared/utils/logger'
import { and, desc, eq } from 'drizzle-orm'
import Elysia, { t } from 'elysia'

export const postsRoutes = new Elysia({ prefix: '/posts', detail: { tags: ['Posts'] } })
  .use(organizationMiddleware)
  .get(
    '/',
    async (ctx) => {
      const { limit, cursor } = ctx.query

      const posts = await db
        .select({
          id: postsTable.id,
          name: postDetailsTable.name,
          status: postDetailsTable.status,
          currentVersion: postsTable.currentVersion,
          type: postsTable.type,
          createdAt: postsTable.createdAt,
        })
        .from(postsTable)
        .innerJoin(postDetailsTable, eq(postsTable.id, postDetailsTable.postId))
        .where(
          and(
            eq(postsTable.organizationId, ctx.organization!.id),
            eq(postDetailsTable.version, postsTable.currentVersion),
            ctx.query.type ? eq(postsTable.type, ctx.query.type) : undefined,
            ctx.query.status ? eq(postDetailsTable.status, ctx.query.status) : undefined
          )
        )
        .orderBy(desc(postsTable.createdAt))
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
        }),
      ]),
      response: t.Object({
        data: t.Array(PostDetailsSchema),
        nextCursor: t.Nullable(t.Number()),
      }),
    }
  )
  .post(
    '/',
    async (ctx) => {
      return db.transaction(async (trx) => {
        const post = await createPost(trx, {
          orgId: ctx.organization!.id,
          type: ctx.body.type,
          userId: ctx.auth.user.id,
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
  .get(
    '/:id',
    async (ctx) => {
      const post = await getPost(db, {
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
  .put(
    '/',
    async (ctx) => {
      return db.transaction(async (trx) => {
        const post = await updatePost(trx, {
          orgId: ctx.organization!.id,
          post: ctx.body,
          userId: ctx.auth.user.id,
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
        404: t.Object({ message: t.String() }),
        200: PostSchema,
      },
    }
  )
