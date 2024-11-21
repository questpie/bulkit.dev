export interface StockImageSearchResult {
  id: string
  url: string
  thumbnailUrl: string
  alt: string
  author: string
}

export interface StockImageProviderAdapter {
  search(query: string, perPage: number): Promise<StockImageSearchResult[]>
}
