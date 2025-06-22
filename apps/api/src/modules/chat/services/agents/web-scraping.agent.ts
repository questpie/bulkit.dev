import { tool } from '@langchain/core/tools'
import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { z } from 'zod'
import type { AgentContext } from '../langchain-coordinator.service'
import { ioc } from '@bulkit/api/ioc'
import { injectKnowledgeService } from '@bulkit/api/modules/knowledge/services/knowledge.service'
import { injectDatabase } from '@bulkit/api/db/db.client'
import { createAgent } from '@bulkit/api/modules/chat/services/agents/utils/create-agent'
import type { DynamicStructuredTool } from '@langchain/core/tools'

const createWebScrapingTools = (context: AgentContext): DynamicStructuredTool[] => [
  tool(
    async (input) => {
      try {
        // Validate URL security
        const url = new URL(input.url)
        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error('Only HTTP and HTTPS URLs are supported')
        }

        // Load web content using LangChain's CheerioWebBaseLoader
        const loader = new CheerioWebBaseLoader(input.url, {
          selector: input.selector || 'body',
        })

        const docs = await loader.load()

        if (docs.length === 0) {
          throw new Error('No content could be extracted from the URL')
        }

        const document = docs[0]

        // Split text into manageable chunks using LangChain's text splitter
        const splitter = new RecursiveCharacterTextSplitter({
          chunkSize: input.maxChunkSize || 4000,
          chunkOverlap: 200,
        })

        const chunks = await splitter.splitDocuments(docs)

        // Combine chunks back into a single content (or use first chunk if too long)
        let content = chunks.map((chunk) => chunk.pageContent).join('\n\n')

        // If content is too long, use first few chunks
        if (content.length > 10000) {
          content =
            chunks
              .slice(0, 3)
              .map((chunk) => chunk.pageContent)
              .join('\n\n') + '\n\n[Content truncated...]'
        }

        const result: any = {
          url: input.url,
          title: document?.metadata?.title || input.title || 'Scraped Content',
          content,
          metadata: document?.metadata || {},
          chunks: chunks.length,
          success: true,
        }

        // Create knowledge document
        if (input.createKnowledge) {
          const { knowledgeService, db } = ioc.resolve([injectKnowledgeService, injectDatabase])

          const knowledge = await knowledgeService.create(db, {
            organizationId: context.organizationId,
            userId: context.userId,
            data: {
              title: result.title,
              content: `# ${result.title}\n\n**Source:** [${input.url}](${input.url})\n\n${content}`,
              templateType: 'web_scraping_result',
              status: 'draft',
              metadata: {
                sourceUrl: input.url,
                category: input.category || 'Web Content',
                tags: [...(input.tags || []), 'web-scraping'],
                ...document?.metadata,
              },
              mentions: [],
            },
          })

          result.knowledgeId = knowledge.id
        }

        return JSON.stringify(result)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        return JSON.stringify({
          success: false,
          error: `Failed to scrape web content: ${errorMessage}`,
        })
      }
    },
    {
      name: 'scrape_web_content',
      description: 'Scrape content from a web page and optionally create knowledge documents',
      schema: z.object({
        url: z.string().url().describe('The URL to scrape'),
        createKnowledge: z
          .boolean()
          .default(true)
          .describe('Whether to create a knowledge document from the scraped content'),
        title: z.string().optional().describe('Custom title for the knowledge document'),
        category: z.string().optional().describe('Category for the knowledge document'),
        tags: z.array(z.string()).optional().describe('Tags for the knowledge document'),
        maxChunkSize: z
          .number()
          .optional()
          .describe('Maximum size for text chunks (default: 4000)'),
        selector: z
          .string()
          .optional()
          .describe('CSS selector for content extraction (default: body)'),
      }),
    }
  ),
]

export const webScrapingAgent = createAgent('web_scraping', (context) => ({
  name: 'Web Scraping Specialist',
  description: 'Web content extraction, scraping, processing, and analysis with knowledge creation',
  capabilities: [
    'web_scraping',
    'content_extraction',
    'text_processing',
    'content_analysis',
    'knowledge_creation',
  ],
  systemPrompt: `You are a web scraping specialist focused on extracting and processing web content.
Your expertise includes scraping websites, processing text content, and analyzing information.

Key responsibilities:
- Extract content from web pages efficiently and safely
- Process and analyze scraped content
- Create knowledge documents from extracted information
- Analyze content structure, sentiment, and readability
- Handle text processing and chunking operations

You follow best practices for web scraping and respect robots.txt and rate limits.`,
  tools: createWebScrapingTools(context),
}))
