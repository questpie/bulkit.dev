import { nanoid } from 'nanoid'
import { eq, and, asc } from 'drizzle-orm'
import type { TransactionLike } from '@bulkit/api/db/db.client'
import { commentsTable, type CommentMention } from '@bulkit/api/db/db.schema'
import { ioc } from '@bulkit/api/ioc'
import { injectLangGraphAgentService, type LangGraphAgentService } from './langgraph-agent.service'
import { injectDatabase } from '@bulkit/api/db/db.client'
import { aiTextProvidersTable } from '@bulkit/api/db/db.schema'
import { sql } from 'drizzle-orm'
import type { AgentContext } from './langchain-coordinator.service'

export interface CommentMentionContext {
  commentId: string
  entityId: string
  entityType: string
  originalComment: string
  organizationId: string
  userId: string
  mentionedAgents: CommentMention[]
}

export class CommentMentionService {
  constructor(private readonly langGraphAgentService: LangGraphAgentService) {}

  /**
   * Handle agent mentions in comments by triggering LangGraph agents
   */
  async handleAgentMentions(db: TransactionLike, context: CommentMentionContext): Promise<void> {
    try {
      // Get mentioned agent types
      const mentionedAgentTypes = this.extractAgentTypes(context.mentionedAgents)

      if (mentionedAgentTypes.length === 0) {
        return // No valid agent mentions
      }

      // Get AI provider
      const provider = await this.getAIProvider(db, context.organizationId)

      // Create special chat context for the comment
      const chatContext: AgentContext = {
        conversationId: `comment-${context.commentId}`,
        organizationId: context.organizationId,
        userId: context.userId,
        pageContext: {
          path: `/${context.entityType}/${context.entityId}`,
          entityType: context.entityType,
          entityId: context.entityId,
        },
        referencedEntities: [
          {
            id: context.entityId,
            type: context.entityType as any,
            title: `${context.entityType} ${context.entityId}`,
            startIndex: 0,
            endIndex: 0,
          },
        ],
        mentionedAgents: context.mentionedAgents.map((m) => ({
          type: 'agent' as const,
          name: m.name,
          startIndex: m.startIndex,
          endIndex: m.endIndex,
        })),
        conversationHistory: [],
      }

      // Create user message with comment context
      const userMessage = this.buildUserMessageFromComment(context)

      // Process with LangGraph agents (includes summary node)
      const result = await this.langGraphAgentService.runCommentConversation(
        mentionedAgentTypes,
        userMessage,
        chatContext,
        provider
      )

      // Create AI comment response
      await this.createAICommentResponse(db, context, result)
    } catch (error) {
      console.error('Error handling agent mentions:', error)
      // Create error comment response
      await this.createErrorCommentResponse(db, context)
    }
  }

  /**
   * Extract valid agent types from mentions
   */
  private extractAgentTypes(mentions: CommentMention[]): ChatAgentType[] {
    const agentTypeMap: Record<string, ChatAgentType> = {
      supervisor: 'supervisor',
      web: 'supervisor', // Web scraping maps to supervisor
      post: 'post_management',
      posts: 'post_management',
      content: 'content_creation',
      create: 'content_creation',
      research: 'research',
      knowledge: 'research',
      task: 'task_management',
      tasks: 'task_management',
      analytics: 'analytics',
      schedule: 'scheduling',
      scheduling: 'scheduling',
    }

    const agentTypes: ChatAgentType[] = []

    for (const mention of mentions) {
      if (mention.type === 'agent') {
        const normalizedName = mention.name.toLowerCase()

        // Check direct matches
        if (agentTypeMap[normalizedName]) {
          agentTypes.push(agentTypeMap[normalizedName])
          continue
        }

        // Check partial matches
        for (const [key, agentType] of Object.entries(agentTypeMap)) {
          if (normalizedName.includes(key) || key.includes(normalizedName)) {
            agentTypes.push(agentType)
            break
          }
        }
      }
    }

    // Remove duplicates and default to coordinator if none found
    const uniqueTypes = [...new Set(agentTypes)]
    return uniqueTypes.length > 0 ? uniqueTypes : ['coordinator']
  }

  /**
   * Build user message with comment context
   */
  private buildUserMessageFromComment(context: CommentMentionContext): string {
    return `User commented on ${context.entityType} ${context.entityId}:

"${context.originalComment}"

Please help with this comment. Based on what the user is asking, use your tools to take any necessary actions and then provide a helpful response.`
  }

  /**
   * Create AI comment response
   */
  private async createAICommentResponse(
    db: TransactionLike,
    context: CommentMentionContext,
    result: { text: string; toolCalls: any[]; finalAgent: string }
  ): Promise<void> {
    await db.insert(commentsTable).values({
      id: nanoid(),
      entityId: context.entityId,
      entityType: context.entityType as any,
      userId: context.userId, // Keep original user for tracking
      organizationId: context.organizationId,
      content: result.text,
      mentions: [], // AI responses don't mention others
      isAiResponse: true,
      parentCommentId: context.commentId,
      threadDepth: 1,
    })
  }

  /**
   * Create error comment response
   */
  private async createErrorCommentResponse(
    db: TransactionLike,
    context: CommentMentionContext
  ): Promise<void> {
    await db.insert(commentsTable).values({
      id: nanoid(),
      entityId: context.entityId,
      entityType: context.entityType as any,
      userId: context.userId,
      organizationId: context.organizationId,
      content:
        'I encountered an error processing your request. Please try again or contact support if the issue persists.',
      mentions: [],
      isAiResponse: true,
      parentCommentId: context.commentId,
      threadDepth: 1,
    })
  }

  /**
   * Get AI provider for the organization
   */
  private async getAIProvider(db: TransactionLike, organizationId: string) {
    const provider = await db
      .select()
      .from(aiTextProvidersTable)
      .where(
        and(
          eq(aiTextProvidersTable.isActive, true),
          sql`'general-purpose' = ANY(${aiTextProvidersTable.isDefaultFor})`
        )
      )
      .then((res: any) => res[0])

    if (!provider) {
      const fallbackProvider = await db
        .select()
        .from(aiTextProvidersTable)
        .where(eq(aiTextProvidersTable.isActive, true))
        .then((res: any) => res[0])

      if (!fallbackProvider) {
        throw new Error('No active AI providers found')
      }

      return fallbackProvider
    }

    return provider
  }
}

export const injectCommentMentionService = ioc.register('commentMentionService', (ioc) => {
  const { langGraphAgentService } = ioc.resolve([injectLangGraphAgentService])
  return new CommentMentionService(langGraphAgentService)
})
