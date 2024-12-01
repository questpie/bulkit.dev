import { primaryKeyCol, timestampCols } from './_base.table'
import { organizationsTable } from './organizations.table'
import { relations } from 'drizzle-orm'
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const resourcesTable = pgTable('resources', {
  id: primaryKeyCol('id'),
  isExternal: boolean('is_external').notNull().default(false),
  location: text('location').notNull(), // URL if external, or path like 'private/org-id/file.jpg' or 'public/org-id/file.jpg'
  type: text('type').notNull(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizationsTable.id, {
      onDelete: 'cascade',
    }),

  /**
   *  if set, the resource will be deleted at this time
   */
  cleanupAt: timestamp('cleanup_at', { mode: 'string', withTimezone: true }),

  caption: text('caption'),
  ...timestampCols(),
})

export const resourcesRelations = relations(resourcesTable, ({ one }) => ({
  organization: one(organizationsTable, {
    fields: [resourcesTable.organizationId],
    references: [organizationsTable.id],
  }),
}))
