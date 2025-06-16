import { HttpErrorSchema } from '@bulkit/api/common/http-error-handler'
import { injectDatabase } from '@bulkit/api/db/db.client'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import { injectResourcesService } from '@bulkit/api/modules/resources/services/resources.service'
import { injectAIImageGenerationService } from '@bulkit/api/modules/ai/services/ai-image-generation.service'
import { ResourceSchema } from '@bulkit/shared/modules/resources/resources.schemas'
import { Type } from '@sinclair/typebox'
import Elysia, { t } from 'elysia'
import { protectedMiddleware } from '@bulkit/api/modules/auth/auth.middleware'

export const resourceAIRoutes = new Elysia({ prefix: '/ai' })
  .use(injectDatabase)
  .use(injectResourcesService)
  .use(injectAIImageGenerationService)
  .use(organizationMiddleware)
  .use(protectedMiddleware)
  .get('/providers', async (ctx) => {
    return ctx.aiImageGenerationService.getAvailableProviders(ctx.db)
  })
  .post(
    '/generate',
    async (ctx) => {
      const resource = await ctx.aiImageGenerationService.generateImage(ctx.db, {
        prompt: ctx.body.prompt,
        imageUrl: ctx.body.imageUrl,
        providerId: ctx.body.providerId,
        userId: ctx.auth.user.id,
        organizationId: ctx.organization!.id,
      })

      return resource
    },
    {
      body: t.Object({
        prompt: t.String(),
        imageUrl: t.Optional(t.String()),
        providerId: t.String(),
      }),
      response: {
        200: ResourceSchema,
        500: HttpErrorSchema(),
      },
    }
  )
