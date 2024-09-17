import { PaginationSchema } from '@bulkit/api/common/common.schemas'
import { db } from '@bulkit/api/db/db.client'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import {
  createResources,
  getResourceById,
  getResourcesForOrg,
} from '@bulkit/api/modules/resources/resources.dal'
import { ResourceSchema } from '@bulkit/shared/modules/resources/resources.schemas'
import Elysia, { t } from 'elysia'

export const resourceRoutes = new Elysia({
  prefix: '/resources',
})
  .use(organizationMiddleware)
  .get(
    '/',
    async (ctx) => {
      return getResourcesForOrg(db, { organizationId: ctx.organization!.id, pagination: ctx.query })
    },
    {
      query: t.Composite([PaginationSchema]),
    }
  )
  .get(
    '/:id',
    async (ctx) => {
      const r = await getResourceById(db, {
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
      return db
        .transaction(async (trx) => {
          return createResources(trx, {
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
          maxSize: 1024 * 1024 * 10, // 10MB
          maxItems: 10, // 10 files
          types: ['image/*', 'video/*', 'audio/*'],
        }),
      }),
    }
  )
