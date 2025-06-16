import { relations } from 'drizzle-orm'
import { index, pgTable, text, integer } from 'drizzle-orm/pg-core'
import { primaryKeyCol, timestampCols } from './_base.table'
import { organizationsTable } from './organizations.table'

// Main labels table (generic for all resources)
export const labelsTable = pgTable(
  'labels',
  {
    id: primaryKeyCol('id'),
    name: text('name').notNull(),
    color: text('color').notNull(), // Hex color code
    description: text('description'),
    categoryId: text('category_id'), // Optional categorization
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),

    ...timestampCols(),
  },
  (table) => [
    index().on(table.organizationId),
    index().on(table.categoryId),
    // Unique constraint for label names within organization
    index().on(table.name, table.organizationId),
  ]
)

// Label categories table (for organizing labels)
export const labelCategoriesTable = pgTable(
  'label_categories',
  {
    id: primaryKeyCol('id'),
    name: text('name').notNull(),
    description: text('description'),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),

    ...timestampCols(),
  },
  (table) => [
    index().on(table.organizationId),
    // Unique constraint for category names within organization
    index().on(table.name, table.organizationId),
  ]
)

// Generic resource-label associations table
export const resourceLabelsTable = pgTable(
  'resource_labels',
  {
    id: primaryKeyCol('id'),
    labelId: text('label_id')
      .notNull()
      .references(() => labelsTable.id, { onDelete: 'cascade' }),
    resourceId: text('resource_id').notNull(), // ID of the resource (task, post, image, etc.)
    resourceType: text('resource_type').notNull(), // Type of resource ('task', 'post', 'image', 'campaign', etc.)
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),

    ...timestampCols(),
  },
  (table) => [
    index().on(table.labelId),
    index().on(table.resourceId),
    index().on(table.resourceType),
    index().on(table.organizationId),
    // Unique constraint to prevent duplicate labels on same resource
    index().on(table.labelId, table.resourceId, table.resourceType),
    // Index for efficient resource lookup
    index().on(table.resourceId, table.resourceType),
  ]
)

// Define all the relations
export const labelsRelations = relations(labelsTable, ({ one, many }) => ({
  organization: one(organizationsTable, {
    fields: [labelsTable.organizationId],
    references: [organizationsTable.id],
  }),
  category: one(labelCategoriesTable, {
    fields: [labelsTable.categoryId],
    references: [labelCategoriesTable.id],
  }),
  resourceLabels: many(resourceLabelsTable),
}))

export const labelCategoriesRelations = relations(labelCategoriesTable, ({ one, many }) => ({
  organization: one(organizationsTable, {
    fields: [labelCategoriesTable.organizationId],
    references: [organizationsTable.id],
  }),
  labels: many(labelsTable),
}))

export const resourceLabelsRelations = relations(resourceLabelsTable, ({ one }) => ({
  label: one(labelsTable, {
    fields: [resourceLabelsTable.labelId],
    references: [labelsTable.id],
  }),
  organization: one(organizationsTable, {
    fields: [resourceLabelsTable.organizationId],
    references: [organizationsTable.id],
  }),
}))

// Export types for use in services
export type SelectLabel = typeof labelsTable.$inferSelect
export type InsertLabel = typeof labelsTable.$inferInsert
export type SelectLabelCategory = typeof labelCategoriesTable.$inferSelect
export type InsertLabelCategory = typeof labelCategoriesTable.$inferInsert
export type SelectResourceLabel = typeof resourceLabelsTable.$inferSelect
export type InsertResourceLabel = typeof resourceLabelsTable.$inferInsert
