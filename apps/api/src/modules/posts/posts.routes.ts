import { PaginationSchema } from '@bulkit/api/common/common.schemas'
import { db } from '@bulkit/api/db/db.client'
import { postsTable } from '@bulkit/api/db/db.schema'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import { createPost } from '@bulkit/api/modules/posts/dal/posts.dal'
import { POST_STATUS, POST_TYPE } from '@bulkit/shared/constants/db.constants'
import { StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import { and, eq } from 'drizzle-orm'
import Elysia, { t } from 'elysia'

export const postsRoutes = new Elysia({ prefix: '/posts', detail: { tags: ['Posts'] } })
  .use(organizationMiddleware)
  .get(
    '/',
    async (ctx) => {
      const { limit, cursor } = ctx.query

      const posts = await db
        .select()
        .from(postsTable)
        .where(and(eq(postsTable.id, ctx.organization!.id)))
        .limit(limit)
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
          type: t.Optional(StringLiteralEnum(POST_TYPE)),
          status: t.Optional(StringLiteralEnum(POST_STATUS)),
        }),
      ]),
    }
  )
  .post(
    '/',
    async (ctx) => {
      return db.transaction(async (trx) => {
        const post = createPost(trx, {
          organizationId: ctx.organization!.id,
          type: ctx.body.type,
          userId: ctx.auth.user.id,
        })
      })
    },
    {
      body: t.Object({
        type: StringLiteralEnum(POST_TYPE),
      }),
    }
  )
// .post(
//   '/:id/',
//   async (ctx) => {
//     const [post] = await db
//       .select()
//       .from(postsTable)
//       .where(eq(postsTable.id, ctx.params.id))
//       .limit(1)

//     for (const platform of ctx.body.platforms) {
//       const channelManagers = getChannelManager(platform)
//       await channelManagers.sendPost(post)
//     }
//   },
//   {
//     body: t.Object({
//       platforms: t.Array(tExt.StringEnum(PLATFORMS)),
//     }),
//   }
// )
