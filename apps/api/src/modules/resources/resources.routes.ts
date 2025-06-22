import { HttpErrorSchema } from '@bulkit/api/common/http-error-handler'
import { applyRateLimit } from '@bulkit/api/common/rate-limit'
import { injectDatabase } from '@bulkit/api/db/db.client'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import { resourceStockRoutes } from '@bulkit/api/modules/resources/routes/resources-stock.routes'
import { resourceAIRoutes } from '@bulkit/api/modules/resources/routes/resources-ai.routes'
import { injectResourcesService } from '@bulkit/api/modules/resources/services/resources.service'
import {
  ResourceSchema,
  UpdateResourceSchema,
} from '@bulkit/shared/modules/resources/resources.schemas'
import Elysia, { t } from 'elysia'
import { HttpError } from 'elysia-http-error'
import { Type } from '@sinclair/typebox'
import { protectedMiddleware } from '@bulkit/api/modules/auth/auth.middleware'
import { PaginationQuerySchema } from '@bulkit/shared/schemas/misc'
import { bindContainer } from '@bulkit/api/ioc'

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
  .use(organizationMiddleware)
  .use(resourceStockRoutes)
  .use(resourceAIRoutes)
  .use(protectedMiddleware)
  .use(bindContainer([injectDatabase, injectResourcesService]))
  .get(
    '/',
    async (ctx) => {
      return ctx.resourcesService.getAll(ctx.db, {
        organizationId: ctx.organization!.id,
        query: ctx.query,
      })
    },
    {
      query: t.Composite([
        PaginationQuerySchema,
        t.Object({
          search: t.Optional(t.String()),
        }),
      ]),
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
    '/:id',
    async (ctx) => {
      const resource = await ctx.resourcesService.update(ctx.db, {
        organizationId: ctx.organization!.id,
        id: ctx.params.id,
        data: ctx.body,
      })

      if (!resource) {
        throw HttpError.NotFound('Resource not found')
      }

      return resource
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: UpdateResourceSchema,
    }
  )
  .delete(
    '/:id',
    async (ctx) => {
      const result = await ctx.resourcesService.deleteById(ctx.db, {
        id: ctx.params.id,
        organizationId: ctx.organization!.id,
      })

      if (!result) {
        throw HttpError.NotFound('Resource not found')
      }

      return result
    },
    {
      params: t.Object({
        id: t.String({ minLength: 1 }),
      }),
      response: {
        404: HttpErrorSchema(),
        200: t.String(),
      },
    }
  )
