import { injectApiKeyManager } from '@bulkit/api/common/api-key.manager'
import { HttpErrorSchema } from '@bulkit/api/common/http-error-handler'
import { injectDatabase } from '@bulkit/api/db/db.client'
import { aiTextProvidersTable } from '@bulkit/api/db/db.schema'
import { adminMiddleware } from '@bulkit/api/modules/auth/admin/admin.middleware'
import {
  AddAIProviderSchema,
  UpdateAIProviderSchema,
} from '@bulkit/shared/modules/admin/schemas/ai-providers.scemas'
import { eq } from 'drizzle-orm'
import Elysia, { t } from 'elysia'
import { HttpError } from 'elysia-http-error'

export const aiProvidersRoutes = new Elysia({ prefix: '/ai-providers' })
  .use(adminMiddleware)
  .use(injectDatabase)
  .use(injectApiKeyManager)
  .get('/', async ({ db }) => {
    const providers = await db.query.aiTextProvidersTable.findMany()
    return providers
  })
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
        .returning()
        .execute()

      return provider[0]
    },
    {
      body: AddAIProviderSchema,
    }
  )
  .put(
    '/',
    async ({ db, body, apiKeyManager }) => {
      if (!body.apiKey) {
        const [provider] = await db
          .select()
          .from(aiTextProvidersTable)
          .where(eq(aiTextProvidersTable.id, body.id))
          .limit(1)
        return provider
      }

      const encryptedApiKey = apiKeyManager.encrypt(body.apiKey)

      const [provider] = await db
        .update(aiTextProvidersTable)
        .set({
          apiKey: encryptedApiKey,
          model: body.model,
        })
        .where(eq(aiTextProvidersTable.id, body.id))
        .returning()

      return provider
    },
    {
      body: UpdateAIProviderSchema,
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
