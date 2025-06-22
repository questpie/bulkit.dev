import type {
  Mention,
  PageContext,
  SmartReference,
  ToolCall,
  ToolResult,
} from '@bulkit/shared/modules/chat/chat.schemas'
import { relations } from 'drizzle-orm'
import { boolean, jsonb, pgTable, text, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core'
import { primaryKeyCol, timestampCols } from './_base.table'
import { usersTable } from './auth.table'
import { organizationsTable } from './organizations.table'

// Chat conversations - user-specific AI assistant chats
export const chatConversationsTable = pgTable(
  'chat_conversations',
  {
    id: primaryKeyCol('id'),
    title: text('title').notNull(), // Auto-generated or user-set title

    // Ownership
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),

    // Context
    currentPageContext: jsonb('current_page_context').$type<PageContext>(), // Current page user is on
    pinnedResources: jsonb('pinned_resources').$type<SmartReference[]>().default([]).notNull(), // Pinned posts/tasks/etc

    // Status
    isArchived: boolean('is_archived').default(false),
    lastMessageAt: timestamp('last_message_at', { mode: 'string', withTimezone: true }),

    ...timestampCols(),
  },
  (table) => [uniqueIndex().on(table.userId, table.organizationId)]
)

// Chat messages within conversations
export const chatMessagesTable = pgTable(
  'chat_messages',
  {
    id: primaryKeyCol('id'),
    conversationId: text('conversation_id')
      .notNull()
      .references(() => chatConversationsTable.id, { onDelete: 'cascade' }),

    // Message content
    content: text('content').notNull(),
    messageType: text('message_type', {
      enum: ['user', 'ai', 'system', 'tool_call', 'tool_result'],
    }).notNull(),

    // User info (for all messages - both human and AI users)
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),

    // Tool execution info
    toolCalls: jsonb('tool_calls').$type<ToolCall[]>(), // Tool calls made by AI
    toolResults: jsonb('tool_results').$type<ToolResult[]>(), // Results from tool execution

    // References and mentions
    mentions: jsonb('mentions').$type<Mention[]>().default([]).notNull(), // @mentions in message
    references: jsonb('references').$type<SmartReference[]>().default([]).notNull(), // Referenced posts/tasks/media

    // Status
    isStreaming: boolean('is_streaming').default(false).notNull(),
    isError: boolean('is_error').default(false).notNull(),
    errorMessage: text('error_message'),

    // Timestamps
    ...timestampCols(),
  },
  (t) => [index().on(t.conversationId)]
)

// Chat message reactions (like/dislike for AI responses)
export const chatMessageReactionsTable = pgTable(
  'chat_message_reactions',
  {
    id: primaryKeyCol('id'),
    messageId: text('message_id')
      .notNull()
      .references(() => chatMessagesTable.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),

    reactionType: text('reaction_type', {
      enum: ['like', 'dislike', 'helpful', 'not_helpful'],
    }).notNull(),

    ...timestampCols(),
  },
  (table) => [uniqueIndex().on(table.messageId, table.userId, table.reactionType)]
)

// Relations
export const chatConversationsRelations = relations(chatConversationsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [chatConversationsTable.userId],
    references: [usersTable.id],
  }),
  organization: one(organizationsTable, {
    fields: [chatConversationsTable.organizationId],
    references: [organizationsTable.id],
  }),
  messages: many(chatMessagesTable),
}))

export const chatMessagesRelations = relations(chatMessagesTable, ({ one, many }) => ({
  conversation: one(chatConversationsTable, {
    fields: [chatMessagesTable.conversationId],
    references: [chatConversationsTable.id],
  }),
  user: one(usersTable, {
    fields: [chatMessagesTable.userId],
    references: [usersTable.id],
  }),
  reactions: many(chatMessageReactionsTable),
}))

export const chatMessageReactionsRelations = relations(chatMessageReactionsTable, ({ one }) => ({
  message: one(chatMessagesTable, {
    fields: [chatMessageReactionsTable.messageId],
    references: [chatMessagesTable.id],
  }),
  user: one(usersTable, {
    fields: [chatMessageReactionsTable.userId],
    references: [usersTable.id],
  }),
}))
