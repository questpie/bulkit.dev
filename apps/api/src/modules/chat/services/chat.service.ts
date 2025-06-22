import {
  chatConversationsTable,
  chatMessageReactionsTable,
  chatMessagesTable,
  labelsTable,
  postsTable,
  tasksTable,
  usersTable,
} from '@bulkit/api/db/db.schema'
import { ioc } from '@bulkit/api/ioc'
import { pusher } from '@bulkit/api/pusher/pusher.client'
import { CHAT_CHANNELS, CHAT_CONFIG, CHAT_EVENTS } from '@bulkit/shared/modules/chat/chat.constants'
import type {
  ChatConversation,
  ChatConversationWithMessages,
  ChatMessage,
  PageContext,
  ReactionType,
  SearchReferenceResult,
  SearchReferences,
  SendMessage,
  SmartReference,
  UpdateConversation,
} from '@bulkit/shared/modules/chat/chat.schemas'
import { and, asc, count, desc, eq, gt, ilike, lt, or, type SQL } from 'drizzle-orm'
import { HttpError } from 'elysia-http-error'
import { nanoid } from 'nanoid'
import type { TransactionLike } from '@bulkit/api/db/db.client'
import {
  injectLangChainCoordinatorService,
  type LangChainCoordinatorService,
} from '@bulkit/api/modules/chat/services/langchain-coordinator.service'
import type { PaginatedResponse } from '@bulkit/shared/schemas/misc'

export class ChatService {
  constructor(private readonly coordinator: LangChainCoordinatorService) {}

  async getUserConversations(
    db: TransactionLike,
    opts: {
      userId: string
      organizationId: string
      limit?: number
      offset?: number
    }
  ): Promise<PaginatedResponse<ChatConversation>> {
    const limit = Math.min(opts.limit || 20, 50)

    const conversations = await db
      .select({
        id: chatConversationsTable.id,
        title: chatConversationsTable.title,
        userId: chatConversationsTable.userId,
        organizationId: chatConversationsTable.organizationId,
        currentPageContext: chatConversationsTable.currentPageContext,
        pinnedResources: chatConversationsTable.pinnedResources,
        isArchived: chatConversationsTable.isArchived,
        lastMessageAt: chatConversationsTable.lastMessageAt,
        createdAt: chatConversationsTable.createdAt,
        updatedAt: chatConversationsTable.updatedAt,
      })
      .from(chatConversationsTable)
      .where(
        and(
          eq(chatConversationsTable.userId, opts.userId),
          eq(chatConversationsTable.organizationId, opts.organizationId),
          eq(chatConversationsTable.isArchived, false)
        )
      )
      .orderBy(desc(chatConversationsTable.lastMessageAt))
      .limit(limit)
      .offset(opts.offset || 0)

    const totalCount = await db
      .select({ count: count() })
      .from(chatConversationsTable)
      .where(
        and(
          eq(chatConversationsTable.userId, opts.userId),
          eq(chatConversationsTable.organizationId, opts.organizationId),
          eq(chatConversationsTable.isArchived, false)
        )
      )
      .then((res) => res[0]?.count || 0)

    return {
      items: conversations,
      nextCursor:
        (opts.offset || 0) + conversations.length < totalCount
          ? (opts.offset || 0) + conversations.length
          : null,
      total: totalCount,
    }
  }

  async createConversation(
    db: TransactionLike,
    opts: {
      userId: string
      organizationId: string
      title?: string
      currentPageContext?: PageContext
    }
  ): Promise<ChatConversation> {
    const conversation = await db
      .insert(chatConversationsTable)
      .values({
        id: nanoid(),
        title: opts.title || 'New Conversation',
        userId: opts.userId,
        organizationId: opts.organizationId,
        currentPageContext: opts.currentPageContext,
        pinnedResources: [],
        isArchived: false,
      })
      .returning()
      .then((res) => res[0]!)

    // Notify via Pusher
    await pusher.trigger(
      CHAT_CHANNELS.USER_CONVERSATIONS(opts.userId),
      CHAT_EVENTS.CONVERSATION_UPDATED,
      { conversation }
    )

    return conversation
  }

