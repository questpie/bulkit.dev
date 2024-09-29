import { primaryKeyCol } from './_base.schema'
import { organizationsTable } from './organizations.schema'
import { relations } from 'drizzle-orm'
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const resourcesTable = pgTable('resources', {
  id: primaryKeyCol('id'),
  isExternal: boolean('is_external').notNull().default(false),
  location: text('location').notNull(), // URL of the resource if it's external, otherwise the local path inside storage
  type: text('type').notNull(), // e.g., 'image', 'video', 'audio'
  isPrivate: boolean('is_private').notNull().default(false),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' })
    .defaultNow()
    .$onUpdate(() => new Date().toISOString())
    .notNull(),
  organizationId: text('organization_id').notNull(),

  /**
   *  if set, the resource will be deleted at this time
   */
  cleanupAt: timestamp('cleanup_at', { mode: 'string' }),
})

export const resourcesRelations = relations(resourcesTable, ({ one }) => ({
  organization: one(organizationsTable, {
    fields: [resourcesTable.organizationId],
    references: [organizationsTable.id],
  }),
}))
