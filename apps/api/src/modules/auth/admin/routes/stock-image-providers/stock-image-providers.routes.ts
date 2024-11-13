import { injectApiKeyManager } from '@bulkit/api/common/api-key.manager'
import { HttpErrorSchema } from '@bulkit/api/common/http-error-handler'
import { injectDatabase } from '@bulkit/api/db/db.client'
import { stockImageProvidersTable } from '@bulkit/api/db/db.schema'
import { adminMiddleware } from '@bulkit/api/modules/auth/admin/admin.middleware'
import {
  AddStockImageProviderSchema,
  UpdateStockImageProviderSchema,
} from '@bulkit/shared/modules/admin/schemas/stock-image-providers.schemas'
import type { StockImageProviderType } from '@bulkit/shared/modules/app/app-constants'
import { eq } from 'drizzle-orm'
import Elysia, { t } from 'elysia'
import { HttpError } from 'elysia-http-error'

export const stockImageProvidersRoutes = new Elysia({ prefix: '/stock-image-providers' })
  .use(adminMiddleware)
  .use(injectDatabase)
  .use(injectApiKeyManager)
  .get('/', async ({ db }) => {
    const providers = await db.query.stockImageProvidersTable.findMany()
    return providers
  })
  .post(
    '/',
    async ({ db, body, apiKeyManager }) => {
      const encryptedApiKey = apiKeyManager.encrypt(body.apiKey)

      // Check if provider already exists
      const existingProvider = await db
        .select()
        .from(stockImageProvidersTable)
        .where(eq(stockImageProvidersTable.id, body.id as StockImageProviderType))
        .limit(1)

      if (existingProvider.length > 0) {
        throw HttpError.BadRequest(
          'Provider already exists. Please delete or update the existing provider.'
        )
      }

      const provider = await db
        .insert(stockImageProvidersTable)
        .values({
          id: body.id,
          apiKey: encryptedApiKey,
        })
        .returning()
        .then((r) => r[0]!)

      return provider
    },
    {
      body: AddStockImageProviderSchema,
      response: {
        200: AddStockImageProviderSchema,
        400: HttpErrorSchema(),
      },
    }
  )
  .put(
    '/',
    async ({ db, body, apiKeyManager }) => {
      if (!body.apiKey) {
        // If no new API key provided, just return the existing provider
        const [provider] = await db
          .select()
          .from(stockImageProvidersTable)
          .where(eq(stockImageProvidersTable.id, body.id))
          .limit(1)
        return provider
      }

      const encryptedApiKey = apiKeyManager.encrypt(body.apiKey)

      const [provider] = await db
        .update(stockImageProvidersTable)
        .set({
          apiKey: encryptedApiKey,
        })
        .where(eq(stockImageProvidersTable.id, body.id))
        .returning()

      return provider
    },
    {
      body: UpdateStockImageProviderSchema,
    }
  )
  .delete(
    '/:id',
    async ({ db, params }) => {
      const deleted = await db
        .delete(stockImageProvidersTable)
        .where(eq(stockImageProvidersTable.id, params.id as StockImageProviderType))
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
