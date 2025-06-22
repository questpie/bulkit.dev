import {
  COMMENT_ATTACHMENT_TYPES,
  COMMENT_ENTITY_TYPES,
  COMMENT_MENTION_TYPES,
  COMMENT_REACTION_TYPES,
} from '@bulkit/shared/constants/db.constants'
import { Nullable, StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import { Type, type Static } from '@sinclair/typebox'
import { COMMENT_CONSTANTS } from './comments.constants'

// Comment mention types - simplified to not include agent-specific fields
export const CommentMentionSchema = Type.Union([
  // User mention (covers both human and AI users)
  Type.Object({
    type: Type.Literal('user'),
    id: Type.String(),
    name: Type.String(),
    email: Type.Optional(Type.String()),
    startIndex: Type.Number(),
    endIndex: Type.Number(),
  }),
  // Post mention
  Type.Object({
    type: Type.Literal('post'),
    id: Type.String(),
    name: Type.String(),
    entityType: Type.Optional(Type.String()),
    startIndex: Type.Number(),
    endIndex: Type.Number(),
  }),
  // Media/Resource mention
  Type.Object({
    type: Type.Literal('media'),
    id: Type.String(),
    name: Type.String(),
    resourceType: Type.Optional(Type.String()),
    url: Type.Optional(Type.String()),
    startIndex: Type.Number(),
    endIndex: Type.Number(),
  }),
  // Knowledge mention
  Type.Object({
    type: Type.Literal('knowledge'),
    id: Type.String(),
    name: Type.String(),
    templateType: Type.Optional(Type.String()),
    version: Type.Optional(Type.Number()),
    startIndex: Type.Number(),
    endIndex: Type.Number(),
  }),
  // Task mention
  Type.Object({
    type: Type.Literal('task'),
    id: Type.String(),
    name: Type.String(),
    status: Type.Optional(Type.String()),
    priority: Type.Optional(Type.String()),
    startIndex: Type.Number(),
    endIndex: Type.Number(),
  }),
])

export type CommentMention = Static<typeof CommentMentionSchema>

// Comment attachment schema
export const CommentAttachmentSchema = Type.Object({
  id: Type.String(),
  commentId: Type.String(),
  resourceId: Type.String(),
  attachmentType: StringLiteralEnum(COMMENT_ATTACHMENT_TYPES),
  orderIndex: Nullable(Type.Number()),
  createdAt: Type.String(),
  updatedAt: Type.String(),
})

export type CommentAttachment = Static<typeof CommentAttachmentSchema>

// Comment reaction schema
export const CommentReactionSchema = Type.Object({
  id: Type.String(),
  commentId: Type.String(),
  userId: Type.String(),
  reactionType: Type.String(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
})

export type CommentReaction = Static<typeof CommentReactionSchema>

// Core comment schema
export const CommentSchema = Type.Object({
  id: Type.String(),
  entityId: Type.String(),
  entityType: StringLiteralEnum(COMMENT_ENTITY_TYPES),
  userId: Type.String(),
  organizationId: Type.String(),
  content: Type.String(),
  mentions: Type.Array(CommentMentionSchema),
  replyToCommentId: Nullable(Type.String()),
  reactionCount: Type.Record(Type.String(), Type.Number()),
  attachmentIds: Type.Array(Type.String()),
  isEdited: Type.Boolean(),
  editedAt: Nullable(Type.String()),
  createdAt: Type.String(),
  updatedAt: Type.String(),
})

export type Comment = Static<typeof CommentSchema>

// Comment with user info
export const CommentWithUserSchema = Type.Object({
  id: Type.String(),
  entityId: Type.String(),
  entityType: StringLiteralEnum(COMMENT_ENTITY_TYPES),
  userId: Type.String(),
  organizationId: Type.String(),
  content: Type.String(),
  mentions: Type.Array(CommentMentionSchema),
  replyToCommentId: Nullable(Type.String()),
  reactionCount: Type.Record(Type.String(), Type.Number()),
  attachmentIds: Type.Array(Type.String()),
  isEdited: Type.Boolean(),
  editedAt: Nullable(Type.String()),
  createdAt: Type.String(),
  updatedAt: Type.String(),
  replyCount: Type.Number(),
  user: Type.Object({
    id: Type.String(),
    name: Type.String(),
    email: Nullable(Type.String()),
    role: Type.String(), // This will include 'ai' role for AI users
  }),
  reactions: Type.Array(CommentReactionSchema),
  attachments: Type.Array(CommentAttachmentSchema),
})

export type CommentWithUser = Static<typeof CommentWithUserSchema>

// Comment creation schema
export const CreateCommentSchema = Type.Object({
  entityId: Type.String(),
  entityType: StringLiteralEnum(COMMENT_ENTITY_TYPES),
  content: Type.String({ minLength: 1, maxLength: 10000 }),
  mentions: Type.Optional(Type.Array(CommentMentionSchema)),
  replyToCommentId: Type.Optional(Type.String()),
  attachmentIds: Type.Optional(Type.Array(Type.String())),
})

export type CreateComment = Static<typeof CreateCommentSchema>

// Comment update schema
export const UpdateCommentSchema = Type.Object({
  content: Type.Optional(Type.String({ minLength: 1, maxLength: 10000 })),
  mentions: Type.Optional(Type.Array(CommentMentionSchema)),
  attachmentIds: Type.Optional(Type.Array(Type.String())),
})

export type UpdateComment = Static<typeof UpdateCommentSchema>

// Comment list query schema
export const CommentListQuerySchema = Type.Object({
  entityId: Type.String(),
  entityType: StringLiteralEnum(COMMENT_ENTITY_TYPES),
  replyToCommentId: Type.Optional(Type.String()),
  cursor: Type.Optional(Type.Number()),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
})

export type CommentListQuery = Static<typeof CommentListQuerySchema>

// Comment reply query schema
export const CommentReplyQuerySchema = Type.Object({
  cursor: Type.Optional(Type.Number()),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
})

export type CommentReplyQuery = Static<typeof CommentReplyQuerySchema>

// Comment reaction schema
export const CreateCommentReactionSchema = Type.Object({
  commentId: Type.String(),
  reactionType: Type.String(),
})

export type CreateCommentReaction = Static<typeof CreateCommentReactionSchema>

// Comment list response
export const CommentListResponseSchema = Type.Object({
  data: Type.Array(CommentWithUserSchema),
  nextCursor: Nullable(Type.Number()),
  hasMore: Type.Boolean(),
})

export type CommentListResponse = Static<typeof CommentListResponseSchema>

// Re-export constants for convenience
export { COMMENT_CONSTANTS }
