import { AI_CAPABILITIES } from '@bulkit/shared/modules/admin/schemas/ai-providers.schemas'
import {
  AI_TEXT_PROVIDER_TYPES,
  STOCK_IMAGE_PROVIDER_TYPES,
} from '@bulkit/shared/modules/app/app-constants'
import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'
import ms from 'ms'
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
  (table) => [uniqueIndex('platform_settings_platform_index').on(table.platform)]
)

export interface TimeInterval {
  /**
   * If number, it is in ms
   * IF string it is in ms() package format
   */
  maxAge: number | string
  /**
   * If number, it is in ms
   * IF string it is in ms() package format
   */
  delay: number | string
}

const DEFAULT_INTERVALS: TimeInterval[] = [
  { maxAge: ms('1h'), delay: ms('10m') },
  { maxAge: ms('4h'), delay: ms('30m') },
  { maxAge: ms('8h'), delay: ms('1h') },
  { maxAge: ms('1d'), delay: ms('2h') },
  { maxAge: ms('2d'), delay: ms('4h') },
  { maxAge: ms('3d'), delay: ms('8h') },
  { maxAge: ms('7d'), delay: ms('12h') },
  { maxAge: ms('1y'), delay: ms('1d') },
  { maxAge: ms('2y'), delay: ms('2yd') },
]

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
  collectMetricsIntervals: jsonb('collect_metrics_intervals')
    .$type<TimeInterval[]>()
    .notNull()
    .default(DEFAULT_INTERVALS),
})

export const aiTextProvidersTable = pgTable(
  'ai_text_provider',
  {
    id: primaryKeyCol(),
    name: text('name', { enum: AI_TEXT_PROVIDER_TYPES }).notNull(),
    model: text('model').notNull(),
    apiKey: text('api_key').notNull(),
    promptTokenToCreditCoefficient: real('prompt_token_to_credit_coefficient')
      .notNull()
      .default(0.0001),
    outputTokenToCreditCoefficient: real('output_token_to_credit_coefficient')
      .notNull()
      .default(0.0002),

    capabilities: text('capabilities', { enum: AI_CAPABILITIES }).array().notNull(),
    isActive: boolean('is_active').notNull().default(true),
    isDefaultFor: text('is_default_for', { enum: AI_CAPABILITIES }).array().notNull().default([]),

    ...timestampCols(),
  },
  (table) => [
    uniqueIndex()
      .on(table.isDefaultFor)
      .where(sql`cardinality(${table.isDefaultFor}) > 0`), // Only apply when isDefaultFor is not empty
  ]
)

export type AITextProvider = typeof aiTextProvidersTable.$inferSelect

export type SelectSuperAdmin = typeof superAdminsTable.$inferSelect
export type InsertSuperAdmin = typeof superAdminsTable.$inferInsert
export const insertSuperAdminSchema = createInsertSchema(superAdminsTable)
export const selectSuperAdminSchema = createSelectSchema(superAdminsTable)

export const stockImageProvidersTable = pgTable('stock_image_providers', {
  id: text('id', { enum: STOCK_IMAGE_PROVIDER_TYPES }).primaryKey(),
  apiKey: text('api_key').notNull(),
  ...timestampCols(),
})

export const superAdminsRelations = relations(superAdminsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [superAdminsTable.userId],
    references: [usersTable.id],
  }),
}))

export const appSettingsRelations = relations(appSettingsTable, ({ one }) => ({}))

export const aiTextProvidersRelations = relations(aiTextProvidersTable, ({ many, one }) => ({}))
