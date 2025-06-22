import { type ApiKeyManager, injectApiKeyManager } from '@bulkit/api/common/api-key.manager'
import type { TransactionLike } from '@bulkit/api/db/db.client'
import { ioc } from '@bulkit/api/ioc'
import { PixabayProvider } from '@bulkit/api/modules/resources/stock-image/providers/pixabay.provider'
import { UnsplashProvider } from '@bulkit/api/modules/resources/stock-image/providers/unsplash.provider'
import type { StockImageProviderAdapter } from '@bulkit/api/modules/resources/stock-image/types'
import type { StockImageProviderType } from '@bulkit/shared/modules/app/app-constants'
import { HttpError } from 'elysia-http-error'

const PROVIDER_CONSTRUCTORS: Record<
  StockImageProviderType,
  new (
    apiKey: string
  ) => StockImageProviderAdapter
> = {
  pixabay: PixabayProvider,
  unsplash: UnsplashProvider,
}

export class StockImageService {
  private providers: Map<string, StockImageProviderAdapter> = new Map()
  private initialized = false

  constructor(private readonly apiKeyManager: ApiKeyManager) {}

  private async initializeProviders(db: TransactionLike) {
    if (this.initialized) return

    const providers = await db.query.stockImageProvidersTable.findMany()

    for (const provider of providers) {
      const ProviderConstructor = PROVIDER_CONSTRUCTORS[provider.id as StockImageProviderType]
      if (ProviderConstructor) {
        const decryptedApiKey = this.apiKeyManager.decrypt(provider.apiKey)
        this.providers.set(provider.id, new ProviderConstructor(decryptedApiKey))
      }
    }

    this.initialized = true
  }

  async search(
    db: TransactionLike,
    provider: string,
    query: string,
    perPage: number,
    page: number
  ) {
    await this.initializeProviders(db)

    const service = this.providers.get(provider)
    if (!service) {
      throw HttpError.BadRequest(`Unsupported stock image provider: ${provider}`)
    }

    return service.search(query, perPage, page)
  }

  async getAvailableProviders(db: TransactionLike) {
    await this.initializeProviders(db)
    return Array.from(this.providers.keys())
  }
}

export const injectStockImageService = ioc.register('stockImageService', () => {
  const { apiKeyManager } = ioc.resolve([injectApiKeyManager])
  return new StockImageService(apiKeyManager)
})
