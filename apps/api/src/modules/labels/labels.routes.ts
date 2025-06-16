import { Elysia, t } from 'elysia'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import { labelsService } from './services/labels.service'
import {
  LabelFiltersSchema,
  CreateLabelSchema,
  UpdateLabelSchema,
  LabelSchema,
  AddLabelsToResourceSchema,
  RemoveLabelsFromResourceSchema,
  BulkLabelOperationSchema,
  CreateLabelCategorySchema,
  LabelCategorySchema,
} from '@bulkit/shared/modules/labels/labels.schemas'

export const labelsRoutes = new Elysia({
  prefix: '/labels',
  detail: {
    tags: ['Labels'],
  },
})
  .use(organizationMiddleware)

  // Get all labels with filtering
  .get(
    '/',
    async (ctx) => {
      const { search, limit = 50, offset = 0 } = ctx.query

      const result = await labelsService.list(ctx.db, {
        organizationId: ctx.organization!.id,
        filters: { search },
        limit,
        offset,
      })

      return {
        data: result.labels,
        pagination: {
          total: result.total,
          limit,
          offset,
          hasMore: offset + limit < result.total,
        },
      }
    },
    {
      query: t.Object({
        search: t.Optional(t.String()),
        limit: t.Optional(t.Integer({ minimum: 1, maximum: 100 })),
        offset: t.Optional(t.Integer({ minimum: 0 })),
      }),
    }
  )

  // Get label by ID
  .get(
    '/:id',
    async (ctx) => {
      const label = await labelsService.getById(ctx.db, {
        labelId: ctx.params.id,
        organizationId: ctx.organization!.id,
      })

      if (!label) {
        ctx.set.status = 404
        return { error: 'Label not found' }
      }

      return label
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: LabelSchema,
        404: t.Object({ error: t.String() }),
      },
    }
  )

  // Create new label
  .post(
    '/',
    async (ctx) => {
      const label = await labelsService.create(ctx.db, {
        ...ctx.body,
        organizationId: ctx.organization!.id,
      })

      return label
    },
    {
      body: CreateLabelSchema,
      response: {
        200: LabelSchema,
      },
    }
  )

  // Update label
  .put(
    '/:id',
    async (ctx) => {
      const label = await labelsService.update(ctx.db, {
        ...ctx.body,
        id: ctx.params.id,
        organizationId: ctx.organization!.id,
      })

      return label
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: UpdateLabelSchema,
      response: {
        200: LabelSchema,
      },
    }
  )

  // Delete label
  .delete(
    '/:id',
    async (ctx) => {
      // Check if label is in use
      const usageCount = await labelsService.getUsageCount(ctx.db, {
        labelId: ctx.params.id,
      })

      if (usageCount > 0) {
        ctx.set.status = 400
        return {
          error: `Cannot delete label. It is currently used by ${usageCount} resource(s).`,
          usageCount,
        }
      }

      await labelsService.delete(ctx.db, {
        labelId: ctx.params.id,
        organizationId: ctx.organization!.id,
      })

      return { success: true }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: t.Object({ success: t.Boolean() }),
        400: t.Object({
          error: t.String(),
          usageCount: t.Number(),
        }),
      },
    }
  )

  // Get usage count for label (across all resource types or specific type)
  .get(
    '/:id/usage/count',
    async (ctx) => {
      const usageCount = await labelsService.getUsageCount(ctx.db, {
        labelId: ctx.params.id,
        resourceType: ctx.query.resourceType,
      })

      return { count: usageCount }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      query: t.Object({
        resourceType: t.Optional(t.String()),
      }),
      response: {
        200: t.Object({ count: t.Number() }),
      },
    }
  )

  // Add labels to resource
  .post(
    '/resources/add',
    async (ctx) => {
      await labelsService.addLabelsToResource(ctx.db, {
        ...ctx.body,
        organizationId: ctx.organization!.id,
      })

      return { success: true }
    },
    {
      body: AddLabelsToResourceSchema,
      response: {
        200: t.Object({ success: t.Boolean() }),
      },
    }
  )

  // Remove labels from resource
  .post(
    '/resources/remove',
    async (ctx) => {
      await labelsService.removeLabelsFromResource(ctx.db, {
        ...ctx.body,
        organizationId: ctx.organization!.id,
      })

      return { success: true }
    },
    {
      body: RemoveLabelsFromResourceSchema,
      response: {
        200: t.Object({ success: t.Boolean() }),
      },
    }
  )

  // Get labels for resources
  .get(
    '/resources',
    async (ctx) => {
      const result = await labelsService.getResourceLabels(ctx.db, {
        resourceId: ctx.query.resourceId,
        resourceType: ctx.query.resourceType,
        resourceIds: ctx.query.resourceIds,
        organizationId: ctx.organization!.id,
      })

      return { data: result }
    },
    {
      query: t.Object({
        resourceId: t.Optional(t.String()),
        resourceType: t.Optional(t.String()),
        resourceIds: t.Optional(t.Array(t.String())),
      }),
    }
  )

  // Bulk label operations
  .post(
    '/bulk',
    async (ctx) => {
      await labelsService.bulkLabelOperation(ctx.db, {
        ...ctx.body,
        organizationId: ctx.organization!.id,
      })

      return { success: true }
    },
    {
      body: BulkLabelOperationSchema,
      response: {
        200: t.Object({ success: t.Boolean() }),
      },
    }
  )

  // Label categories
  .get(
    '/categories',
    async (ctx) => {
      const categories = await labelsService.getCategories(ctx.db, {
        organizationId: ctx.organization!.id,
      })

      return { data: categories }
    },
    {
      response: {
        200: t.Object({
          data: t.Array(LabelCategorySchema),
        }),
      },
    }
  )

  .post(
    '/categories',
    async (ctx) => {
      const category = await labelsService.createCategory(ctx.db, {
        ...ctx.body,
        organizationId: ctx.organization!.id,
      })

      return category
    },
    {
      body: CreateLabelCategorySchema,
      response: {
        200: LabelCategorySchema,
      },
    }
  )
