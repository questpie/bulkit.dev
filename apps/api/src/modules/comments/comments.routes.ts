import { HttpErrorSchema } from '@bulkit/api/common/http-error-handler'
import { injectDatabase } from '@bulkit/api/db/db.client'
import { protectedMiddleware } from '@bulkit/api/modules/auth/auth.middleware'
import { injectCommentsService } from '@bulkit/api/modules/comments/services/comments.service'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import { StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import Elysia, { t } from 'elysia'

export const commentsRoutes = new Elysia({
  prefix: '/comments',
  detail: { tags: ['Comments'] },
})
  .use(organizationMiddleware)
  .use(protectedMiddleware)
  .use(injectCommentsService)
  .use(injectDatabase)
  .get(
    '/:postId',
    async (ctx) => {
      return ctx.commentsService.getPostComments(ctx.db, {
        postId: ctx.params.postId,
        organizationId: ctx.organization.id,
        timestamp: ctx.query.timestamp,
        limit: ctx.query.limit ?? 10,
        order: ctx.query.order ?? 'desc',
      })
    },
    {
      params: t.Object({
        postId: t.String(),
      }),
      query: t.Object({
        limit: t.Optional(t.Number({ default: 10 })),
        timestamp: t.Number({
          description: 'The timestamp to start the query from, defaults to now',
        }),
        order: t.Optional(
          StringLiteralEnum(['asc', 'desc'], {
            default: 'desc',
            description:
              'The order to sort the comments by. Desc: most recent first, Asc: oldest first',
          })
        ),
      }),
      response: {
        200: t.Array(t.Any()),
        400: HttpErrorSchema(),
      },
    }
  )
  .post(
    '/:postId',
    async (ctx) => {
      return ctx.commentsService.create(ctx.db, {
        postId: ctx.params.postId,
        userId: ctx.auth.user.id,
        organizationId: ctx.organization.id,
        content: ctx.body.content,
      })
    },
    {
      params: t.Object({
        postId: t.String(),
      }),
      body: t.Object({
        content: t.String(),
      }),
      response: {
        200: t.Any(),
        400: HttpErrorSchema(),
      },
    }
  )
