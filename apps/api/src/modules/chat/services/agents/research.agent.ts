import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { ioc } from '@bulkit/api/ioc'
import { injectKnowledgeService } from '@bulkit/api/modules/knowledge/services/knowledge.service'
import { injectDatabase } from '@bulkit/api/db/db.client'
import type { AgentContext } from '../langchain-coordinator.service'
import { createAgent } from '@bulkit/api/modules/chat/services/agents/utils/create-agent'
import type { DynamicStructuredTool } from '@langchain/core/tools'

const createKnowledgeTools = (context: AgentContext): DynamicStructuredTool[] => [
  tool(
    async (input) => {
      try {
        const { knowledgeService, db } = ioc.resolve([injectKnowledgeService, injectDatabase])

        const results = await knowledgeService.list(db, {
          organizationId: context.organizationId,
          query: {
            search: input.query,
            templateType: input.templateType,
            limit: input.limit,
            page: 1,
          },
        })

        return JSON.stringify({
          success: true,
          results: results.data.map((doc) => ({
            id: doc.id,
            title: doc.title,
            excerpt: doc.excerpt,
            templateType: doc.templateType,
            status: doc.status,
            version: doc.version,
            tags: doc.metadata?.tags || [],
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
          })),
          total: results.pagination?.total || results.data.length,
          query: input.query,
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return JSON.stringify({
          success: false,
          error: `Failed to search knowledge: ${errorMessage}`,
        })
      }
    },
    {
      name: 'search_knowledge',
      description: 'Search through the organization knowledge base',
      schema: z.object({
        query: z.string().describe('Search query for knowledge documents'),
        templateType: z
          .enum([
            'general',
            'brand_guidelines',
            'competitor_analysis',
            'market_research',
            'content_strategy',
            'campaign_brief',
            'product_info',
            'style_guide',
            'process_documentation',
            'meeting_notes',
            'research_summary',
            'web_scraping_result',
          ])
          .optional()
          .describe('Filter by specific knowledge template type'),
        limit: z.number().min(1).max(20).default(5).describe('Maximum number of results to return'),
      }),
    }
  ),

  tool(
    async (input) => {
      try {
        const { knowledgeService, db } = ioc.resolve([injectKnowledgeService, injectDatabase])

        const document = await knowledgeService.getById(db, {
          organizationId: context.organizationId,
          knowledgeId: input.documentId,
        })

        if (!document) {
          return JSON.stringify({
            success: false,
            error: 'Knowledge document not found',
          })
        }

        const result: any = {
          success: true,
          document: {
            id: document.id,
            title: document.title,
            excerpt: document.excerpt,
            templateType: document.templateType,
            status: document.status,
            version: document.version,
            metadata: document.metadata,
            tags: document.metadata?.tags || [],
            createdAt: document.createdAt,
            updatedAt: document.updatedAt,
          },
        }

        if (input.includeContent) {
          result.document.content = document.content
        }

        return JSON.stringify(result)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return JSON.stringify({
          success: false,
          error: `Failed to get knowledge document: ${errorMessage}`,
        })
      }
    },
    {
      name: 'get_knowledge_document',
      description: 'Retrieve a specific knowledge document by ID',
      schema: z.object({
        documentId: z.string().describe('ID of the knowledge document to retrieve'),
        includeContent: z.boolean().default(true).describe('Whether to include the full content'),
      }),
    }
  ),

  tool(
    async (input) => {
      try {
        const { knowledgeService, db } = ioc.resolve([injectKnowledgeService, injectDatabase])

        const document = await knowledgeService.create(db, {
          organizationId: context.organizationId,
          userId: context.userId,
          data: {
            title: input.title,
            content: input.content,
            templateType: input.templateType,
            status: input.status,
            metadata: {
              category: input.category,
              tags: input.tags || [],
            },
            mentions: [],
          },
        })

        return JSON.stringify({
          success: true,
          document: {
            id: document.id,
            title: document.title,
            templateType: document.templateType,
            status: document.status,
            createdAt: document.createdAt,
          },
          message: `Created knowledge document "${document.title}"`,
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return JSON.stringify({
          success: false,
          error: `Failed to create knowledge document: ${errorMessage}`,
        })
      }
    },
    {
      name: 'create_knowledge_document',
      description: 'Create a new knowledge document',
      schema: z.object({
        title: z.string().describe('Title of the knowledge document'),
        content: z.string().describe('Content of the knowledge document'),
        templateType: z
          .enum([
            'general',
            'brand_guidelines',
            'competitor_analysis',
            'market_research',
            'content_strategy',
            'campaign_brief',
            'product_info',
            'style_guide',
            'process_documentation',
            'meeting_notes',
            'research_summary',
            'web_scraping_result',
          ])
          .default('general')
          .describe('Type of knowledge document'),
        category: z.string().optional().describe('Category for the document'),
        tags: z.array(z.string()).optional().describe('Tags for the document'),
        status: z
          .enum(['draft', 'published', 'archived'])
          .default('draft')
          .describe('Status of the document'),
      }),
    }
  ),

  tool(
    async (input) => {
      try {
        const { knowledgeService, db } = ioc.resolve([injectKnowledgeService, injectDatabase])

        const existingDoc = await knowledgeService.getById(db, {
          organizationId: context.organizationId,
          knowledgeId: input.documentId,
        })

        if (!existingDoc) {
          return JSON.stringify({
            success: false,
            error: 'Knowledge document not found',
          })
        }

        const updates: any = { ...existingDoc }
        if (input.title !== undefined) updates.title = input.title
        if (input.content !== undefined) updates.content = input.content
        if (input.status !== undefined) updates.status = input.status
        if (input.tags !== undefined) {
          updates.metadata = { ...updates.metadata, tags: input.tags }
        }

        const updatedDoc = await knowledgeService.update(db, {
          organizationId: context.organizationId,
          userId: context.userId,
          knowledgeId: input.documentId,
          data: updates,
        })

        return JSON.stringify({
          success: true,
          document: {
            id: updatedDoc.id,
            title: updatedDoc.title,
            status: updatedDoc.status,
            updatedAt: updatedDoc.updatedAt,
          },
          message: `Updated knowledge document "${updatedDoc.title}"`,
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return JSON.stringify({
          success: false,
          error: `Failed to update knowledge document: ${errorMessage}`,
        })
      }
    },
    {
      name: 'update_knowledge_document',
      description: 'Update an existing knowledge document',
      schema: z.object({
        documentId: z.string().describe('ID of the document to update'),
        title: z.string().optional().describe('New title for the document'),
        content: z.string().optional().describe('New content for the document'),
        status: z
          .enum(['draft', 'published', 'archived'])
          .optional()
          .describe('New status for the document'),
        tags: z.array(z.string()).optional().describe('New tags for the document'),
      }),
    }
  ),
]

export const knowledgeManagement = createAgent('knowledge', (context) => ({
  name: 'Knowledge Manager',
  description:
    'Knowledge management and information organization with document creation and retrieval capabilities',
  capabilities: [
    'knowledge_search',
    'information_retrieval',
    'research',
    'documentation',
    'knowledge_creation',
  ],
  systemPrompt: `You are a knowledge management specialist focused on organizing, storing, and retrieving information effectively.
Your role is to help users manage their knowledge base and access information efficiently.

Key responsibilities:
- Search and retrieve knowledge documents from the organization's knowledge base
- Create and organize new knowledge documents
- Update and maintain existing documentation
- Help structure and categorize information for better accessibility
- Provide insights based on the organization's stored knowledge

You excel at understanding information relationships, maintaining document organization, and ensuring knowledge is easily discoverable and actionable.`,
  tools: createKnowledgeTools(context),
}))
