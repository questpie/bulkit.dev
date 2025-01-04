import { HttpErrorSchema } from '@bulkit/api/common/http-error-handler'
import { injectDatabase } from '@bulkit/api/db/db.client'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import { injectResourcesService } from '@bulkit/api/modules/resources/services/resources.service'
import { injectStockImageService } from '@bulkit/api/modules/resources/stock-image/stock-image.service'
import { ResourceSchema } from '@bulkit/shared/modules/resources/resources.schemas'
import { Type, type Static } from '@sinclair/typebox'
import Elysia, { t } from 'elysia'

type StockImageSearchResult = {
  id: string
  url: string
  thumbnailUrl: string
  alt: string
  author: string
}

export const resourceStockRoutes = new Elysia({ prefix: '/stock' })
  .use(injectDatabase)
  .use(injectResourcesService)
  .use(organizationMiddleware)
  .use(injectStockImageService)
  .get('/providers', async (ctx) => {
    return ctx.stockImageService.getAvailableProviders(ctx.db)
  })
  .get(
    '/search',
    async (ctx) => {
      const { query, provider = 'pixabay', per_page = 30, page = 1 } = ctx.query
      return ctx.stockImageService.search(ctx.db, provider, query, per_page, page)
    },
    {
      query: t.Object({
        query: t.String({ minLength: 1 }),
        provider: t.Optional(t.String()),
        per_page: t.Optional(t.Number()),
        page: t.Optional(t.Number()),
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
    '/',
    async (ctx) => {
      return ctx.db.transaction(async (trx) => {
        return ctx.resourcesService.createFromUrl(trx, {
          organizationId: ctx.organization!.id,
          url: ctx.body.url,
          caption: ctx.body.caption,
          name: ctx.body.name,
          isPrivate: ctx.body.isPrivate,
        })
      })
    },
    {
      body: t.Object({
        url: t.String({ format: 'uri' }),
        caption: t.String(),
        name: t.String(),
        isPrivate: t.Optional(t.BooleanString({ default: true })),
      }),
      response: {
        200: ResourceSchema,
        500: HttpErrorSchema(),
      },
    }
  )
