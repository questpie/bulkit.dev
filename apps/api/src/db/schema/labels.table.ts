import { relations } from 'drizzle-orm'
import { index, pgTable, text } from 'drizzle-orm/pg-core'
import { primaryKeyCol, timestampCols } from './_base.table'
import { organizationsTable } from './organizations.table'
import { LABEL_RESOURCE_TYPES } from '@bulkit/shared/constants/db.constants'

// Simple labels table
export const labelsTable = pgTable(
  'labels',
  {
    id: primaryKeyCol('id'),
    name: text('name').notNull(),
    color: text('color').notNull(), // Hex color code
    description: text('description'),
    iconName: text('icon_name'), // Icon identifier for UI
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),

    ...timestampCols(),
  },
  (table) => [
    index().on(table.organizationId),
    // Unique constraint for label names within organization
    index().on(table.name, table.organizationId),
  ]
)

// Resource-label associations table
export const resourceLabelsTable = pgTable(
  'resource_labels',
  {
    id: primaryKeyCol('id'),
    labelId: text('label_id')
      .notNull()
      .references(() => labelsTable.id, { onDelete: 'cascade' }),
    resourceId: text('resource_id').notNull(),
    resourceType: text('resource_type', { enum: LABEL_RESOURCE_TYPES }).notNull(),
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

// Relations
export const labelsRelations = relations(labelsTable, ({ one, many }) => ({
  organization: one(organizationsTable, {
    fields: [labelsTable.organizationId],
    references: [organizationsTable.id],
  }),
  resourceLabels: many(resourceLabelsTable),
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

// Type exports
export type SelectLabel = typeof labelsTable.$inferSelect
export type InsertLabel = typeof labelsTable.$inferInsert
export type SelectResourceLabel = typeof resourceLabelsTable.$inferSelect
export type InsertResourceLabel = typeof resourceLabelsTable.$inferInsert
