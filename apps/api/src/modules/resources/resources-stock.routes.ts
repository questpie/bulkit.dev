import { HttpErrorSchema } from '@bulkit/api/common/http-error-handler'
import { injectDatabase } from '@bulkit/api/db/db.client'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import { injectResourcesService } from '@bulkit/api/modules/resources/services/resources.service'
import { injectStockImageService } from '@bulkit/api/modules/resources/stock-image/stock-image.service'
import { ResourceSchema } from '@bulkit/shared/modules/resources/resources.schemas'
import { appLogger } from '@bulkit/shared/utils/logger'
import Elysia, { t } from 'elysia'
import { HttpError } from 'elysia-http-error'

export const resourceStockRoutes = new Elysia({ prefix: '/stock' })
  .use(injectDatabase)
  .use(injectResourcesService)
  .use(organizationMiddleware)
  .use(injectStockImageService)
  .get(
    '/search',
    async (ctx) => {
      const { query, provider = 'pixabay', per_page = 30 } = ctx.query
      return ctx.stockImageService.search(provider, query, per_page)
    },
    {
      query: t.Object({
        query: t.String({ minLength: 1 }),
        provider: t.Optional(t.String()),
        per_page: t.Optional(t.Number()),
      }),
      response: {
        200: t.Array(
          t.Object({
            id: t.String(),
            url: t.String(),
            thumbnailUrl: t.String(),
            alt: t.String(),
            author: t.String(),
          })
        ),
        500: HttpErrorSchema(),
      },
    }
  )
  .post(
    '/save',
    async (ctx) => {
      return ctx.db.transaction(async (trx) => {
        return ctx.resourcesService.createFromUrl(trx, {
          organizationId: ctx.organization!.id,
          url: ctx.body.url,
          caption: ctx.body.caption,
          isPrivate: true,
        })
      })
    },
    {
      body: t.Object({
        url: t.String({ format: 'uri' }),
        caption: t.String(),
      }),
      response: {
        200: ResourceSchema,
        500: HttpErrorSchema(),
      },
    }
  )