  async getConversationWithMessages(
    db: TransactionLike,
    opts: {
      conversationId: string
      userId: string
      organizationId: string
      limit?: number
    }
  ): Promise<ChatConversationWithMessages> {
    // Get conversation
    const conversation = await db
      .select()
      .from(chatConversationsTable)
      .where(
        and(
          eq(chatConversationsTable.id, opts.conversationId),
          eq(chatConversationsTable.userId, opts.userId),
          eq(chatConversationsTable.organizationId, opts.organizationId)
        )
      )
      .then((res) => res[0])

    if (!conversation) {
      throw HttpError.NotFound('Conversation not found')
    }

    // Get messages
    const limit = Math.min(opts.limit || CHAT_CONFIG.MESSAGE_PAGINATION_LIMIT, 100)
    const messages = await db
      .select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.conversationId, opts.conversationId))
      .orderBy(asc(chatMessagesTable.createdAt))
      .limit(limit)

    const messageCount = await db
      .select({ count: count() })
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.conversationId, opts.conversationId))
      .then((res) => res[0]?.count || 0)

    return {
      ...conversation,
      messages: messages as ChatMessage[],
      messageCount,
    } as ChatConversationWithMessages
  }

  async updateConversation(
    db: TransactionLike,
    opts: {
      conversationId: string
      userId: string
      organizationId: string
    } & UpdateConversation
  ): Promise<ChatConversation> {
    const conversation = await db
      .update(chatConversationsTable)
      .set({
        ...(opts.title && { title: opts.title }),
        currentPageContext: opts.currentPageContext,
        pinnedResources: opts.pinnedResources || [],
        isArchived: opts.isArchived,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(chatConversationsTable.id, opts.conversationId),
          eq(chatConversationsTable.userId, opts.userId),
          eq(chatConversationsTable.organizationId, opts.organizationId)
        )
      )
      .returning()
      .then((res) => res[0])

    if (!conversation) {
      throw HttpError.NotFound('Conversation not found')
    }

    // Notify via Pusher
    await pusher.trigger(
      CHAT_CHANNELS.CONVERSATION(opts.conversationId),
      CHAT_EVENTS.CONVERSATION_UPDATED,
      { conversation }
    )

    return conversation as ChatConversation
  }

  async deleteConversation(
    db: TransactionLike,
    opts: {
      conversationId: string
      userId: string
      organizationId: string
    }
  ): Promise<void> {
    const result = await db
      .delete(chatConversationsTable)
      .where(
        and(
          eq(chatConversationsTable.id, opts.conversationId),
          eq(chatConversationsTable.userId, opts.userId),
          eq(chatConversationsTable.organizationId, opts.organizationId)
        )
      )
      .returning({ id: chatConversationsTable.id })

    if (!result.length) {
      throw HttpError.NotFound('Conversation not found')
    }
  }

  async sendMessage(
    db: TransactionLike,
    opts: {
      conversationId: string
      userId: string
      organizationId: string
    } & SendMessage
  ): Promise<ChatMessage> {
    // Validate conversation exists and belongs to user
    const conversation = await db
      .select()
      .from(chatConversationsTable)
      .where(
        and(
          eq(chatConversationsTable.id, opts.conversationId),
          eq(chatConversationsTable.userId, opts.userId),
          eq(chatConversationsTable.organizationId, opts.organizationId)
        )
      )
      .then((res) => res[0])

    if (!conversation) {
      throw HttpError.NotFound('Conversation not found')
    }

    // Create user message
    const userMessage = await db
      .insert(chatMessagesTable)
      .values({
        id: nanoid(),
        conversationId: opts.conversationId,
        content: opts.content,
        messageType: 'user',
        userId: opts.userId,
        mentions: opts.mentions || [],
        references: opts.references || [],
        isStreaming: false,
        isError: false,
      })
      .returning()
      .then((res) => res[0]!)

    // Update conversation last message time
    await db
      .update(chatConversationsTable)
      .set({
        lastMessageAt: userMessage.createdAt,
        currentPageContext: opts.currentPageContext || conversation.currentPageContext,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(chatConversationsTable.id, opts.conversationId))

    // Notify via Pusher
    await pusher.trigger(
      CHAT_CHANNELS.CONVERSATION(opts.conversationId),
      CHAT_EVENTS.MESSAGE_CREATED,
      { message: userMessage }
    )

    // Trigger agent response asynchronously
    this.coordinator
      .processUserMessage(db, {
        conversationId: opts.conversationId,
        userMessage: userMessage as ChatMessage,
        pageContext: opts.currentPageContext || conversation.currentPageContext,
        organizationId: opts.organizationId,
      })
      .catch(console.error)

    return userMessage as ChatMessage
  }

  async *sendMessageStream(
    db: TransactionLike,
    opts: {
      conversationId: string
      userId: string
      organizationId: string
    } & SendMessage
  ): AsyncGenerator<string, void, unknown> {
    // Validate conversation exists and belongs to user
    const conversation = await db
      .select()
      .from(chatConversationsTable)
      .where(
        and(
          eq(chatConversationsTable.id, opts.conversationId),
          eq(chatConversationsTable.userId, opts.userId),
          eq(chatConversationsTable.organizationId, opts.organizationId)
        )
      )
      .then((res) => res[0])

    if (!conversation) {
      throw HttpError.NotFound('Conversation not found')
    }

    // Create user message
    const userMessage = await db
      .insert(chatMessagesTable)
      .values({
        id: nanoid(),
        conversationId: opts.conversationId,
        content: opts.content,
        messageType: 'user',
        userId: opts.userId,
        mentions: opts.mentions || [],
        references: opts.references || [],
        isStreaming: false,
        isError: false,
      })
      .returning()
      .then((res) => res[0]!)

    // Update conversation last message time
    await db
      .update(chatConversationsTable)
      .set({
        lastMessageAt: userMessage.createdAt,
        currentPageContext: opts.currentPageContext || conversation.currentPageContext,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(chatConversationsTable.id, opts.conversationId))

    // Notify via Pusher
    await pusher.trigger(
      CHAT_CHANNELS.CONVERSATION(opts.conversationId),
      CHAT_EVENTS.MESSAGE_CREATED,
      { message: userMessage }
    )

    // Yield from the LangChain coordinator's streaming response
    yield* this.coordinator.processUserMessageStream(db, {
      conversationId: opts.conversationId,
      userMessage: userMessage as ChatMessage,
      pageContext: opts.currentPageContext || conversation.currentPageContext,
      organizationId: opts.organizationId,
    })
  }

  async getConversationMessages(
    db: TransactionLike,
    opts: {
      conversationId: string
      userId: string
      organizationId: string
      limit?: number
      before?: string
      after?: string
    }
  ) {
    // Validate conversation access
    const conversation = await db
      .select({ id: chatConversationsTable.id })
      .from(chatConversationsTable)
      .where(
        and(
          eq(chatConversationsTable.id, opts.conversationId),
          eq(chatConversationsTable.userId, opts.userId),
          eq(chatConversationsTable.organizationId, opts.organizationId)
        )
      )
      .then((res) => res[0])

    if (!conversation) {
      throw HttpError.NotFound('Conversation not found')
    }

    const limit = Math.min(opts.limit || CHAT_CONFIG.MESSAGE_PAGINATION_LIMIT, 100)

    // Build query conditions
    const conditions: (SQL | undefined)[] = [
      eq(chatMessagesTable.conversationId, opts.conversationId),
    ]

    if (opts.before) {
      // Get messages before this message (for pagination)
      const beforeMessage = await db
        .select({ createdAt: chatMessagesTable.createdAt })
        .from(chatMessagesTable)
        .where(eq(chatMessagesTable.id, opts.before))
        .then((res) => res[0])

      if (beforeMessage) {
        conditions.push(lt(chatMessagesTable.createdAt, beforeMessage.createdAt))
      }
    }

    if (opts.after) {
      // Get messages after this message
      const afterMessage = await db
        .select({ createdAt: chatMessagesTable.createdAt })
        .from(chatMessagesTable)
        .where(eq(chatMessagesTable.id, opts.after))
        .then((res) => res[0])

      if (afterMessage) {
        conditions.push(gt(chatMessagesTable.createdAt, afterMessage.createdAt))
      }
    }

    const messages = await db
      .select()
      .from(chatMessagesTable)
      .where(and(...conditions))
      .orderBy(desc(chatMessagesTable.createdAt))
      .limit(limit + 1)

    const totalCount = await db
      .select({ count: count() })
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.conversationId, opts.conversationId))
      .then((res) => res[0]?.count || 0)

    return {
      data: messages.slice(0, limit).reverse(),
      total: totalCount,
      nextCursor: messages.length === limit + 1 ? messages[messages.length - 1]!.id : null,
    }
  }

  async addMessageReaction(
    db: TransactionLike,
    opts: {
      messageId: string
      userId: string
      organizationId: string
      reactionType: ReactionType
    }
  ) {
    // Verify message exists and user has access
    const message = await db
      .select({ conversationId: chatMessagesTable.conversationId })
      .from(chatMessagesTable)
      .innerJoin(
        chatConversationsTable,
        eq(chatMessagesTable.conversationId, chatConversationsTable.id)
      )
      .where(
        and(
          eq(chatMessagesTable.id, opts.messageId),
          eq(chatConversationsTable.userId, opts.userId),
          eq(chatConversationsTable.organizationId, opts.organizationId)
        )
      )
      .then((res) => res[0])

    if (!message) {
      throw HttpError.NotFound('Message not found')
    }

    // Upsert reaction
    const reaction = await db
      .insert(chatMessageReactionsTable)
      .values({
        id: nanoid(),
        messageId: opts.messageId,
        userId: opts.userId,
        reactionType: opts.reactionType,
      })
      .onConflictDoUpdate({
        target: [
          chatMessageReactionsTable.messageId,
          chatMessageReactionsTable.userId,
          chatMessageReactionsTable.reactionType,
        ],
        set: {
          updatedAt: new Date().toISOString(),
        },
      })
      .returning()
      .then((res) => res[0]!)

    return reaction
  }

  async removeMessageReaction(
    db: TransactionLike,
    opts: {
      messageId: string
      userId: string
      organizationId: string
      reactionType: ReactionType
    }
  ) {
    await db
      .delete(chatMessageReactionsTable)
      .where(
        and(
          eq(chatMessageReactionsTable.messageId, opts.messageId),
          eq(chatMessageReactionsTable.userId, opts.userId),
          eq(chatMessageReactionsTable.reactionType, opts.reactionType)
        )
      )
  }

  async searchReferences(
    db: TransactionLike,
    opts: {
      userId: string
      organizationId: string
    } & SearchReferences
  ): Promise<SearchReferenceResult> {
    const limit = Math.min(opts.limit || 20, CHAT_CONFIG.MAX_SEARCH_RESULTS)
    const references: SmartReference[] = []

    const searchTypes = opts.types || ['post', 'task', 'user', 'media', 'label']

    // Search posts
    if (searchTypes.includes('post')) {
      const posts = await db
        .select({
          id: postsTable.id,
          title: postsTable.name,
          type: postsTable.type,
          status: postsTable.status,
          createdAt: postsTable.createdAt,
        })
        .from(postsTable)
        .where(
          and(
            eq(postsTable.organizationId, opts.organizationId),
            ilike(postsTable.name, `%${opts.query}%`)
          )
        )
        .limit(Math.ceil(limit / searchTypes.length))

      references.push(
        ...posts.map((post) => ({
          id: post.id,
          type: 'post' as const,
          title: post.title,
          preview: `${post.type} • ${post.status}`,
          metadata: {
            type: post.type,
            status: post.status,
            createdAt: post.createdAt,
          },
          startIndex: 0,
          endIndex: 0,
        }))
      )
    }

    // Search tasks
    if (searchTypes.includes('task')) {
      const tasks = await db
        .select({
          id: tasksTable.id,
          title: tasksTable.title,
          status: tasksTable.status,
          priority: tasksTable.priority,
          createdAt: tasksTable.createdAt,
        })
        .from(tasksTable)
        .where(
          and(
            eq(tasksTable.organizationId, opts.organizationId),
            ilike(tasksTable.title, `%${opts.query}%`)
          )
        )
        .limit(Math.ceil(limit / searchTypes.length))

      references.push(
        ...tasks.map((task) => ({
          id: task.id,
          type: 'task' as const,
          title: task.title,
          preview: `${task.status} • ${task.priority}`,
          metadata: {
            status: task.status,
            priority: task.priority,
            createdAt: task.createdAt,
          },
          startIndex: 0,
          endIndex: 0,
        }))
      )
    }

    // Search users
    if (searchTypes.includes('user')) {
      const users = await db
        .select({
          id: usersTable.id,
          email: usersTable.email,
          name: usersTable.name,
        })
        .from(usersTable)
        .where(
          or(ilike(usersTable.email, `%${opts.query}%`), ilike(usersTable.name, `%${opts.query}%`))
        )
        .limit(Math.ceil(limit / searchTypes.length))

      references.push(
        ...users.map((user) => ({
          id: user.id,
          type: 'user' as const,
          title: user.name,
          preview: user.email,
          metadata: {
            email: user.email,
            name: user.name,
          },
          startIndex: 0,
          endIndex: 0,
        }))
      )
    }

    // Search labels
    if (searchTypes.includes('label')) {
      const labels = await db
        .select({
          id: labelsTable.id,
          name: labelsTable.name,
          color: labelsTable.color,
        })
        .from(labelsTable)
        .where(
          and(
            eq(labelsTable.organizationId, opts.organizationId),
            ilike(labelsTable.name, `%${opts.query}%`)
          )
        )
        .limit(Math.ceil(limit / searchTypes.length))

      references.push(
        ...labels.map((label) => ({
          id: label.id,
          type: 'label' as const,
          title: label.name,
          preview: 'Label',
          metadata: {
            color: label.color,
          },
          startIndex: 0,
          endIndex: 0,
        }))
      )
    }

    // Sort by relevance (simple text matching for now)
    const sortedReferences = references
      .sort((a, b) => {
        const aScore = a.title.toLowerCase().indexOf(opts.query.toLowerCase())
        const bScore = b.title.toLowerCase().indexOf(opts.query.toLowerCase())
        if (aScore !== bScore) return aScore - bScore
        return a.title.localeCompare(b.title)
      })
      .slice(0, limit)

    return {
      references: sortedReferences,
      hasMore: references.length > limit,
    }
  }

  // async getChatAnalytics(
  //   db: TransactionLike,
  //   opts: {
  //     userId: string
  //     organizationId: string
  //   }
  // ): Promise<ChatAnalytics> {
  //   const totalConversations = await db
  //     .select({ count: count() })
  //     .from(chatConversationsTable)
  //     .where(
  //       and(
  //         eq(chatConversationsTable.userId, opts.userId),
  //         eq(chatConversationsTable.organizationId, opts.organizationId)
  //       )
  //     )
  //     .then((res) => res[0]?.count || 0)

  //   const totalMessages = await db
  //     .select({ count: count() })
  //     .from(chatMessagesTable)
  //     .innerJoin(
  //       chatConversationsTable,
  //       eq(chatMessagesTable.conversationId, chatConversationsTable.id)
  //     )
  //     .where(
  //       and(
  //         eq(chatConversationsTable.userId, opts.userId),
  //         eq(chatConversationsTable.organizationId, opts.organizationId)
  //       )
  //     )
  //     .then((res) => res[0]?.count || 0)

  //   return {
  //     totalConversations,
  //     totalMessages,
  //     averageResponseTime: 2.5, // Placeholder - would calculate from actual response times
  //   }
  // }
}

// Create IoC injection for ChatService
export const injectChatService = ioc.register('chatService', (ioc) => {
  const { langChainCoordinatorService } = ioc.resolve([injectLangChainCoordinatorService])
  return new ChatService(langChainCoordinatorService)
})
