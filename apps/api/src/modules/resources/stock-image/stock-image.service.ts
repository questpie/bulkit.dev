import { envApi } from '@bulkit/api/envApi'
import { HttpError } from 'elysia-http-error'
import { PixabayProvider } from './providers/pixabay.provider'
import type { StockImageProvider } from './types'
import { iocRegister } from '@bulkit/api/ioc'

export class StockImageService {
  private providers: Map<string, StockImageProvider> = new Map()

  constructor() {
    if (envApi.PIXABAY_API_KEY) {
      this.providers.set('pixabay', new PixabayProvider())
    }
  }

  async search(provider: string, query: string, perPage: number) {
    const service = this.providers.get(provider)
    if (!service) {
      throw HttpError.BadRequest(`Unsupported stock image provider: ${provider}`)
    }

    return service.search(query, perPage)
  }

  getAvailableProviders() {
    return Array.from(this.providers.keys())
  }
}

export const injectStockImageService = iocRegister(
  'stockImageService',
  () => new StockImageService()
)
