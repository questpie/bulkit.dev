import {
	COMMENT_ATTACHMENT_TYPES,
	COMMENT_ENTITY_TYPES,
} from "@bulkit/shared/modules/comments/comments.schemas";
import type { Mention } from "@bulkit/shared/modules/mentions/mentions.schemas";
import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { primaryKeyCol, timestampCols } from "./_base.table";
import { usersTable } from "./auth.table";
import { organizationsTable } from "./organizations.table";
import { resourcesTable } from "./resources.table";

// Comments table with simple reply-to support
export const commentsTable = pgTable(
	"comments",
	{
		id: primaryKeyCol(),
		// Generic entity support - can be attached to posts, tasks, etc.
		entityId: text("entity_id").notNull(),
		entityType: text("entity_type", { enum: COMMENT_ENTITY_TYPES }).notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => usersTable.id, { onDelete: "cascade" }),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organizationsTable.id, {
				onDelete: "cascade",
			}),
		content: text("content").notNull(),
		mentions: jsonb("mentions").$type<Mention[]>().default([]),

		// Simple reply-to field
		replyToCommentId: text("reply_to_comment_id"),

		// Reaction tracking
		reactionCount: jsonb("reaction_count")
			.$type<Record<string, number>>()
			.default({}),

		// Attachments
		attachmentIds: text("attachment_ids").array().default([]),

		// Edit tracking
		isEdited: boolean("is_edited").default(false),
		editedAt: timestamp("edited_at", { mode: "string", withTimezone: true }),

		...timestampCols(),
	},
	(table) => [
		index().on(table.entityId),
		index().on(table.entityType),
		index().on(table.entityId, table.entityType),
		index().on(table.userId),
		index().on(table.organizationId),
		index().on(table.replyToCommentId),
		index().on(table.createdAt),
	],
);

// Comment reactions table
export const commentReactionsTable = pgTable(
	"comment_reactions",
	{
		id: primaryKeyCol(),
		commentId: text("comment_id")
			.notNull()
			.references(() => commentsTable.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => usersTable.id, { onDelete: "cascade" }),
		// @emoji
		reactionType: text("reaction_type").notNull(),
		...timestampCols(),
	},
	(table) => ({
		commentIdIdx: index().on(table.commentId),
		userIdIdx: index().on(table.userId),
		uniqueUserReaction: unique().on(
			table.commentId,
			table.userId,
			table.reactionType,
		),
	}),
);

// Comment attachments table
export const commentAttachmentsTable = pgTable(
	"comment_attachments",
	{
		id: primaryKeyCol(),
		commentId: text("comment_id")
			.notNull()
			.references(() => commentsTable.id, { onDelete: "cascade" }),
		resourceId: text("resource_id")
			.notNull()
			.references(() => resourcesTable.id, { onDelete: "cascade" }),
		attachmentType: text("attachment_type", {
			enum: COMMENT_ATTACHMENT_TYPES,
		}).notNull(),
		orderIndex: integer("order_index").default(0),
		...timestampCols(),
	},
	(table) => ({
		commentIdIdx: index().on(table.commentId),
		resourceIdIdx: index().on(table.resourceId),
		orderIdx: index().on(table.orderIndex),
	}),
);

// Comment read status table
export const commentReadStatusTable = pgTable(
	"comment_read_status",
	{
		id: primaryKeyCol(),
		commentId: text("comment_id")
			.notNull()
			.references(() => commentsTable.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => usersTable.id, { onDelete: "cascade" }),
		readAt: timestamp("read_at", {
			mode: "string",
			withTimezone: true,
		}).defaultNow(),
	},
	(table) => ({
		commentIdIdx: index().on(table.commentId),
		userIdIdx: index().on(table.userId),
		uniqueUserRead: unique().on(table.commentId, table.userId),
	}),
);

// Type exports
export type SelectComment = typeof commentsTable.$inferSelect;
export type InsertComment = typeof commentsTable.$inferInsert;
export type SelectCommentReaction = typeof commentReactionsTable.$inferSelect;
export type InsertCommentReaction = typeof commentReactionsTable.$inferInsert;
export type SelectCommentAttachment =
	typeof commentAttachmentsTable.$inferSelect;
export type InsertCommentAttachment =
	typeof commentAttachmentsTable.$inferInsert;
export type SelectCommentReadStatus =
	typeof commentReadStatusTable.$inferSelect;
export type InsertCommentReadStatus =
	typeof commentReadStatusTable.$inferInsert;

// Schema exports
export const insertCommentSchema = createInsertSchema(commentsTable);
export const selectCommentSchema = createSelectSchema(commentsTable);
export const insertCommentReactionSchema = createInsertSchema(
	commentReactionsTable,
);
export const selectCommentReactionSchema = createSelectSchema(
	commentReactionsTable,
);
export const insertCommentAttachmentSchema = createInsertSchema(
	commentAttachmentsTable,
);
export const selectCommentAttachmentSchema = createSelectSchema(
	commentAttachmentsTable,
);
export const insertCommentReadStatusSchema = createInsertSchema(
	commentReadStatusTable,
);
export const selectCommentReadStatusSchema = createSelectSchema(
	commentReadStatusTable,
);

// Relations
export const commentsRelations = relations(commentsTable, ({ one, many }) => ({
	// Note: Entity relations are handled dynamically based on entityType
	// The specific entity (post, task, etc.) is referenced by entityId + entityType
	user: one(usersTable, {
		fields: [commentsTable.userId],
		references: [usersTable.id],
	}),
	organization: one(organizationsTable, {
		fields: [commentsTable.organizationId],
		references: [organizationsTable.id],
	}),
	replyToComment: one(commentsTable, {
		fields: [commentsTable.replyToCommentId],
		references: [commentsTable.id],
	}),
	replies: many(commentsTable),
	reactions: many(commentReactionsTable),
	attachments: many(commentAttachmentsTable),
	readStatus: many(commentReadStatusTable),
}));

export const commentReactionsRelations = relations(
	commentReactionsTable,
	({ one }) => ({
		comment: one(commentsTable, {
			fields: [commentReactionsTable.commentId],
			references: [commentsTable.id],
		}),
		user: one(usersTable, {
			fields: [commentReactionsTable.userId],
			references: [usersTable.id],
		}),
	}),
);

export const commentAttachmentsRelations = relations(
	commentAttachmentsTable,
	({ one }) => ({
		comment: one(commentsTable, {
			fields: [commentAttachmentsTable.commentId],
			references: [commentsTable.id],
		}),
		resource: one(resourcesTable, {
			fields: [commentAttachmentsTable.resourceId],
			references: [resourcesTable.id],
		}),
	}),
);

export const commentReadStatusRelations = relations(
	commentReadStatusTable,
	({ one }) => ({
		comment: one(commentsTable, {
			fields: [commentReadStatusTable.commentId],
			references: [commentsTable.id],
		}),
		user: one(usersTable, {
			fields: [commentReadStatusTable.userId],
			references: [usersTable.id],
		}),
	}),
);
