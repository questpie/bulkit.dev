import { Type } from '@sinclair/typebox'
import { relations } from 'drizzle-orm'
import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'
import { USER_ROLE } from '../../../../../packages/shared/src/constants/db.constants'
import { primaryKeyCol, timestampCols, tokenCol } from './_base.table'
import { usersTable } from './auth.table'
import { channelsTable, socialMediaIntegrationsTable } from './channels.table'
import { postsTable } from './posts.table'
import { resourcesTable } from './resources.table'

// New UserOrganizations table for many-to-many relationship
export const userOrganizationsTable = pgTable(
  'user_organizations',
  {
    id: primaryKeyCol(),
    userId: text('user_id').notNull(),
    organizationId: text('organization_id').notNull(),
    role: text('role', { enum: USER_ROLE }).notNull(),
    ...timestampCols(),
  },
  (table) => ({
    userIdIdx: index().on(table.userId),
    orgIdIdx: index().on(table.organizationId),
    roleIdx: index().on(table.role),
  })
)

export type SelectUserOrganization = typeof userOrganizationsTable.$inferSelect
export type InsertUserOrganization = typeof userOrganizationsTable.$inferInsert
export const insertUserOrganizationSchema = createInsertSchema(userOrganizationsTable)
export const selectUserOrganizationSchema = createSelectSchema(userOrganizationsTable)

// New Organizations table
export const organizationsTable = pgTable('organizations', {
  id: primaryKeyCol(),
  name: text('name').notNull(),
  ...timestampCols(),
})

export type SelectOrganization = typeof organizationsTable.$inferSelect
export type InsertOrganization = typeof organizationsTable.$inferInsert
export const insertOrganizationSchema = createInsertSchema(organizationsTable, {
  id: Type.Never(),
  updatedAt: Type.Never(),
  createdAt: Type.Never(),
})
export const selectOrganizationSchema = createSelectSchema(organizationsTable)

// Add this new table definition
export const organizationInvitesTable = pgTable('organization_invites', {
  id: tokenCol('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  email: text('email').notNull(),
  role: text('role', { enum: USER_ROLE }).notNull(),
  expiresAt: timestamp('expires_at', { mode: 'string', withTimezone: true }).notNull(),
  ...timestampCols(),
})

export type SelectOrganizationInvite = typeof organizationInvitesTable.$inferSelect
export type InsertOrganizationInvite = typeof organizationInvitesTable.$inferInsert
export const insertOrganizationInviteSchema = createInsertSchema(organizationInvitesTable)
export const selectOrganizationInviteSchema = createSelectSchema(organizationInvitesTable)

export const organizationsRelations = relations(organizationsTable, ({ many }) => ({
  userOrganizations: many(userOrganizationsTable),
  posts: many(postsTable),
  socialMediaIntegrations: many(socialMediaIntegrationsTable),
  // scheduledPosts: many(scheduledPostsTable),
  resources: many(resourcesTable),
  channels: many(channelsTable), // Add this line
  invites: many(organizationInvitesTable),
}))

export const userOrganizationsRelations = relations(userOrganizationsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [userOrganizationsTable.userId],
    references: [usersTable.id],
  }),
  organization: one(organizationsTable, {
    fields: [userOrganizationsTable.organizationId],
    references: [organizationsTable.id],
  }),
}))
// Add this new relation
export const organizationInvitesRelations = relations(organizationInvitesTable, ({ one }) => ({
  organization: one(organizationsTable, {
    fields: [organizationInvitesTable.organizationId],
    references: [organizationsTable.id],
  }),
}))
