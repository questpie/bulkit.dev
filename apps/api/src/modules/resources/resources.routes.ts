import { PaginationSchema } from '@bulkit/api/common/common.schemas'
import { HttpErrorSchema } from '@bulkit/api/common/http-error-handler'
import { applyRateLimit } from '@bulkit/api/common/rate-limit'
import { injectDatabase } from '@bulkit/api/db/db.client'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import { resourceStockRoutes } from '@bulkit/api/modules/resources/routes/resources-stock.routes'
import { injectResourcesService } from '@bulkit/api/modules/resources/services/resources.service'
import { ResourceSchema } from '@bulkit/shared/modules/resources/resources.schemas'
import Elysia, { t } from 'elysia'
import { HttpError } from 'elysia-http-error'

export const resourceRoutes = new Elysia({
  prefix: '/resources',
  detail: {
    tags: ['Resources'],
  },
})
  .use(
    applyRateLimit({
      tiers: {
        authenticated: {
          points: 100, // 100 requests
          duration: 300, // per 5 minutes
          blockDuration: 600, // 10 minute block
        },
      },
    })
  )
  .use(injectDatabase)
  .use(injectResourcesService)
  .use(organizationMiddleware)
  .use(resourceStockRoutes)
  .get(
    '/',
    async (ctx) => {
      return ctx.resourcesService.getAll(ctx.db, {
        organizationId: ctx.organization!.id,
        pagination: ctx.query,
      })
    },
    {
      query: t.Composite([PaginationSchema]),
    }
  )
  .get(
    '/:id',
    async (ctx) => {
      const r = await ctx.resourcesService.getById(ctx.db, {
        id: ctx.params.id,
        organizationId: ctx.organization!.id,
      })

      if (!r) {
        throw HttpError.NotFound('Resource not found')
      }

      return r
    },
    {
      params: t.Object({ id: t.String({ minLength: 1 }) }),
      response: {
        404: HttpErrorSchema(),
        200: ResourceSchema,
      },
    }
  )
  .post(
    '/',
    async (ctx) => {
      return ctx.db
        .transaction(async (trx) => {
          return ctx.resourcesService.create(trx, {
            organizationId: ctx.organization!.id,
            files: ctx.body.files,
            isPrivate: ctx.body.isPrivate ?? true,
          })
        })
        .catch((err) => {
          console.error(err)
          throw HttpError.Internal('Failed to create resources')
        })
    },
    {
      response: {
        500: HttpErrorSchema(),
        200: t.Array(ResourceSchema),
      },
      body: t.Object({
        files: t.Files({
          maxSize: 1024 * 1024 * 1024, // 1GB
          maxItems: 10, // 10 files
          types: ['image/*', 'video/*', 'audio/*'],
        }),
        isPrivate: t.Optional(
          t.BooleanString({
            default: true,
          })
        ),
      }),
    }
  )
  .patch(
    '/approve',
    async (ctx) => {
      const { ids } = ctx.body
      return ctx.db
        .transaction(async (trx) => {
          return ctx.resourcesService.approveResources(trx, {
            organizationId: ctx.organization!.id,
            ids,
          })
        })
        .catch((err) => {
          console.error(err)
          return ctx.error(500, { message: 'Failed to approve resources' })
        })
    },
    {
      body: t.Object({
        ids: t.Array(t.String()),
      }),
      response: {
        500: t.Object({ message: t.String({ minLength: 1 }) }),
        200: t.Array(t.String()),
      },
    }
  )
  .delete(
    '/cleanup',
    async (ctx) => {
      const { ids } = ctx.body
      return ctx.db
        .transaction(async (trx) => {
          return ctx.resourcesService.scheduleCleanup(trx, {
            organizationId: ctx.organization!.id,
            ids,
          })
        })
        .catch((err) => {
          console.error(err)
          return ctx.error(500, { message: 'Failed to schedule cleanup for resources' })
        })
    },
    {
      body: t.Object({
        ids: t.Array(t.String()),
      }),
      response: {
        500: t.Object({ message: t.String({ minLength: 1 }) }),
        200: t.Array(t.String()),
      },
    }
  )
