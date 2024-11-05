import { primaryKeyCol, timestampCols } from './_base.table'
import { organizationsTable } from './organizations.table'
import { relations } from 'drizzle-orm'
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const resourcesTable = pgTable('resources', {
  id: primaryKeyCol('id'),
  isExternal: boolean('is_external').notNull().default(false),
  location: text('location').notNull(), // URL of the resource if it's external, otherwise the local path inside storage
  type: text('type').notNull(), // e.g., 'image', 'video', 'audio'
  isPrivate: boolean('is_private').notNull().default(false),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizationsTable.id, {
      onDelete: 'cascade',
    }),

  /**
   *  if set, the resource will be deleted at this time
   */
  cleanupAt: timestamp('cleanup_at', { mode: 'string', withTimezone: true }),
  ...timestampCols(),
})

export const resourcesRelations = relations(resourcesTable, ({ one }) => ({
  organization: one(organizationsTable, {
    fields: [resourcesTable.organizationId],
    references: [organizationsTable.id],
  }),
}))
