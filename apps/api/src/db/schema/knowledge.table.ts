import { relations } from 'drizzle-orm'
import {
  pgTable,
  text,
  jsonb,
  boolean,
  integer,
  index,
  unique,
  timestamp,
  foreignKey,
} from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'
import {
  KNOWLEDGE_STATUS,
  KNOWLEDGE_TEMPLATE_TYPE,
  KNOWLEDGE_VERSION_CHANGE_TYPE,
  KNOWLEDGE_REFERENCE_TYPE,
} from '@bulkit/shared/constants/db.constants'
import { primaryKeyCol, timestampCols } from './_base.table'
import { usersTable } from './auth.table'
import { organizationsTable } from './organizations.table'
import { commentsTable } from './comments.table'
import { folderableCols, folderableIndexes } from './folders.table'
import type {
  KnowledgeMention,
  KnowledgeMetadata,
} from '@bulkit/shared/modules/knowledge/knowledge.schemas'

// Main knowledge documents table
export const knowledgeTable = pgTable(
  'knowledge',
  {
    id: primaryKeyCol(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    excerpt: text('excerpt'), // Auto-generated summary/preview

    // Organization and ownership
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    createdByUserId: text('created_by_user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    lastEditedByUserId: text('last_edited_by_user_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),

    // Status and visibility
    status: text('status', { enum: KNOWLEDGE_STATUS }).notNull().default('draft'),

    // Template and categorization
    templateType: text('template_type', { enum: KNOWLEDGE_TEMPLATE_TYPE })
      .notNull()
      .default('general'),

    // Content structure
    mentions: jsonb('mentions').$type<KnowledgeMention[]>().default([]),
    metadata: jsonb('metadata').$type<KnowledgeMetadata>().default({}),

    // Versioning
    version: integer('version').notNull().default(1),
    isCurrentVersion: boolean('is_current_version').notNull().default(true),

    // Metrics
    viewCount: integer('view_count').notNull().default(0),

    // Archive tracking
    archivedAt: timestamp('archived_at', { mode: 'string', withTimezone: true }),

    ...timestampCols(),
    ...folderableCols(),
  },
  (table) => [
    index().on(table.organizationId),
    index().on(table.createdByUserId),
    index().on(table.status),
    index().on(table.templateType),
    index().on(table.version),
    index().on(table.isCurrentVersion),
    index().on(table.createdAt),
    index().on(table.title),
    ...folderableIndexes(table),
    // Composite index for getting latest version of documents
    index().on(table.organizationId, table.isCurrentVersion),
  ]
)

// Knowledge versions table - stores version history
export const knowledgeVersionsTable = pgTable(
  'knowledge_versions',
  {
    id: primaryKeyCol(),
    knowledgeId: text('knowledge_id')
      .notNull()
      .references(() => knowledgeTable.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),

    // Snapshot of content at this version
    title: text('title').notNull(),
    content: text('content').notNull(),
    excerpt: text('excerpt'),
    mentions: jsonb('mentions').$type<KnowledgeMention[]>().default([]),
    metadata: jsonb('metadata').$type<KnowledgeMetadata>().default({}),
    templateType: text('template_type', { enum: KNOWLEDGE_TEMPLATE_TYPE }).notNull(),
    status: text('status', { enum: KNOWLEDGE_STATUS }).notNull(),

    // Version metadata
    changeType: text('change_type', { enum: KNOWLEDGE_VERSION_CHANGE_TYPE }).notNull(),
    changeDescription: text('change_description'),
    changedByUserId: text('changed_by_user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),

    ...timestampCols(),
  },
  (table) => [
    index().on(table.knowledgeId),
    index().on(table.version),
    index().on(table.changeType),
    index().on(table.createdAt),
    // Unique constraint to prevent duplicate versions
    unique().on(table.knowledgeId, table.version),
  ]
)

// Knowledge references table - tracks relationships between knowledge and other entities
export const knowledgeReferencesTable = pgTable(
  'knowledge_references',
  {
    id: primaryKeyCol(),
    knowledgeId: text('knowledge_id')
      .notNull()
      .references(() => knowledgeTable.id, { onDelete: 'cascade' }),

    // Referenced entity (can be another knowledge doc, post, task, etc.)
    referencedEntityId: text('referenced_entity_id').notNull(),
    referencedEntityType: text('referenced_entity_type').notNull(), // 'knowledge', 'post', 'task', 'media', etc.

    // Reference type and context
    referenceType: text('reference_type', { enum: KNOWLEDGE_REFERENCE_TYPE }).notNull(),
    contextSnippet: text('context_snippet'), // Surrounding text where reference occurs

    createdByUserId: text('created_by_user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),

    ...timestampCols(),
  },
  (table) => [
    index().on(table.knowledgeId),
    index().on(table.referencedEntityId, table.referencedEntityType),
    index().on(table.referenceType),
    index().on(table.createdByUserId),
    // Prevent duplicate references
    unique().on(
      table.knowledgeId,
      table.referencedEntityId,
      table.referencedEntityType,
      table.referenceType
    ),
  ]
)

// Knowledge templates table - predefined templates for different knowledge types
export const knowledgeTemplatesTable = pgTable(
  'knowledge_templates',
  {
    id: primaryKeyCol(),
    name: text('name').notNull(),
    description: text('description'),
    templateType: text('template_type', { enum: KNOWLEDGE_TEMPLATE_TYPE }).notNull(),

    // Template content
    contentTemplate: text('content_template').notNull(), // Markdown template with placeholders
    metadataTemplate: jsonb('metadata_template').$type<KnowledgeMetadata>().default({}),

    // Availability
    isPublic: boolean('is_public').notNull().default(false), // Available to all organizations
    organizationId: text('organization_id').references(() => organizationsTable.id, {
      onDelete: 'cascade',
    }), // Null if public template

    createdByUserId: text('created_by_user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),

    // Usage tracking
    usageCount: integer('usage_count').notNull().default(0),

    ...timestampCols(),
  },
  (table) => [
    index().on(table.templateType),
    index().on(table.organizationId),
    index().on(table.isPublic),
    index().on(table.createdByUserId),
    index().on(table.name),
  ]
)

// Knowledge views table - track who viewed what knowledge documents
export const knowledgeViewsTable = pgTable(
  'knowledge_views',
  {
    id: primaryKeyCol(),
    knowledgeId: text('knowledge_id')
      .notNull()
      .references(() => knowledgeTable.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),

    viewedAt: timestamp('viewed_at', { mode: 'string', withTimezone: true }).defaultNow(),

    // View context
    referrerType: text('referrer_type'), // 'search', 'mention', 'link', 'browse'
    referrerId: text('referrer_id'), // ID of the entity that led to this view
  },
  (table) => [
    index().on(table.knowledgeId),
    index().on(table.userId),
    index().on(table.viewedAt),
    // Composite index for user's recent views
    index().on(table.userId, table.viewedAt),
  ]
)

// Type exports
export type SelectKnowledge = typeof knowledgeTable.$inferSelect
export type InsertKnowledge = typeof knowledgeTable.$inferInsert
export type SelectKnowledgeVersion = typeof knowledgeVersionsTable.$inferSelect
export type InsertKnowledgeVersion = typeof knowledgeVersionsTable.$inferInsert
export type SelectKnowledgeReference = typeof knowledgeReferencesTable.$inferSelect
export type InsertKnowledgeReference = typeof knowledgeReferencesTable.$inferInsert
export type SelectKnowledgeTemplate = typeof knowledgeTemplatesTable.$inferSelect
export type InsertKnowledgeTemplate = typeof knowledgeTemplatesTable.$inferInsert
export type SelectKnowledgeView = typeof knowledgeViewsTable.$inferSelect
export type InsertKnowledgeView = typeof knowledgeViewsTable.$inferInsert

// Schema exports
export const insertKnowledgeSchema = createInsertSchema(knowledgeTable)
export const selectKnowledgeSchema = createSelectSchema(knowledgeTable)
export const insertKnowledgeVersionSchema = createInsertSchema(knowledgeVersionsTable)
export const selectKnowledgeVersionSchema = createSelectSchema(knowledgeVersionsTable)
export const insertKnowledgeReferenceSchema = createInsertSchema(knowledgeReferencesTable)
export const selectKnowledgeReferenceSchema = createSelectSchema(knowledgeReferencesTable)
export const insertKnowledgeTemplateSchema = createInsertSchema(knowledgeTemplatesTable)
export const selectKnowledgeTemplateSchema = createSelectSchema(knowledgeTemplatesTable)
export const insertKnowledgeViewSchema = createInsertSchema(knowledgeViewsTable)
export const selectKnowledgeViewSchema = createSelectSchema(knowledgeViewsTable)

// Relations
export const knowledgeRelations = relations(knowledgeTable, ({ one, many }) => ({
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
  versions: many(knowledgeVersionsTable),
  references: many(knowledgeReferencesTable),
  views: many(knowledgeViewsTable),
  comments: many(commentsTable),
}))

export const knowledgeVersionsRelations = relations(knowledgeVersionsTable, ({ one }) => ({
  knowledge: one(knowledgeTable, {
    fields: [knowledgeVersionsTable.knowledgeId],
    references: [knowledgeTable.id],
  }),
  changedByUser: one(usersTable, {
    fields: [knowledgeVersionsTable.changedByUserId],
    references: [usersTable.id],
  }),
}))

export const knowledgeReferencesRelations = relations(knowledgeReferencesTable, ({ one }) => ({
  knowledge: one(knowledgeTable, {
    fields: [knowledgeReferencesTable.knowledgeId],
    references: [knowledgeTable.id],
  }),
  createdByUser: one(usersTable, {
    fields: [knowledgeReferencesTable.createdByUserId],
    references: [usersTable.id],
  }),
}))

export const knowledgeTemplatesRelations = relations(knowledgeTemplatesTable, ({ one }) => ({
  organization: one(organizationsTable, {
    fields: [knowledgeTemplatesTable.organizationId],
    references: [organizationsTable.id],
  }),
  createdByUser: one(usersTable, {
    fields: [knowledgeTemplatesTable.createdByUserId],
    references: [usersTable.id],
  }),
}))

export const knowledgeViewsRelations = relations(knowledgeViewsTable, ({ one }) => ({
  knowledge: one(knowledgeTable, {
    fields: [knowledgeViewsTable.knowledgeId],
    references: [knowledgeTable.id],
  }),
  user: one(usersTable, {
    fields: [knowledgeViewsTable.userId],
    references: [usersTable.id],
  }),
}))
