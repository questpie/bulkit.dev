import { appLogger } from '@bulkit/shared/utils/logger'
import { HttpError } from 'elysia-http-error'
import type { StockImageProviderAdapter, StockImageSearchResult } from '../types'

const UNSPLASH_BASE_URL = 'https://api.unsplash.com'

export class UnsplashProvider implements StockImageProviderAdapter {
  constructor(private readonly apiKey: string) {}

  async search(query: string, perPage: number): Promise<StockImageSearchResult[]> {
    const response = await fetch(
      `${UNSPLASH_BASE_URL}/search/photos?query=${encodeURIComponent(
        query
      )}&per_page=${perPage}&client_id=${this.apiKey}`
    )

    if (!response.ok) {
      appLogger.error('Failed to search Unsplash images', {
        status: response.status,
        statusText: response.statusText,
      })
      throw HttpError.Internal('Failed to search stock images')
    }

    const data = (await response.json()) as {
      results: Array<{
        id: string
        urls: {
          raw: string
          regular: string
        }
        alt_description: string
        user: {
          name: string
        }
      }>
    }

    return data.results.map((photo) => ({
      id: photo.id,
      url: photo.urls.raw,
      thumbnailUrl: photo.urls.regular,
      alt: photo.alt_description || 'Unsplash image',
      author: photo.user.name,
    }))
  }
}
