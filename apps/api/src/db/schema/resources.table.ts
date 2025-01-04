import type { ResourceMetadata } from '@bulkit/shared/modules/resources/resources.schemas'
import { primaryKeyCol, timestampCols } from './_base.table'
import { organizationsTable } from './organizations.table'
import { relations } from 'drizzle-orm'
import { bigint, boolean, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const resourcesTable = pgTable('resources', {
  id: primaryKeyCol('id'),
  isExternal: boolean('is_external').notNull().default(false),
  location: text('location').notNull(),
  type: text('type').notNull(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizationsTable.id, {
      onDelete: 'cascade',
    }),

  name: text('name'),
  /**
   * Can be used as a caption for the resource,
   * or alt text for the resource
   */
  caption: text('caption'),
  metadata: jsonb('metadata').$type<ResourceMetadata>(),
  ...timestampCols(),
})

export const resourcesRelations = relations(resourcesTable, ({ one }) => ({
  organization: one(organizationsTable, {
    fields: [resourcesTable.organizationId],
    references: [organizationsTable.id],
  }),
}))
