import { MentionSchema } from "@bulkit/shared/modules/mentions/mentions.schemas";
import { Nullable, StringLiteralEnum } from "@bulkit/shared/schemas/misc";
import { type Static, Type } from "@sinclair/typebox";

export const COMMENT_ENTITY_TYPES = ["post", "task", "knowledge"] as const;
export type CommentEntityType = (typeof COMMENT_ENTITY_TYPES)[number];

export const COMMENT_REACTION_TYPES = [
	"like",
	"love",
	"laugh",
	"angry",
	"sad",
	"thumbs_up",
	"thumbs_down",
] as const;
export type CommentReactionType = (typeof COMMENT_REACTION_TYPES)[number];

export const COMMENT_ATTACHMENT_TYPES = [
	"image",
	"video",
	"document",
	"link",
] as const;
export type CommentAttachmentType = (typeof COMMENT_ATTACHMENT_TYPES)[number];

// Comment attachment schema
export const CommentAttachmentSchema = Type.Object({
	id: Type.String(),
	commentId: Type.String(),
	resourceId: Type.String(),
	attachmentType: StringLiteralEnum(COMMENT_ATTACHMENT_TYPES),
	orderIndex: Nullable(Type.Number()),
	createdAt: Type.String(),
	updatedAt: Type.String(),
});

export type CommentAttachment = Static<typeof CommentAttachmentSchema>;

// Comment reaction schema
export const CommentReactionSchema = Type.Object({
	id: Type.String(),
	commentId: Type.String(),
	userId: Type.String(),
	reactionType: Type.String(),
	createdAt: Type.String(),
	updatedAt: Type.String(),
});

export type CommentReaction = Static<typeof CommentReactionSchema>;

// Core comment schema
export const CommentSchema = Type.Object({
	id: Type.String(),
	entityId: Type.String(),
	entityType: StringLiteralEnum(COMMENT_ENTITY_TYPES),
	userId: Type.String(),
	organizationId: Type.String(),
	content: Type.String(),
	mentions: Type.Array(MentionSchema),
	replyToCommentId: Nullable(Type.String()),
	reactionCount: Type.Record(Type.String(), Type.Number()),
	attachmentIds: Type.Array(Type.String()),
	isEdited: Type.Boolean(),
	editedAt: Nullable(Type.String()),
	createdAt: Type.String(),
	updatedAt: Type.String(),
});

export type Comment = Static<typeof CommentSchema>;

// Comment with user info
export const CommentWithUserSchema = Type.Object({
	id: Type.String(),
	entityId: Type.String(),
	entityType: StringLiteralEnum(COMMENT_ENTITY_TYPES),
	userId: Type.String(),
	organizationId: Type.String(),
	content: Type.String(),
	mentions: Type.Array(MentionSchema),
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
});

export type CommentWithUser = Static<typeof CommentWithUserSchema>;

// Comment creation schema
export const CreateCommentSchema = Type.Object({
	entityId: Type.String(),
	entityType: StringLiteralEnum(COMMENT_ENTITY_TYPES),
	content: Type.String({ minLength: 1, maxLength: 10000 }),
	mentions: Type.Optional(Type.Array(MentionSchema)),
	replyToCommentId: Type.Optional(Type.String()),
	attachmentIds: Type.Optional(Type.Array(Type.String())),
});

export type CreateComment = Static<typeof CreateCommentSchema>;

// Comment update schema
export const UpdateCommentSchema = Type.Object({
	content: Type.Optional(Type.String({ minLength: 1, maxLength: 10000 })),
	mentions: Type.Optional(Type.Array(MentionSchema)),
	attachmentIds: Type.Optional(Type.Array(Type.String())),
});

export type UpdateComment = Static<typeof UpdateCommentSchema>;

// Comment list query schema
export const CommentListQuerySchema = Type.Object({
	entityId: Type.String(),
	entityType: StringLiteralEnum(COMMENT_ENTITY_TYPES),
	replyToCommentId: Type.Optional(Type.String()),
	cursor: Type.Optional(Type.Number()),
	limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
});

export type CommentListQuery = Static<typeof CommentListQuerySchema>;

// Comment reply query schema
export const CommentReplyQuerySchema = Type.Object({
	cursor: Type.Optional(Type.Number()),
	limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
});

export type CommentReplyQuery = Static<typeof CommentReplyQuerySchema>;

// Comment reaction schema
export const CreateCommentReactionSchema = Type.Object({
	commentId: Type.String(),
	reactionType: Type.String(),
});

export type CreateCommentReaction = Static<typeof CreateCommentReactionSchema>;

// Comment list response
export const CommentListResponseSchema = Type.Object({
	data: Type.Array(CommentWithUserSchema),
	nextCursor: Nullable(Type.Number()),
	hasMore: Type.Boolean(),
});

export type CommentListResponse = Static<typeof CommentListResponseSchema>;
