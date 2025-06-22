import { MentionSchema } from "@bulkit/shared/modules/mentions/mentions.schemas";
import { Nullish, StringLiteralEnum } from "@bulkit/shared/schemas/misc";
import { type Static, Type } from "@sinclair/typebox";

export const KNOWLEDGE_STATUS = ["draft", "published", "archived"] as const;
export type KnowledgeStatus = (typeof KNOWLEDGE_STATUS)[number];

// User reference schema
export const UserReferenceSchema = Type.Object({
	id: Type.String(),
	displayName: Type.String(),
	email: Type.String(),
});

// Base knowledge schema
export const KnowledgeSchema = Type.Object({
	id: Type.String(),
	title: Type.String(),
	content: Type.String(),
	excerpt: Nullish(Type.String()),
	status: StringLiteralEnum(KNOWLEDGE_STATUS),
	mentions: Type.Array(MentionSchema),
	organizationId: Type.String(),
	createdByUserId: Type.String(),
	lastEditedByUserId: Nullish(Type.String()),
	createdAt: Type.String(),
	updatedAt: Type.String(),
	// Folder fields
	folderId: Nullish(Type.String()),
	folderOrder: Type.Number(),
	addedToFolderAt: Nullish(Type.String()),
	addedToFolderByUserId: Nullish(Type.String()),
});

// Knowledge template schema - just uses name, no template types
export const KnowledgeTemplateSchema = Type.Object({
	id: Type.String(),
	name: Type.String(),
	description: Type.Optional(Type.String()),
	contentTemplate: Type.String(),
});

// Create knowledge document schema
export const CreateKnowledgeSchema = Type.Object({
	title: Type.String({ minLength: 1, maxLength: 255 }),
	content: Type.String({ minLength: 1 }),
	excerpt: Type.Optional(Type.String({ maxLength: 500 })),
	status: Type.Optional(StringLiteralEnum(KNOWLEDGE_STATUS)),
	mentions: Type.Optional(Type.Array(MentionSchema)),
});

// Service create knowledge schema (includes organization and user context)
export const ServiceCreateKnowledgeSchema = Type.Composite([
	CreateKnowledgeSchema,
	Type.Object({
		organizationId: Type.String(),
		userId: Type.String(),
	}),
]);

// Update knowledge document schema
export const UpdateKnowledgeSchema = Type.Object({
	title: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
	content: Type.Optional(Type.String({ minLength: 1 })),
	excerpt: Type.Optional(Type.String({ maxLength: 500 })),
	status: Type.Optional(StringLiteralEnum(KNOWLEDGE_STATUS)),
	mentions: Type.Optional(Type.Array(MentionSchema)),
});

// Service update knowledge schema (includes id and context)
export const ServiceUpdateKnowledgeSchema = Type.Composite([
	UpdateKnowledgeSchema,
	Type.Object({
		knowledgeId: Type.String(),
		organizationId: Type.String(),
		userId: Type.String(),
	}),
]);

// Knowledge list query schema
export const KnowledgeListQuerySchema = Type.Object({
	page: Type.Optional(Type.Number({ minimum: 1 })),
	limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
	search: Type.Optional(Type.String()),
	status: Type.Optional(StringLiteralEnum(KNOWLEDGE_STATUS)),
	createdBy: Type.Optional(Type.String()),
	tags: Type.Optional(Type.Array(Type.String())),
	sortBy: Type.Optional(StringLiteralEnum(["title", "createdAt", "updatedAt"])),
	sortOrder: Type.Optional(StringLiteralEnum(["asc", "desc"])),
});

// Parameter schemas

// Type exports
export type Knowledge = Static<typeof KnowledgeSchema>;
export type KnowledgeTemplate = Static<typeof KnowledgeTemplateSchema>;
export type CreateKnowledge = Static<typeof CreateKnowledgeSchema>;
export type ServiceCreateKnowledge = Static<
	typeof ServiceCreateKnowledgeSchema
>;
export type UpdateKnowledge = Static<typeof UpdateKnowledgeSchema>;
export type ServiceUpdateKnowledge = Static<
	typeof ServiceUpdateKnowledgeSchema
>;
export type KnowledgeListQuery = Static<typeof KnowledgeListQuerySchema>;
export type UserReference = Static<typeof UserReferenceSchema>;
