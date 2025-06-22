import { injectDatabase } from '@bulkit/api/db/db.client'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import { protectedMiddleware } from '@bulkit/api/modules/auth/auth.middleware'
import {
  LabelSchema,
  CreateLabelSchema,
  UpdateLabelSchema,
  LabelsQuerySchema,
  AttachLabelsSchema,
  DetachLabelsSchema,
  LabelWithUsageSchema,
} from '@bulkit/shared/modules/labels/labels.schemas'
import { PaginatedResponseSchema } from '@bulkit/shared/schemas/misc'
import { LABEL_RESOURCE_TYPES } from '@bulkit/shared/constants/db.constants'
import { injectLabelsService, LabelsService } from './services/labels.service'
import { Elysia, t } from 'elysia'
import { HttpError } from 'elysia-http-error'
import { bindContainer } from '@bulkit/api/ioc'

export const labelsRoutes = new Elysia({
  prefix: '/labels',
  detail: {
    tags: ['Labels'],
  },
})
  .use(organizationMiddleware)
  .use(protectedMiddleware)
  .use(bindContainer([injectDatabase, injectLabelsService]))

  // Get all labels
  .get(
    '/',
    async (ctx) => {
      return ctx.labelsService.getAll(ctx.db, {
        organizationId: ctx.organization!.id,
        query: ctx.query,
      })
    },
    {
      query: LabelsQuerySchema,
      response: PaginatedResponseSchema(LabelSchema),
    }
  )

  // Get labels with usage stats
  .get(
    '/with-usage',
    async (ctx) => {
      return ctx.labelsService.getAllWithUsage(ctx.db, {
        organizationId: ctx.organization!.id,
        query: ctx.query,
      })
    },
    {
      query: LabelsQuerySchema,
      response: PaginatedResponseSchema(LabelWithUsageSchema),
    }
  )

  // Get label by ID
  .get(
    '/:id',
    async (ctx) => {
      const label = await ctx.labelsService.getById(ctx.db, {
        id: ctx.params.id,
        organizationId: ctx.organization!.id,
      })

      if (!label) {
        throw HttpError.NotFound('Label not found')
      }

      return label
    },
    {
      params: t.Object({ id: t.String() }),
      response: LabelSchema,
    }
  )

  // Create new label
  .post(
    '/',
    async (ctx) => {
      return ctx.labelsService.create(ctx.db, {
        organizationId: ctx.organization!.id,
        data: ctx.body,
      })
    },
    {
      body: CreateLabelSchema,
      response: LabelSchema,
    }
  )

  // Update label
  .patch(
    '/:id',
    async (ctx) => {
      const label = await ctx.labelsService.update(ctx.db, {
        id: ctx.params.id,
        organizationId: ctx.organization!.id,
        data: ctx.body,
      })

      if (!label) {
        throw HttpError.NotFound('Label not found')
      }

      return label
    },
    {
      params: t.Object({ id: t.String() }),
      body: UpdateLabelSchema,
      response: LabelSchema,
    }
  )

  // Delete label
  .delete(
    '/:id',
    async (ctx) => {
      const deleted = await ctx.labelsService.delete(ctx.db, {
        id: ctx.params.id,
        organizationId: ctx.organization!.id,
      })

      if (!deleted) {
        throw HttpError.NotFound('Label not found')
      }

      return { success: true }
    },
    {
      params: t.Object({ id: t.String() }),
      response: t.Object({ success: t.Boolean() }),
    }
  )

  // Get labels for a resource
  .get(
    '/resource/:resourceType/:resourceId',
    async (ctx) => {
      return ctx.labelsService.getResourceLabels(ctx.db, {
        organizationId: ctx.organization!.id,
        resourceId: ctx.params.resourceId,
        resourceType: ctx.params.resourceType,
      })
    },
    {
      params: t.Object({
        resourceType: t.Union(LABEL_RESOURCE_TYPES.map((type) => t.Literal(type))),
        resourceId: t.String(),
      }),
      response: t.Array(LabelSchema),
    }
  )

  // Attach labels to a resource
  .post(
    '/attach',
    async (ctx) => {
      await ctx.labelsService.attachLabels(ctx.db, {
        organizationId: ctx.organization!.id,
        data: ctx.body,
      })

      return { success: true }
    },
    {
      body: AttachLabelsSchema,
      response: t.Object({ success: t.Boolean() }),
    }
  )

  // Detach labels from a resource
  .post(
    '/detach',
    async (ctx) => {
      await ctx.labelsService.detachLabels(ctx.db, {
        organizationId: ctx.organization!.id,
        data: ctx.body,
      })

      return { success: true }
    },
    {
      body: DetachLabelsSchema,
      response: t.Object({ success: t.Boolean() }),
    }
  )

  // Replace all labels for a resource
  .post(
    '/replace',
    async (ctx) => {
      await ctx.labelsService.replaceLabels(ctx.db, {
        organizationId: ctx.organization!.id,
        resourceId: ctx.body.resourceId,
        resourceType: ctx.body.resourceType,
        labelIds: ctx.body.labelIds,
      })

      return { success: true }
    },
    {
      body: t.Object({
        resourceId: t.String(),
        resourceType: t.Union(LABEL_RESOURCE_TYPES.map((type) => t.Literal(type))),
        labelIds: t.Array(t.String()),
      }),
      response: t.Object({ success: t.Boolean() }),
    }
  )
