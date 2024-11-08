import { subscriptionsTable } from '@bulkit/api/db/db.schema'
import { Type } from '@sinclair/typebox'
import { relations } from 'drizzle-orm'
import { index, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
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
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationsTable.id, {
        onDelete: 'cascade',
      }),
    role: text('role', { enum: USER_ROLE }).notNull(),
    ...timestampCols(),
  },
  (t) => [
    index().on(t.userId),
    index().on(t.organizationId),
    index().on(t.role),
    uniqueIndex().on(t.userId, t.organizationId),
  ]
)

export type SelectUserOrganization = typeof userOrganizationsTable.$inferSelect
export type InsertUserOrganization = typeof userOrganizationsTable.$inferInsert
export const insertUserOrganizationSchema = createInsertSchema(userOrganizationsTable)
export const selectUserOrganizationSchema = createSelectSchema(userOrganizationsTable)

// New Organizations table
export const organizationsTable = pgTable('organizations', {
  id: primaryKeyCol(),
  name: text('name').notNull(),
  externalCustomerId: text('external_customer_id'),
  // affiliate_id: text('affiliate_id'),
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
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizationsTable.id, {
      onDelete: 'cascade',
    }),
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
  channels: many(channelsTable),
  invites: many(organizationInvitesTable),
  plans: many(subscriptionsTable),
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
