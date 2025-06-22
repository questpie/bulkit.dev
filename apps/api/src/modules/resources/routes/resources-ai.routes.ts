import { HttpErrorSchema } from '@bulkit/api/common/http-error-handler'
import { injectDatabase } from '@bulkit/api/db/db.client'
import { bindContainer } from '@bulkit/api/ioc'
import { injectAIImageGenerationService } from '@bulkit/api/modules/ai/services/ai-image-generation.service'
import { protectedMiddleware } from '@bulkit/api/modules/auth/auth.middleware'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import { injectResourcesService } from '@bulkit/api/modules/resources/services/resources.service'
import { ResourceSchema } from '@bulkit/shared/modules/resources/resources.schemas'
import { Type } from '@sinclair/typebox'
import Elysia, { t } from 'elysia'

export const resourceAIRoutes = new Elysia({ prefix: '/ai' })
  .use(organizationMiddleware)
  .use(protectedMiddleware)
  .use(bindContainer([injectDatabase, injectResourcesService, injectAIImageGenerationService]))
  .get('/providers', async (ctx) => {
    return ctx.aiImageGenerationService.getAvailableProviders(ctx.db)
  })
  .post(
    '/generate',
    async (ctx) => {
      return ctx.aiImageGenerationService.generateImage(ctx.db, {
        prompt: ctx.body.prompt,
        imageUrl: ctx.body.imageUrl,
        providerId: ctx.body.providerId,
        userId: ctx.auth.user.id,
        organizationId: ctx.organization!.id,
      })
    },
    {
      body: t.Object({
        prompt: t.String(),
        imageUrl: t.Optional(t.String()),
        providerId: t.String(),
      }),
      response: {
        200: Type.Array(ResourceSchema),
        500: HttpErrorSchema(),
      },
    }
  )
