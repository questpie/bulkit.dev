import { injectApiKeyManager } from '@bulkit/api/common/api-key.manager'
import { HttpErrorSchema } from '@bulkit/api/common/http-error-handler'
import { injectDatabase } from '@bulkit/api/db/db.client'
import { aiImageProvidersTable } from '@bulkit/api/db/db.schema'
import { bindContainer } from '@bulkit/api/ioc'
import { adminMiddleware } from '@bulkit/api/modules/auth/admin/admin.middleware'
import {
  AddAIImageProviderSchema,
  AIImageProviderSchema,
  UpdateAIImageProviderSchema,
  type UpdateAIImageProvider,
} from '@bulkit/shared/modules/admin/schemas/ai-image-providers.schemas'
import { eq } from 'drizzle-orm'
import Elysia, { t } from 'elysia'
import { HttpError } from 'elysia-http-error'

export const aiImageProvidersRoutes = new Elysia({ prefix: '/ai-image-providers' })
  .use(adminMiddleware)
  .use(bindContainer([injectDatabase, injectApiKeyManager]))
  .get(
    '/',
    async ({ db }) => {
      const providers = await db.query.aiImageProvidersTable.findMany({
        columns: {
          apiKey: false,
        },
      })
      return providers
    },
    {
      response: {
        200: t.Array(AIImageProviderSchema),
      },
    }
  )
  .post(
    '/',
    async ({ db, body, apiKeyManager }) => {
      const encryptedApiKey = apiKeyManager.encrypt(body.apiKey)

      const provider = await db
        .insert(aiImageProvidersTable)
        .values({
          name: body.name,
          model: body.model,
          apiKey: encryptedApiKey,
          capabilities: body.capabilities,
          isActive: body.isActive,
          costPerImage: body.costPerImage,
          //   outputMapping: body.outputMapping,
        })
        .returning({
          id: aiImageProvidersTable.id,
          name: aiImageProvidersTable.name,
          model: aiImageProvidersTable.model,
          createdAt: aiImageProvidersTable.createdAt,
          updatedAt: aiImageProvidersTable.updatedAt,
          capabilities: aiImageProvidersTable.capabilities,
          isActive: aiImageProvidersTable.isActive,
          costPerImage: aiImageProvidersTable.costPerImage,
          //   outputMapping: aiImageProvidersTable.outputMapping,
        })
        .then((r) => r[0]!)
      return provider
    },
    {
      body: AddAIImageProviderSchema,
      response: {
        200: AIImageProviderSchema,
      },
    }
  )
  .put(
    '/',
    async ({ db, body, apiKeyManager }) => {
      const updateData: UpdateAIImageProvider = {
        id: body.id,
        model: body.model,
        capabilities: body.capabilities,
        isActive: body.isActive,
        costPerImage: body.costPerImage,
      }

      if (body.apiKey) {
        updateData.apiKey = apiKeyManager.encrypt(body.apiKey)
      }

      const provider = await db
        .update(aiImageProvidersTable)
        .set(updateData)
        .where(eq(aiImageProvidersTable.id, body.id))
        .returning({
          id: aiImageProvidersTable.id,
          name: aiImageProvidersTable.name,
          model: aiImageProvidersTable.model,
          createdAt: aiImageProvidersTable.createdAt,
          updatedAt: aiImageProvidersTable.updatedAt,
          capabilities: aiImageProvidersTable.capabilities,
          isActive: aiImageProvidersTable.isActive,
          costPerImage: aiImageProvidersTable.costPerImage,
        })
        .then((r) => r[0])

      if (!provider) throw HttpError.NotFound('Provider not found')
      return provider
    },
    {
      body: UpdateAIImageProviderSchema,
      response: {
        200: AIImageProviderSchema,
        404: HttpErrorSchema(),
      },
    }
  )
  .delete(
    '/:id',
    async ({ db, params }) => {
      const deleted = await db
        .delete(aiImageProvidersTable)
        .where(eq(aiImageProvidersTable.id, params.id))
        .returning()

      if (!deleted.length) throw HttpError.NotFound('Provider not found')

      return { success: true }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: t.Object({
          success: t.Boolean(),
        }),
        404: HttpErrorSchema(),
      },
    }
  )
