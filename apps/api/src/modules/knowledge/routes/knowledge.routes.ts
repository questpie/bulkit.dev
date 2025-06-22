import { applyRateLimit } from '@bulkit/api/common/rate-limit'
import { HttpErrorSchema } from '@bulkit/api/common/http-error-handler'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import { HttpError } from 'elysia-http-error'
import { Elysia, t } from 'elysia'
import { injectKnowledgeService } from '../services/knowledge.service'
import { injectKnowledgeTemplatesService } from '../services/knowledge-templates.service'
import { injectWebScrapingService } from '../services/web-scraping.service'
import {
  CreateKnowledgeSchema,
  UpdateKnowledgeSchema,
  KnowledgeListQuerySchema,
  CreateKnowledgeTemplateSchema,
  UpdateKnowledgeTemplateSchema,
  WebScrapingRequestSchema,
} from '@bulkit/shared/modules/knowledge/knowledge.schemas'
import { bindContainer } from '@bulkit/api/ioc'

export const knowledgeRoutes = new Elysia({
  prefix: '/knowledge',
  detail: { tags: ['Knowledge Base'] },
})
  .use(
    applyRateLimit({
      tiers: {
        authenticated: {
          points: 100,
          duration: 60,
          blockDuration: 120,
        },
      },
    })
  )
  .use(organizationMiddleware)
  .use(
    bindContainer([
      injectKnowledgeService,
      injectKnowledgeTemplatesService,
      injectWebScrapingService,
    ])
  )

  // Create knowledge document
  .post(
    '/',
    async ({ body, auth, organization, ...services }) => {
      try {
        const knowledge = await services.knowledgeService.create(services.db, {
          organizationId: organization.id,
          userId: auth.user.id,
          data: body,
        })

        return {
          success: true,
          data: knowledge,
          message: 'Knowledge document created successfully',
        }
      } catch (error) {
        if (error instanceof HttpError) throw error
        console.error('Knowledge creation failed:', error)
        throw HttpError.Internal('Failed to create knowledge document')
      }
    },
    {
      body: CreateKnowledgeSchema,
      response: {
        200: t.Object({
          success: t.Boolean(),
          data: t.Any(),
          message: t.String(),
        }),
        400: HttpErrorSchema(),
        401: HttpErrorSchema(),
        500: HttpErrorSchema(),
      },
    }
  )

  // Get knowledge document by ID
  .get(
    '/:id',
    async ({ params, auth, organization, ...services }) => {
      try {
        const knowledge = await services.knowledgeService.getById(services.db, {
          knowledgeId: params.id,
          organizationId: organization.id,
          trackView: true,
          userId: auth.user.id,
        })

        if (!knowledge) {
          throw HttpError.NotFound('Knowledge document not found')
        }

        return {
          success: true,
          data: knowledge,
          message: 'Knowledge document retrieved',
        }
      } catch (error) {
        if (error instanceof HttpError) throw error
        console.error('Failed to get knowledge document:', error)
        throw HttpError.Internal('Failed to retrieve knowledge document')
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: t.Object({
          success: t.Boolean(),
          data: t.Any(),
          message: t.String(),
        }),
        404: HttpErrorSchema(),
        500: HttpErrorSchema(),
      },
    }
  )

  // Update knowledge document
  .put(
    '/:id',
    async ({ params, body, auth, organization, ...services }) => {
      try {
        const knowledge = await services.knowledgeService.update(services.db, {
          knowledgeId: params.id,
          organizationId: organization.id,
          userId: auth.user.id,
          data: body,
        })

        return {
          success: true,
          data: knowledge,
          message: 'Knowledge document updated successfully',
        }
      } catch (error) {
        if (error instanceof HttpError) throw error
        console.error('Knowledge update failed:', error)
        const message =
          error instanceof Error ? error.message : 'Failed to update knowledge document'
        throw HttpError.Internal(message)
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: UpdateKnowledgeSchema,
      response: {
        200: t.Object({
          success: t.Boolean(),
          data: t.Any(),
          message: t.String(),
        }),
        400: HttpErrorSchema(),
        401: HttpErrorSchema(),
        404: HttpErrorSchema(),
        500: HttpErrorSchema(),
      },
    }
  )

  // Delete knowledge document
  .delete(
    '/:id',
    async ({ params, organization, ...services }) => {
      try {
        await services.knowledgeService.delete(services.db, {
          knowledgeId: params.id,
          organizationId: organization.id,
        })

        return {
          success: true,
          data: null,
          message: 'Knowledge document deleted successfully',
        }
      } catch (error) {
        if (error instanceof HttpError) throw error
        console.error('Knowledge deletion failed:', error)
        const message =
          error instanceof Error ? error.message : 'Failed to delete knowledge document'
        throw HttpError.Internal(message)
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: t.Object({
          success: t.Boolean(),
          data: t.Null(),
          message: t.String(),
        }),
        401: HttpErrorSchema(),
        404: HttpErrorSchema(),
        500: HttpErrorSchema(),
      },
    }
  )

  // List knowledge documents
  .get(
    '/',
    async ({ query, organization, ...services }) => {
      try {
        const result = await services.knowledgeService.list(services.db, {
          organizationId: organization.id,
          query,
        })

        return {
          success: true,
          data: result.data,
          pagination: result.pagination,
          message: 'Knowledge documents retrieved',
        }
      } catch (error) {
        console.error('Failed to list knowledge documents:', error)
        throw HttpError.Internal('Failed to retrieve knowledge documents')
      }
    },
    {
      query: KnowledgeListQuerySchema,
      response: {
        200: t.Object({
          success: t.Boolean(),
          data: t.Array(t.Any()),
          pagination: t.Object({
            page: t.Number(),
            limit: t.Number(),
            total: t.Number(),
            totalPages: t.Number(),
          }),
          message: t.String(),
        }),
        500: HttpErrorSchema(),
      },
    }
  )

  // Get knowledge document versions
  .get(
    '/:id/versions',
    async ({ params, organization, ...services }) => {
      try {
        const versions = await services.knowledgeService.getVersions(
          services.db,
          params.id,
          organization.id
        )

        return {
          success: true,
          data: versions,
          message: 'Knowledge document versions retrieved',
        }
      } catch (error) {
        console.error('Failed to get knowledge versions:', error)
        const message = error instanceof Error ? error.message : 'Failed to retrieve versions'
        throw HttpError.Internal(message)
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: t.Object({
          success: t.Boolean(),
          data: t.Array(t.Any()),
          message: t.String(),
        }),
        404: HttpErrorSchema(),
        500: HttpErrorSchema(),
      },
    }
  )

  // Restore knowledge document to specific version
  .post(
    '/:id/versions/:version/restore',
    async ({ params, auth, organization, ...services }) => {
      try {
        const knowledge = await services.knowledgeService.restoreVersion(services.db, {
          knowledgeId: params.id,
          organizationId: organization.id,
          userId: auth.user.id,
          version: Number.parseInt(params.version),
        })

        return {
          success: true,
          data: knowledge,
          message: `Restored to version ${params.version}`,
        }
      } catch (error) {
        console.error('Failed to restore knowledge version:', error)
        const message = error instanceof Error ? error.message : 'Failed to restore version'
        throw HttpError.Internal(message)
      }
    },
    {
      params: t.Object({
        id: t.String(),
        version: t.String(),
      }),
      response: {
        200: t.Object({
          success: t.Boolean(),
          data: t.Any(),
          message: t.String(),
        }),
        400: HttpErrorSchema(),
        401: HttpErrorSchema(),
        404: HttpErrorSchema(),
        500: HttpErrorSchema(),
      },
    }
  )

  // Templates routes
  .get(
    '/templates',
    async ({ query, organization, ...services }) => {
      try {
        const result = await services.knowledgeTemplatesService.list(services.db, {
          organizationId: organization.id,
          includePublic: true,
          search: query.search,
          templateType: query.templateType as any,
          limit: query.limit || 20,
          offset: ((query.page || 1) - 1) * (query.limit || 20),
        })

        return {
          success: true,
          data: result.templates,
          total: result.total,
          message: 'Templates retrieved',
        }
      } catch (error) {
        console.error('Failed to list templates:', error)
        throw HttpError.Internal('Failed to retrieve templates')
      }
    },
    {
      query: t.Object({
        search: t.Optional(t.String()),
        templateType: t.Optional(t.String()),
        page: t.Optional(t.Number({ minimum: 1 })),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
      }),
      response: {
        200: t.Object({
          success: t.Boolean(),
          data: t.Array(t.Any()),
          total: t.Number(),
          message: t.String(),
        }),
        500: HttpErrorSchema(),
      },
    }
  )

  // Create template
  .post(
    '/templates',
    async ({ body, auth, organization, ...services }) => {
      try {
        const template = await services.knowledgeTemplatesService.create(services.db, {
          organizationId: organization.id,
          userId: auth.user.id,
          data: body,
        })

        return {
          success: true,
          data: template,
          message: 'Template created successfully',
        }
      } catch (error) {
        console.error('Template creation failed:', error)
        throw HttpError.Internal('Failed to create template')
      }
    },
    {
      body: CreateKnowledgeTemplateSchema,
      response: {
        200: t.Object({
          success: t.Boolean(),
          data: t.Any(),
          message: t.String(),
        }),
        400: HttpErrorSchema(),
        401: HttpErrorSchema(),
        500: HttpErrorSchema(),
      },
    }
  )

  // Get template by ID
  .get(
    '/templates/:id',
    async ({ params, organization, ...services }) => {
      try {
        const template = await services.knowledgeTemplatesService.getById(services.db, {
          templateId: params.id,
          organizationId: organization.id,
        })

        if (!template) {
          throw HttpError.NotFound('Template not found')
        }

        return {
          success: true,
          data: template,
          message: 'Template retrieved',
        }
      } catch (error) {
        if (error instanceof HttpError) throw error
        console.error('Failed to get template:', error)
        throw HttpError.Internal('Failed to retrieve template')
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: t.Object({
          success: t.Boolean(),
          data: t.Any(),
          message: t.String(),
        }),
        404: HttpErrorSchema(),
        500: HttpErrorSchema(),
      },
    }
  )

  // Use template to create knowledge document
  .post(
    '/templates/:id/use',
    async ({ params, body, auth, organization, ...services }) => {
      try {
        const templateData = await services.knowledgeTemplatesService.useTemplate(services.db, {
          templateId: params.id,
          organizationId: organization.id,
          userId: auth.user.id,
          customData: body,
        })

        // Create knowledge document from template
        const knowledge = await services.knowledgeService.create(services.db, {
          organizationId: organization.id,
          userId: auth.user.id,
          data: {
            title: templateData.title,
            content: templateData.content,
            templateType: templateData.templateType,
            metadata: templateData.metadata,
            status: 'draft',
          },
        })

        return {
          success: true,
          data: knowledge,
          message: 'Knowledge document created from template',
        }
      } catch (error) {
        console.error('Failed to use template:', error)
        const message = error instanceof Error ? error.message : 'Failed to use template'
        throw HttpError.Internal(message)
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        title: t.Optional(t.String()),
        placeholderValues: t.Optional(t.Record(t.String(), t.String())),
      }),
      response: {
        200: t.Object({
          success: t.Boolean(),
          data: t.Any(),
          message: t.String(),
        }),
        400: HttpErrorSchema(),
        401: HttpErrorSchema(),
        404: HttpErrorSchema(),
        500: HttpErrorSchema(),
      },
    }
  )

  // Update template
  .put(
    '/templates/:id',
    async ({ params, body, auth, organization, ...services }) => {
      try {
        const template = await services.knowledgeTemplatesService.update(services.db, {
          templateId: params.id,
          organizationId: organization.id,
          userId: auth.user.id,
          data: body,
        })

        return {
          success: true,
          data: template,
          message: 'Template updated successfully',
        }
      } catch (error) {
        console.error('Template update failed:', error)
        const message = error instanceof Error ? error.message : 'Failed to update template'
        throw HttpError.Internal(message)
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: UpdateKnowledgeTemplateSchema,
      response: {
        200: t.Object({
          success: t.Boolean(),
          data: t.Any(),
          message: t.String(),
        }),
        400: HttpErrorSchema(),
        401: HttpErrorSchema(),
        404: HttpErrorSchema(),
        500: HttpErrorSchema(),
      },
    }
  )

  // Delete template
  .delete(
    '/templates/:id',
    async ({ params, organization, ...services }) => {
      try {
        await services.knowledgeTemplatesService.delete(services.db, params.id, organization.id)

        return {
          success: true,
          data: null,
          message: 'Template deleted successfully',
        }
      } catch (error) {
        console.error('Template deletion failed:', error)
        const message = error instanceof Error ? error.message : 'Failed to delete template'
        throw HttpError.Internal(message)
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: t.Object({
          success: t.Boolean(),
          data: t.Null(),
          message: t.String(),
        }),
        401: HttpErrorSchema(),
        404: HttpErrorSchema(),
        500: HttpErrorSchema(),
      },
    }
  )

  // Web scraping route
  .post(
    '/scrape',
    async ({ body, auth, organization, ...services }) => {
      try {
        // Validate URL
        const validation = services.webScrapingService.validateUrl(body.url)
        if (!validation.valid) {
          throw HttpError.BadRequest(validation.error || 'Invalid URL')
        }

        // Scrape content and convert to knowledge format
        const knowledgeData = await services.webScrapingService.scrapeToKnowledge(
          services.db,
          body,
          auth.user.id,
          organization.id
        )

        // Create knowledge document
        const knowledge = await services.knowledgeService.create(services.db, {
          organizationId: organization.id,
          userId: auth.user.id,
          data: {
            title: knowledgeData.title,
            content: knowledgeData.content,
            templateType: knowledgeData.templateType,
            metadata: knowledgeData.metadata,
            status: 'published',
            mentions: [], // Could extract mentions from content in the future
          },
        })

        return {
          success: true,
          data: knowledge,
          message: 'Content scraped and knowledge document created successfully',
        }
      } catch (error) {
        if (error instanceof HttpError) throw error
        console.error('Web scraping failed:', error)
        const message = error instanceof Error ? error.message : 'Failed to scrape content'
        throw HttpError.Internal(message)
      }
    },
    {
      body: WebScrapingRequestSchema,
      response: {
        200: t.Object({
          success: t.Boolean(),
          data: t.Any(),
          message: t.String(),
        }),
        400: HttpErrorSchema(),
        401: HttpErrorSchema(),
        501: HttpErrorSchema(),
        500: HttpErrorSchema(),
      },
    }
  )
