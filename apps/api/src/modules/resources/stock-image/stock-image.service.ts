import { type ApiKeyManager, injectApiKeyManager } from '@bulkit/api/common/api-key.manager'
import type { TransactionLike } from '@bulkit/api/db/db.client'
import { ioc, iocRegister, iocResolve } from '@bulkit/api/ioc'
import { PixabayProvider } from '@bulkit/api/modules/resources/stock-image/providers/pixabay.provider'
import type { StockImageProvider } from '@bulkit/api/modules/resources/stock-image/types'
import { HttpError } from 'elysia-http-error'

export class StockImageService {
  private providers: Map<string, StockImageProvider> = new Map()
  private initialized = false

  constructor(private readonly apiKeyManager: ApiKeyManager) {}

  private async initializeProviders(db: TransactionLike) {
    if (this.initialized) return

    const providers = await db.query.stockImageProvidersTable.findMany()

    for (const provider of providers) {
      if (provider.id === 'pixabay') {
        this.providers.set(
          provider.id,
          new PixabayProvider(this.apiKeyManager.decrypt(provider.apiKey))
        )
      }
    }

    this.initialized = true
  }

  async search(db: TransactionLike, provider: string, query: string, perPage: number) {
    await this.initializeProviders(db)

    const service = this.providers.get(provider)
    if (!service) {
      throw HttpError.BadRequest(`Unsupported stock image provider: ${provider}`)
    }

    return service.search(query, perPage)
  }

  async getAvailableProviders(db: TransactionLike) {
    await this.initializeProviders(db)
    return Array.from(this.providers.keys())
  }
}

export const injectStockImageService = iocRegister('stockImageService', () => {
  const container = iocResolve(ioc.use(injectApiKeyManager))
  return new StockImageService(container.apiKeyManager)
})
