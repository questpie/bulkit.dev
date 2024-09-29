import { PaginationSchema } from '@bulkit/api/common/common.schemas'
import { injectDatabase } from '@bulkit/api/db/db.client'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import { injectResourcesService } from '@bulkit/api/modules/resources/services/resources.service'
import { ResourceSchema } from '@bulkit/shared/modules/resources/resources.schemas'
import Elysia, { t } from 'elysia'

export const resourceRoutes = new Elysia({
  prefix: '/resources',
})
  .use(injectDatabase)
  .use(injectResourcesService)
  .use(organizationMiddleware)
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
        return ctx.error(404, { message: 'Resource not found' })
      }

      return r
    },
    {
      params: t.Object({ id: t.String({ minLength: 1 }) }),
      response: {
        404: t.Object({ message: t.String({ minLength: 1 }) }),
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
          })
        })
        .catch((err) => {
          console.error(err)
          return ctx.error(500, { message: 'Failed to create resources' })
        })
    },
    {
      response: {
        500: t.Object({ message: t.String({ minLength: 1 }) }),
        200: t.Array(ResourceSchema),
      },
      body: t.Object({
        files: t.Files({
          maxSize: 1024 * 1024 * 1024, // 1GB
          maxItems: 10, // 10 files
          types: ['image/*', 'video/*', 'audio/*'],
        }),
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
