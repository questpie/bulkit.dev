import { primaryKeyCol } from './_base.schema'
import { usersTable } from './auth.schema'
import { PLATFORMS } from '../../../../../packages/shared/src/constants/db.constants'
import { relations } from 'drizzle-orm'
import { pgTable, jsonb, integer, boolean, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'

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

    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .defaultNow()
      .$onUpdate(() => new Date().toISOString())
      .notNull(),
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
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updadedAt: timestamp('updated_at', { mode: 'string' })
    .$defaultFn(() => new Date().toISOString())
    .notNull(),
})

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
