import { and, asc, eq, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'

import type { TransactionLike } from '@bulkit/api/db/db.client'
import {
  aiTextProvidersTable,
  chatConversationsTable,
  chatMessagesTable,
} from '@bulkit/api/db/db.schema'
import { ioc } from '@bulkit/api/ioc'
import { pusher } from '@bulkit/api/pusher/pusher.client'
import { CHAT_CHANNELS, CHAT_EVENTS } from '@bulkit/shared/modules/chat/chat.constants'
import type {
  ChatMessage,
  Mention,
  PageContext,
  SmartReference,
} from '@bulkit/shared/modules/chat/chat.schemas'
import { injectLangGraphAgentService, type LangGraphAgentService } from './langgraph-agent.service'
import type { AgentDefinition } from '@bulkit/api/modules/chat/services/agents/utils/create-agent'
import {
  type OrganizationsService,
  injectOrganizationService,
} from '@bulkit/api/modules/organizations/services/organizations.service'

export interface AgentContext {
  conversationId: string
  organizationId: string
  userId: string
  pageContext?: PageContext | null
  referencedEntities: SmartReference[]
  mentionedAgents: Mention[]
  conversationHistory: ChatMessage[]
}

export class LangChainCoordinatorService {
  constructor(
    private readonly langGraphAgentService: LangGraphAgentService,
    private readonly organizationsService: OrganizationsService
  ) {}

  async processUserMessage(
    db: TransactionLike,
    opts: {
      conversationId: string
      userMessage: ChatMessage
      pageContext?: PageContext | null
      organizationId: string
    }
  ): Promise<void> {
    try {
      const conversationHistory = await this.getConversationHistory(db, opts.conversationId)
      const context: AgentContext = {
        conversationId: opts.conversationId,
        organizationId: opts.organizationId,
        userId: opts.userMessage.userId!,
        pageContext: opts.pageContext,
        referencedEntities: opts.userMessage.references || [],
        mentionedAgents: opts.userMessage.mentions?.filter((m) => m.type === 'agent') || [],
        conversationHistory,
      }

      const provider = await this.getAIProvider(db, opts.organizationId)

      // Send typing indicator (using first agent type as representative)
      await this.sendTypingIndicator(opts.conversationId, 'supervisor', 'supervisor', true)

      // Use multi-agent conversation
      const result = await this.langGraphAgentService.runMultiAgentConversation(
        opts.userMessage.content,
        context,
        provider
      )

      // Send the final response
      await this.sendAgentMessage(
        db,
        opts.conversationId,
        result.text,
        opts.organizationId,
        result.toolCalls
      )

      // Stop typing indicator
      await this.sendTypingIndicator(opts.conversationId, 'supervisor', 'supervisor', false)
    } catch (error) {
      console.error('Error processing user message:', error)
      await this.sendErrorMessage(
        db,
        opts.conversationId,
        'Sorry, I encountered an error processing your message. Please try again.',
        opts.organizationId
      )
    }
  }

  async *processUserMessageStream(
    db: TransactionLike,
    opts: {
      conversationId: string
      userMessage: ChatMessage
      pageContext?: PageContext | null
      organizationId: string
    }
  ): AsyncGenerator<string, void, unknown> {
    try {
      const conversationHistory = await this.getConversationHistory(db, opts.conversationId)
      const context: AgentContext = {
        conversationId: opts.conversationId,
        organizationId: opts.organizationId,
        userId: opts.userMessage.userId!,
        pageContext: opts.pageContext,
        referencedEntities: opts.userMessage.references || [],
        mentionedAgents: opts.userMessage.mentions?.filter((m) => m.type === 'agent') || [],
        conversationHistory,
      }

      const provider = await this.getAIProvider(db, opts.organizationId)

      // Create streaming message
      const messageId = nanoid()
      await this.createStreamingMessage(db, opts.conversationId, messageId, 'supervisor')

      // Stream the multi-agent conversation
      const streamResult = await this.langGraphAgentService.streamMultiAgentConversation(
        opts.userMessage.content,
        context,
        provider
      )

      let fullContent = ''
      let currentAgentName = 'supervisor'

      for await (const chunk of streamResult.stream) {
        fullContent = chunk.fullContent

        // Update current agent name if changed
        if (chunk.currentAgent) {
          currentAgentName = chunk.currentAgent
        }

        // Send chunk via Pusher
        await pusher.trigger(
          CHAT_CHANNELS.CONVERSATION(opts.conversationId),
          CHAT_EVENTS.MESSAGE_STREAMING,
          {
            messageId,
            content: fullContent,
            isComplete: chunk.isComplete,
            currentAgent: currentAgentName,
          }
        )

        // Yield Server-Sent Events formatted data
        yield `data: ${JSON.stringify({
          content: chunk.content,
          currentAgent: currentAgentName,
          isComplete: chunk.isComplete,
        })}\n\n`

        if (chunk.isComplete) {
          break
        }
      }

      // Finalize the message
      await this.finalizeStreamingMessage(db, opts.conversationId, messageId, fullContent)

      // Send final done event
      yield 'data: [DONE]\n\n'
    } catch (error) {
      console.error('Streaming error:', error)
      // Yield error event
      yield `data: ${JSON.stringify({
        error: 'An error occurred while processing your message',
        isComplete: true,
      })}\n\n`
    }
  }

  private async getAIProvider(db: TransactionLike, organizationId: string) {
    // Get the default general-purpose AI provider
    const provider = await db
      .select()
      .from(aiTextProvidersTable)
      .where(
        and(
          eq(aiTextProvidersTable.isActive, true),
          // Use array contains operator to check if 'general-purpose' is in isDefaultFor array
          sql`'general-purpose' = ANY(${aiTextProvidersTable.isDefaultFor})`
        )
      )
      .then((res: any) => res[0])

    if (!provider) {
      // Fallback to any active provider
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

  private async getConversationHistory(
    db: TransactionLike,
    conversationId: string
  ): Promise<ChatMessage[]> {
    const messages = await db
      .select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.conversationId, conversationId))
      .orderBy(asc(chatMessagesTable.createdAt))
      .limit(20)

    return messages as ChatMessage[]
  }

  private async sendAgentMessage(
    db: TransactionLike,
    conversationId: string,
    content: string,
    organizationId: string,
    toolCalls?: any[]
  ): Promise<void> {
    const userId = await this.organizationsService.ensureAIAssistant(db, organizationId)

    const message = await db
      .insert(chatMessagesTable)
      .values({
        id: nanoid(),
        conversationId,
        content,
        messageType: 'ai',
        toolCalls: toolCalls || [],
        userId,
        mentions: [],
        references: [],
        isStreaming: false,
        isError: false,
      })
      .returning()
      .then((res: any) => res[0])

    await db
      .update(chatConversationsTable)
      .set({
        lastMessageAt: message.createdAt,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(chatConversationsTable.id, conversationId))

    await pusher.trigger(CHAT_CHANNELS.CONVERSATION(conversationId), CHAT_EVENTS.MESSAGE_CREATED, {
      message,
    })
  }

  private async sendErrorMessage(
    db: TransactionLike,
    conversationId: string,
    errorText: string,
    organizationId: string
  ): Promise<void> {
    const userId = await this.organizationsService.ensureAIAssistant(db, organizationId)

    const message = await db
      .insert(chatMessagesTable)
      .values({
        id: nanoid(),
        conversationId,
        content: errorText,
        messageType: 'system',
        userId,
        mentions: [],
        references: [],
        isStreaming: false,
        isError: true,
      })
      .returning()
      .then((res: any) => res[0])

    await pusher.trigger(CHAT_CHANNELS.CONVERSATION(conversationId), CHAT_EVENTS.MESSAGE_CREATED, {
      message,
    })
  }

  private async createStreamingMessage(
    db: TransactionLike,
    conversationId: string,
    messageId: string,
    organizationId: string
  ): Promise<void> {
    const userId = await this.organizationsService.ensureAIAssistant(db, organizationId)

    await db.insert(chatMessagesTable).values({
      id: messageId,
      conversationId,
      content: '',
      messageType: 'ai',
      userId,
      mentions: [],
      references: [],
      isStreaming: true,
      isError: false,
    })
  }

  private async finalizeStreamingMessage(
    db: TransactionLike,
    conversationId: string,
    messageId: string,
    finalContent: string
  ): Promise<void> {
    await db
      .update(chatMessagesTable)
      .set({
        content: finalContent,
        isStreaming: false,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(chatMessagesTable.id, messageId))

    await db
      .update(chatConversationsTable)
      .set({
        lastMessageAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(chatConversationsTable.id, conversationId))

    await pusher.trigger(
      CHAT_CHANNELS.CONVERSATION(conversationId),
      CHAT_EVENTS.MESSAGE_STREAMING,
      {
        messageId,
        content: finalContent,
        isComplete: true,
      }
    )
  }

  private async sendTypingIndicator(
    conversationId: string,
    agentId: string,
    agentName: string,
    isTyping: boolean
  ): Promise<void> {
    await pusher.trigger(CHAT_CHANNELS.CONVERSATION(conversationId), CHAT_EVENTS.AGENT_TYPING, {
      agentId,
      agentName,
      conversationId,
      isTyping,
      timestamp: new Date().toISOString(),
    })
  }
}

export const injectLangChainCoordinatorService = ioc.register(
  'langChainCoordinatorService',
  (ioc) => {
    const { langGraphAgentService, organizationsService } = ioc.resolve([
      injectLangGraphAgentService,
      injectOrganizationService,
    ])
    return new LangChainCoordinatorService(langGraphAgentService, organizationsService)
  }
)
