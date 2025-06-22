import { MentionSchema } from "@bulkit/shared/modules/mentions/mentions.schemas";
import {
	Nullable,
	Nullish,
	StringLiteralEnum,
} from "@bulkit/shared/schemas/misc";
import { type Static, Type } from "@sinclair/typebox";

// Chat message types
export const CHAT_MESSAGE_TYPE = [
	"user",
	"ai",
	"system",
	"tool_call",
	"tool_result",
] as const;
export const ChatMessageTypeSchema = StringLiteralEnum(CHAT_MESSAGE_TYPE);

// Agent types
// Reference types for mentions and smart references
export const CHAT_REFERENCE_TYPE = [
	"post",
	"task",
	"user",
	"media",
	"channel",
	"label",
] as const;
export const ChatReferenceTypeSchema = StringLiteralEnum(CHAT_REFERENCE_TYPE);

// Reaction types
export const ReactionType = [
	"like",
	"dislike",
	"helpful",
	"not_helpful",
] as const;
export const ReactionTypeSchema = StringLiteralEnum(ReactionType);

// Smart reference schema - extensible for different entity types
export const SmartReferenceSchema = Type.Object({
	id: Type.String(),
	type: ChatReferenceTypeSchema,
	title: Type.String(),
	preview: Nullish(Type.String()), // Short preview text
	metadata: Nullish(Type.Record(Type.String(), Type.Any())), // Type-specific metadata
	startIndex: Type.Number(),
	endIndex: Type.Number(),
});

// Tool call schema for agent actions
export const ToolCallSchema = Type.Object({
	id: Type.String(),
	name: Type.String(),
	arguments: Type.Record(Type.String(), Type.Any()),
	status: Nullish(
		StringLiteralEnum(["pending", "running", "completed", "failed"]),
	),
});

// Tool result schema
export const ToolResultSchema = Type.Object({
	toolCallId: Type.String(),
	result: Type.Any(),
	error: Nullish(Type.String()),
	metadata: Nullish(Type.Record(Type.String(), Type.Any())),
});

// Page context schema - tracks current page for context awareness
export const PageContextSchema = Type.Object({
	path: Type.String(),
	entityType: Nullish(ChatReferenceTypeSchema),
	entityId: Nullish(Type.String()),
	metadata: Nullish(Type.Record(Type.String(), Type.Any())),
});

// Chat message schema
export const ChatMessageSchema = Type.Object({
	id: Type.String(),
	conversationId: Type.String(),
	content: Type.String(),
	messageType: ChatMessageTypeSchema,
	userId: Nullish(Type.String()),
	toolCalls: Nullish(Type.Array(ToolCallSchema)),
	toolResults: Nullish(Type.Array(ToolResultSchema)),
	mentions: Type.Array(MentionSchema),
	references: Type.Array(SmartReferenceSchema),
	isStreaming: Type.Boolean(),
	isError: Type.Boolean(),
	errorMessage: Nullish(Type.String()),
	createdAt: Type.String(),
	updatedAt: Type.String(),
});

// Chat conversation schema
export const ChatConversationSchema = Type.Object({
	id: Type.String(),
	title: Type.String(),
	userId: Type.String(),
	organizationId: Type.String(),
	currentPageContext: Nullable(PageContextSchema),
	pinnedResources: Type.Array(SmartReferenceSchema),
	isArchived: Nullish(Type.Boolean()),
	lastMessageAt: Nullable(Type.String()),
	createdAt: Type.String(),
	updatedAt: Type.String(),
});

// Chat conversation with messages
export const ChatConversationWithMessagesSchema = Type.Composite([
	ChatConversationSchema,
	Type.Object({
		messages: Type.Array(ChatMessageSchema),
		messageCount: Type.Number(),
	}),
]);

// Request/Response schemas

// Create conversation
export const CreateConversationSchema = Type.Object({
	title: Type.Optional(Type.String()),
	currentPageContext: Nullish(PageContextSchema),
});

// Send message
export const SendMessageSchema = Type.Object({
	content: Type.String(),
	references: Nullish(Type.Array(SmartReferenceSchema)),
	mentions: Nullish(Type.Array(MentionSchema)),
	currentPageContext: Nullish(PageContextSchema),
});

// Update conversation
export const UpdateConversationSchema = Type.Object({
	title: Nullish(Type.String()),
	currentPageContext: Nullish(PageContextSchema),
	pinnedResources: Nullish(Type.Array(SmartReferenceSchema)),
	isArchived: Nullish(Type.Boolean()),
});

// Agent response schema for streaming
export const AgentResponseSchema = Type.Object({
	messageId: Type.String(),
	content: Type.String(),
	isComplete: Type.Boolean(),
	toolCalls: Nullish(Type.Array(ToolCallSchema)),
	error: Nullish(Type.String()),
});

// Search schema for finding references
export const SearchReferencesSchema = Type.Object({
	query: Type.String(),
	types: Nullish(Type.Array(ChatReferenceTypeSchema)),
	limit: Nullish(Type.Number()),
});

// Search result for references
export const SearchReferenceResultSchema = Type.Object({
	references: Type.Array(SmartReferenceSchema),
	hasMore: Type.Boolean(),
});

// // Analytics schemas
// export const ChatAnalyticsSchema = Type.Object({
//   totalConversations: Type.Number(),
//   totalMessages: Type.Number(),
//   averageResponseTime: Type.Number(),
//   topAgentTypes: Type.Array(
//     Type.Object({
//       agentType: ChatAgentTypeSchema,
//       usage: Type.Number(),
//     })
//   ),
//   mostReferencedEntities: Type.Array(
//     Type.Object({
//       entityType: ReferenceTypeSchema,
//       count: Type.Number(),
//     })
//   ),
// })

// Real-time event schemas
export const AgentTypingEventSchema = Type.Object({
	agentId: Type.String(),
	agentName: Type.String(),
	conversationId: Type.String(),
	isTyping: Type.Boolean(),
	timestamp: Type.String(),
});

export const UserTypingEventSchema = Type.Object({
	userId: Type.String(),
	userName: Type.String(),
	conversationId: Type.String(),
	isTyping: Type.Boolean(),
	timestamp: Type.String(),
});

// Export types
export type ChatMessageType = Static<typeof ChatMessageTypeSchema>;
export type ReactionType = Static<typeof ReactionTypeSchema>;
export type ChatReferenceType = Static<typeof ChatReferenceTypeSchema>;

export type SmartReference = Static<typeof SmartReferenceSchema>;
export type ToolCall = Static<typeof ToolCallSchema>;
export type ToolResult = Static<typeof ToolResultSchema>;
export type PageContext = Static<typeof PageContextSchema>;

export type ChatMessage = Static<typeof ChatMessageSchema>;
export type ChatConversation = Static<typeof ChatConversationSchema>;
export type ChatConversationWithMessages = Static<
	typeof ChatConversationWithMessagesSchema
>;

export type CreateConversation = Static<typeof CreateConversationSchema>;
export type SendMessage = Static<typeof SendMessageSchema>;
export type UpdateConversation = Static<typeof UpdateConversationSchema>;
export type AgentResponse = Static<typeof AgentResponseSchema>;
export type SearchReferences = Static<typeof SearchReferencesSchema>;
export type SearchReferenceResult = Static<typeof SearchReferenceResultSchema>;
// export type ChatAnalytics = Static<typeof ChatAnalyticsSchema>
export type AgentTypingEvent = Static<typeof AgentTypingEventSchema>;
export type UserTypingEvent = Static<typeof UserTypingEventSchema>;
