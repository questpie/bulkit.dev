import { KNOWLEDGE_STATUS } from "@bulkit/shared/modules/knowledge/knowledge.schemas";
import type { Mention } from "@bulkit/shared/modules/mentions/mentions.schemas";
import { relations } from "drizzle-orm";
import { index, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { primaryKeyCol, timestampCols } from "./_base.table";
import { usersTable } from "./auth.table";
import { commentsTable } from "./comments.table";
import { folderableCols, folderableIndexes } from "./folders.table";
import { organizationsTable } from "./organizations.table";

// Main knowledge documents table
export const knowledgeTable = pgTable(
	"knowledge",
	{
		id: primaryKeyCol(),
		title: text("title").notNull(),
		content: text("content").notNull(),
		excerpt: text("excerpt"), // Auto-generated summary/preview

		// Organization and ownership
		organizationId: text("organization_id")
			.notNull()
			.references(() => organizationsTable.id, { onDelete: "cascade" }),
		createdByUserId: text("created_by_user_id")
			.notNull()
			.references(() => usersTable.id, { onDelete: "cascade" }),
		lastEditedByUserId: text("last_edited_by_user_id").references(
			() => usersTable.id,
			{
				onDelete: "set null",
			},
		),

		// Status and visibility
		status: text("status", { enum: KNOWLEDGE_STATUS })
			.notNull()
			.default("draft"),

		// No template type - using names only

		// Content structure
		mentions: jsonb("mentions").$type<Mention[]>().default([]),

		...timestampCols(),
		...folderableCols(),
	},
	(table) => [
		index().on(table.organizationId),
		index().on(table.createdByUserId),
		index().on(table.status),
		index().on(table.createdAt),
		index().on(table.title),
		...folderableIndexes(table),
	],
);

// Type exports
export type SelectKnowledge = typeof knowledgeTable.$inferSelect;
export type InsertKnowledge = typeof knowledgeTable.$inferInsert;

// Schema exports
export const insertKnowledgeSchema = createInsertSchema(knowledgeTable);
export const selectKnowledgeSchema = createSelectSchema(knowledgeTable);

// Relations
export const knowledgeRelations = relations(
	knowledgeTable,
	({ one, many }) => ({
		organization: one(organizationsTable, {
			fields: [knowledgeTable.organizationId],
			references: [organizationsTable.id],
		}),
		createdByUser: one(usersTable, {
			fields: [knowledgeTable.createdByUserId],
			references: [usersTable.id],
		}),
		lastEditedByUser: one(usersTable, {
			fields: [knowledgeTable.lastEditedByUserId],
			references: [usersTable.id],
		}),
		comments: many(commentsTable),
	}),
);
