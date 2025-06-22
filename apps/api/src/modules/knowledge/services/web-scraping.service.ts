import type { TransactionLike } from '@bulkit/api/db/db.client'
import { ioc } from '@bulkit/api/ioc'
import type { KnowledgeTemplateType } from '@bulkit/shared/constants/db.constants'
import type { WebScrapingRequest } from '@bulkit/shared/modules/knowledge/knowledge.schemas'

interface ScrapedContent {
  url: string
  title: string
  content: string
  description?: string
  publishedDate?: string
  author?: string
  siteName?: string
  imageUrl?: string
  tags?: string[]
}

interface ScrapeOptions {
  url: string
  extractContent?: boolean
  extractMetadata?: boolean
  maxContentLength?: number
}

export class WebScrapingService {
  async scrapeUrl(opts: ScrapeOptions): Promise<ScrapedContent> {
    const { url, extractContent = true, extractMetadata = true, maxContentLength = 10000 } = opts

    try {
      // Validate URL
      const parsedUrl = new URL(url)
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid URL protocol. Only HTTP and HTTPS are supported.')
      }

      // Fetch the page
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BulkitBot/1.0; +https://bulkit.dev)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          Connection: 'keep-alive',
        },
        // Add timeout
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('text/html')) {
        throw new Error('URL does not point to an HTML page')
      }

      const html = await response.text()

      // Extract content using basic HTML parsing
      const scrapedData = this.parseHtml(html, {
        extractContent,
        extractMetadata,
        maxContentLength,
      })

      return {
        url,
        ...scrapedData,
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to scrape URL: ${error.message}`)
      }
      throw new Error('Unknown error occurred while scraping')
    }
  }

  private parseHtml(
    html: string,
    options: {
      extractContent: boolean
      extractMetadata: boolean
      maxContentLength: number
    }
  ): Omit<ScrapedContent, 'url'> {
    const { extractContent, extractMetadata, maxContentLength } = options

    const result: Omit<ScrapedContent, 'url'> = {
      title: '',
      content: '',
    }

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (titleMatch) {
      result.title = this.cleanText(titleMatch[1])
    }

    // Extract meta description
    if (extractMetadata) {
      const descMatch = html.match(
        /<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"']+)["\'][^>]*>/i
      )
      if (descMatch) {
        result.description = this.cleanText(descMatch[1])
      }

      // Extract Open Graph data
      const ogTitleMatch = html.match(
        /<meta[^>]*property=["\']og:title["\'][^>]*content=["\']([^"']+)["\'][^>]*>/i
      )
      if (ogTitleMatch && !result.title) {
        result.title = this.cleanText(ogTitleMatch[1])
      }

      const ogDescMatch = html.match(
        /<meta[^>]*property=["\']og:description["\'][^>]*content=["\']([^"']+)["\'][^>]*>/i
      )
      if (ogDescMatch && !result.description) {
        result.description = this.cleanText(ogDescMatch[1])
      }

      const ogImageMatch = html.match(
        /<meta[^>]*property=["\']og:image["\'][^>]*content=["\']([^"']+)["\'][^>]*>/i
      )
      if (ogImageMatch) {
        result.imageUrl = ogImageMatch[1]
      }

      const ogSiteMatch = html.match(
        /<meta[^>]*property=["\']og:site_name["\'][^>]*content=["\']([^"']+)["\'][^>]*>/i
      )
      if (ogSiteMatch) {
        result.siteName = this.cleanText(ogSiteMatch[1])
      }

      // Extract author
      const authorMatch = html.match(
        /<meta[^>]*name=["\']author["\'][^>]*content=["\']([^"']+)["\'][^>]*>/i
      )
      if (authorMatch) {
        result.author = this.cleanText(authorMatch[1])
      }

      // Extract keywords as tags
      const keywordsMatch = html.match(
        /<meta[^>]*name=["\']keywords["\'][^>]*content=["\']([^"']+)["\'][^>]*>/i
      )
      if (keywordsMatch) {
        result.tags = keywordsMatch[1]
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
      }
    }

    // Extract main content
    if (extractContent) {
      let content = this.extractMainContent(html)

      // Limit content length
      if (content.length > maxContentLength) {
        content = content.substring(0, maxContentLength) + '...'
      }

      result.content = content
    }

    return result
  }

  private extractMainContent(html: string): string {
    // Remove script and style tags
    let content = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    content = content.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')

    // Try to find main content areas
    const contentSelectors = [
      /<article[^>]*>([\s\S]*?)<\/article>/gi,
      /<main[^>]*>([\s\S]*?)<\/main>/gi,
      /<div[^>]*class=["\'][^"']*content[^"']*["\'][^>]*>([\s\S]*?)<\/div>/gi,
      /<div[^>]*class=["\'][^"']*post[^"']*["\'][^>]*>([\s\S]*?)<\/div>/gi,
      /<div[^>]*class=["\'][^"']*entry[^"']*["\'][^>]*>([\s\S]*?)<\/div>/gi,
    ]

    let extractedContent = ''

    for (const selector of contentSelectors) {
      const matches = content.match(selector)
      if (matches && matches.length > 0) {
        extractedContent = matches.join(' ')
        break
      }
    }

    // If no specific content area found, extract from body
    if (!extractedContent) {
      const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
      if (bodyMatch) {
        extractedContent = bodyMatch[1]
      } else {
        extractedContent = content
      }
    }

    // Remove remaining HTML tags
    extractedContent = extractedContent.replace(/<[^>]*>/g, ' ')

    // Clean up whitespace
    extractedContent = extractedContent.replace(/\s+/g, ' ').trim()

    return extractedContent
  }

  private cleanText(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .trim()
  }

  async scrapeToKnowledge(
    db: TransactionLike,
    request: WebScrapingRequest,
    userId: string,
    organizationId: string
  ): Promise<{
    title: string
    content: string
    templateType: KnowledgeTemplateType
    metadata: any
  }> {
    const scrapedData = await this.scrapeUrl({
      url: request.url,
      extractContent: true,
      extractMetadata: true,
      maxContentLength: request.maxContentLength || 10000,
    })

    // Determine template type based on URL or content
    const templateType = this.determineTemplateType(request.url, scrapedData)

    // Generate markdown content
    const content = this.formatAsMarkdown(scrapedData, request)

    // Build metadata
    const metadata = {
      sourceUrl: request.url,
      scrapedAt: new Date().toISOString(),
      siteName: scrapedData.siteName,
      author: scrapedData.author,
      publishedDate: scrapedData.publishedDate,
      tags: [...(scrapedData.tags || []), ...(request.tags || []), 'web-scraping'],
      category: request.category || 'Web Content',
      imageUrl: scrapedData.imageUrl,
    }

    return {
      title: request.title || scrapedData.title || 'Scraped Content',
      content,
      templateType,
      metadata,
    }
  }

  private determineTemplateType(url: string, scrapedData: ScrapedContent): KnowledgeTemplateType {
    const urlLower = url.toLowerCase()
    const titleLower = scrapedData.title.toLowerCase()
    const contentLower = scrapedData.content.toLowerCase()

    // Check for specific patterns
    if (urlLower.includes('blog') || urlLower.includes('news') || urlLower.includes('article')) {
      return 'research_summary'
    }

    if (titleLower.includes('competitor') || contentLower.includes('competitor analysis')) {
      return 'competitor_analysis'
    }

    if (titleLower.includes('market') || contentLower.includes('market research')) {
      return 'market_research'
    }

    if (titleLower.includes('brand') || titleLower.includes('guidelines')) {
      return 'brand_guidelines'
    }

    if (titleLower.includes('process') || titleLower.includes('workflow')) {
      return 'process_documentation'
    }

    // Default to web scraping result
    return 'web_scraping_result'
  }

  private formatAsMarkdown(scrapedData: ScrapedContent, request: WebScrapingRequest): string {
    let markdown = `# ${scrapedData.title}\n\n`

    // Add metadata section
    markdown += `## Source Information\n\n`
    markdown += `- **URL**: [${scrapedData.url}](${scrapedData.url})\n`

    if (scrapedData.siteName) {
      markdown += `- **Site**: ${scrapedData.siteName}\n`
    }

    if (scrapedData.author) {
      markdown += `- **Author**: ${scrapedData.author}\n`
    }

    if (scrapedData.publishedDate) {
      markdown += `- **Published**: ${scrapedData.publishedDate}\n`
    }

    markdown += `- **Scraped**: ${new Date().toLocaleDateString()}\n\n`

    // Add description if available
    if (scrapedData.description) {
      markdown += `## Summary\n\n${scrapedData.description}\n\n`
    }

    // Add main content
    markdown += `## Content\n\n${scrapedData.content}\n\n`

    // Add tags if available
    if (scrapedData.tags && scrapedData.tags.length > 0) {
      markdown += `## Tags\n\n${scrapedData.tags.map((tag) => `#${tag}`).join(' ')}\n\n`
    }

    // Add custom notes section if provided
    if (request.notes) {
      markdown += `## Notes\n\n${request.notes}\n\n`
    }

    return markdown
  }

  // Validate if URL is scrapeable (avoid potential security issues)
  validateUrl(url: string): { valid: boolean; error?: string } {
    try {
      const parsedUrl = new URL(url)

      // Check protocol
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return { valid: false, error: 'Only HTTP and HTTPS URLs are supported' }
      }

      // Check for localhost/private IPs (basic security)
      const hostname = parsedUrl.hostname.toLowerCase()
      if (
        hostname === 'localhost' ||
        hostname.startsWith('127.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.')
      ) {
        return { valid: false, error: 'Cannot scrape local or private network URLs' }
      }

      return { valid: true }
    } catch (error) {
      return { valid: false, error: 'Invalid URL format' }
    }
  }
}

export const injectWebScrapingService = ioc.register('webScrapingService', () => {
  return new WebScrapingService()
})
