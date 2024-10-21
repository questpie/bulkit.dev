import { relations } from 'drizzle-orm'
import { boolean, integer, jsonb, pgEnum, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'
import { PLATFORMS } from '../../../../../packages/shared/src/constants/db.constants'
import { primaryKeyCol, timestampCols } from './_base.table'
import { usersTable } from './auth.table'

// admin settings for platforms
export const platformSettingsTable = pgTable(
  'app_platform_settings',
  {
    id: primaryKeyCol(),
    platform: text('platform', {
      enum: PLATFORMS,
    }).notNull(),

    enabled: boolean('enabled').notNull().default(true),
    settings: jsonb('settings').notNull(),

    postLimit: integer('post_limit').notNull(),
    postLimitWindowSeconds: integer('post_limit_window_seconds').notNull(),

    maxPostLength: integer('max_post_length').notNull(),
    maxMediaPerPost: integer('max_media_per_post').notNull(),
    maxMediaSize: integer('max_media_size').notNull(),

    ...timestampCols(),
  },
  (table) => ({
    platformIndex: uniqueIndex('platform_settings_platform_index').on(table.platform),
  })
)

/**
 * We are keeping it like this so the SuperAdmin stuff is completely transparent to fe.
 * We don't want the users on fe to see isSuperAdmin:false in the network tab
 */
export const superAdminsTable = pgTable('super_admins', {
  userId: text('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' })
    .primaryKey(),
  ...timestampCols(),
})

export const appSettingsIdEnum = pgEnum('app_settings_id', ['app-settings'])

export const appSettingsTable = pgTable('app_settings', {
  id: appSettingsIdEnum('id').primaryKey().default('app-settings'),
  textAiProviderId: text('global_ai_provider_id').references(() => aiTextProvidersTable.id),
})

export const AI_TEXT_PROVIDER_TYPES = ['anthropic', 'openai', 'mistral'] as const
export type AITextProviderType = (typeof AI_TEXT_PROVIDER_TYPES)[number]
export const aiTextProvidersTable = pgTable('ai_text_provider', {
  id: primaryKeyCol(),
  name: text('name', { enum: AI_TEXT_PROVIDER_TYPES }).notNull(),
  model: text('model').notNull(),
  apiKey: text('api_key').notNull(),
  ...timestampCols(),
})

export type AITextProvider = typeof aiTextProvidersTable.$inferSelect

export type SelectSuperAdmin = typeof superAdminsTable.$inferSelect
export type InsertSuperAdmin = typeof superAdminsTable.$inferInsert
export const insertSuperAdminSchema = createInsertSchema(superAdminsTable)
export const selectSuperAdminSchema = createSelectSchema(superAdminsTable)

export const superAdminsRelations = relations(superAdminsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [superAdminsTable.userId],
    references: [usersTable.id],
  }),
}))

export const appSettingsRelations = relations(appSettingsTable, ({ one }) => ({
  textAiProvider: one(aiTextProvidersTable, {
    fields: [appSettingsTable.textAiProviderId],
    references: [aiTextProvidersTable.id],
  }),
}))

export const aiTextProvidersRelations = relations(aiTextProvidersTable, ({ many }) => ({
  appSettings: many(appSettingsTable),
}))
