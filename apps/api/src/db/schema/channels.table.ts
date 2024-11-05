import { primaryKeyCol, timestampCols } from './_base.table'
import { organizationsTable } from './organizations.table'
import { scheduledPostsTable } from './posts.table'
import {
  PLATFORMS,
  CHANNEL_STATUS,
} from '../../../../../packages/shared/src/constants/db.constants'
import { relations, sql } from 'drizzle-orm'
import { text, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { pgTable, jsonb } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'

// Social Media Integrations table (for OAuth details)
export const socialMediaIntegrationsTable = pgTable(
  'social_media_integrations',
  {
    id: primaryKeyCol(),
    platformAccountId: text('platform_account_id').notNull(),
    platform: text('platform', {
      enum: PLATFORMS,
    }).notNull(),
    accessToken: text('access_token').notNull(),
    refreshToken: text('refresh_token'),
    tokenExpiry: timestamp('token_expiry', { mode: 'string', withTimezone: true }),
    scope: text('scope'),
    additionalData: jsonb('additional_data').default(sql`'{}'::jsonb`),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationsTable.id, {
        onDelete: 'cascade',
      }),
    ...timestampCols(),
  },
  (table) => ({
    orgIdIdx: index().on(table.organizationId),
    platformIdx: index().on(table.platform),
    platformAccountIdIdx: index().on(table.platformAccountId),
    uniquePlatformIdx: uniqueIndex().on(
      table.platformAccountId,
      table.platform,
      table.organizationId
    ),
  })
)

export type SelectSocialMediaIntegration = typeof socialMediaIntegrationsTable.$inferSelect
export type InsertSocialMediaIntegration = typeof socialMediaIntegrationsTable.$inferInsert
export const insertSocialMediaIntegrationSchema = createInsertSchema(socialMediaIntegrationsTable)
export const selectSocialMediaIntegrationSchema = createSelectSchema(socialMediaIntegrationsTable)

// New Channels table
export const channelsTable = pgTable(
  'channels',
  {
    id: primaryKeyCol(),
    name: text('name').notNull(),
    handle: text('username'),
    platform: text('platform', { enum: PLATFORMS }).notNull(),
    imageUrl: text('image_url'),
    url: text('url'),
    status: text('status', { enum: CHANNEL_STATUS }).notNull().default('active'),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationsTable.id, {
        onDelete: 'cascade',
      }),
    socialMediaIntegrationId: text('social_media_integration_id').references(
      () => socialMediaIntegrationsTable.id
    ),

    archivedAt: timestamp('archived_at', { mode: 'string', withTimezone: true }),
    ...timestampCols(),
  },
  (table) => ({
    platformIdx: index().on(table.platform),
    statusIdx: index().on(table.status),
    orgIdIdx: index().on(table.organizationId),
    socialMediaIntegrationIdIdx: uniqueIndex().on(table.socialMediaIntegrationId), // Add this line
  })
)

export type SelectChannel = typeof channelsTable.$inferSelect
export type InsertChannel = typeof channelsTable.$inferInsert
export const insertChannelSchema = createInsertSchema(channelsTable)
export const selectChannelSchema = createSelectSchema(channelsTable)

export const channelsRelations = relations(channelsTable, ({ one, many }) => ({
  organization: one(organizationsTable, {
    fields: [channelsTable.organizationId],
    references: [organizationsTable.id],
  }),
  socialMediaIntegration: one(socialMediaIntegrationsTable, {
    // Add this relation
    fields: [channelsTable.socialMediaIntegrationId],
    references: [socialMediaIntegrationsTable.id],
  }),
  scheduledPosts: many(scheduledPostsTable),
}))

export const socialMediaIntegrationsRelations = relations(
  socialMediaIntegrationsTable,
  ({ one, many }) => ({
    organization: one(organizationsTable, {
      fields: [socialMediaIntegrationsTable.organizationId],
      references: [organizationsTable.id],
    }),
    channels: many(channelsTable), // Add this line
  })
)
