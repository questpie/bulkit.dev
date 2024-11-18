import { injectApiKeyManager } from '@bulkit/api/common/api-key.manager'
import { HttpErrorSchema } from '@bulkit/api/common/http-error-handler'
import { injectDatabase } from '@bulkit/api/db/db.client'
import { aiTextProvidersTable } from '@bulkit/api/db/db.schema'
import { adminMiddleware } from '@bulkit/api/modules/auth/admin/admin.middleware'
import {
  AddAIProviderSchema,
  AIProviderSchema,
  UpdateAIProviderSchema,
} from '@bulkit/shared/src/modules/admin/schemas/ai-providers.schemas'
import { eq } from 'drizzle-orm'
import Elysia, { t } from 'elysia'
import { HttpError } from 'elysia-http-error'

export const aiProvidersRoutes = new Elysia({ prefix: '/ai-providers' })
  .use(adminMiddleware)
  .use(injectDatabase)
  .use(injectApiKeyManager)
  .get(
    '/',
    async ({ db }) => {
      const providers = await db.query.aiTextProvidersTable.findMany({
        columns: {
          id: true,
          name: true,
          model: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      return providers
    },
    {
      response: {
        200: t.Array(AIProviderSchema),
      },
    }
  )
  .post(
    '/',
    async ({ db, body, apiKeyManager }) => {
      const encryptedApiKey = apiKeyManager.encrypt(body.apiKey)

      const provider = await db
        .insert(aiTextProvidersTable)
        .values({
          name: body.name,
          model: body.model,
          apiKey: encryptedApiKey,
        })
        .returning({
          id: aiTextProvidersTable.id,
          name: aiTextProvidersTable.name,
          model: aiTextProvidersTable.model,
          createdAt: aiTextProvidersTable.createdAt,
          updatedAt: aiTextProvidersTable.updatedAt,
        })
        .then((r) => r[0]!)
      return provider
    },
    {
      body: AddAIProviderSchema,
      response: {
        200: AIProviderSchema,
      },
    }
  )
  .put(
    '/',
    async ({ db, body, apiKeyManager }) => {
      if (!body.apiKey) {
        const [provider] = await db
          .select({
            id: aiTextProvidersTable.id,
            name: aiTextProvidersTable.name,
            model: aiTextProvidersTable.model,
            createdAt: aiTextProvidersTable.createdAt,
            updatedAt: aiTextProvidersTable.updatedAt,
          })
          .from(aiTextProvidersTable)
          .where(eq(aiTextProvidersTable.id, body.id))
          .limit(1)

        if (!provider) throw HttpError.NotFound('Provider not found')

        return provider
      }

      const encryptedApiKey = apiKeyManager.encrypt(body.apiKey)

      const provider = await db
        .update(aiTextProvidersTable)
        .set({
          apiKey: encryptedApiKey,
          model: body.model,
        })
        .where(eq(aiTextProvidersTable.id, body.id))
        .returning({
          id: aiTextProvidersTable.id,
          name: aiTextProvidersTable.name,
          model: aiTextProvidersTable.model,
          createdAt: aiTextProvidersTable.createdAt,
          updatedAt: aiTextProvidersTable.updatedAt,
        })
        .then((r) => r[0])

      if (!provider) throw HttpError.NotFound('Provider not found')
      return provider
    },
    {
      body: UpdateAIProviderSchema,
      response: {
        200: AIProviderSchema,
        404: HttpErrorSchema(),
      },
    }
  )
  .delete(
    '/:id',
    async ({ db, params }) => {
      const deleted = await db
        .delete(aiTextProvidersTable)
        .where(eq(aiTextProvidersTable.id, params.id))
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
