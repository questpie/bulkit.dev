import { appLogger } from '@bulkit/shared/utils/logger'
import { HttpError } from 'elysia-http-error'
import type { StockImageProvider, StockImageSearchResult } from '../types'

const PIXABAY_BASE_URL = 'https://pixabay.com/api/'

export class PixabayProvider implements StockImageProvider {
  constructor(private readonly apiKey: string) {}

  async search(query: string, perPage: number): Promise<StockImageSearchResult[]> {
    const response = await fetch(
      `${PIXABAY_BASE_URL}?q=${encodeURIComponent(query)}&key=${this.apiKey}&per_page=${perPage}&safesearch=true&image_type=photo`
    )

    if (!response.ok) {
      appLogger.error('Failed to search Pixabay images', {
        status: response.status,
        statusText: response.statusText,
      })
      throw HttpError.Internal('Failed to search stock images')
    }

    const data = (await response.json()) as {
      hits: Array<{
        id: number
        webformatURL: string
        largeImageURL: string
        user: string
        tags: string
      }>
    }

    return data.hits.map((photo) => ({
      id: String(photo.id),
      url: photo.largeImageURL,
      thumbnailUrl: photo.webformatURL,
      alt: photo.tags,
      author: photo.user,
    }))
  }
}
