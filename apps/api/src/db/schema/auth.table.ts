// AUTH

import { primaryKeyCol, timestampCols, tokenCol } from './_base.table'
import type { DeviceInfo } from '@bulkit/api/modules/auth/utils/device-info'
import { relations } from 'drizzle-orm'
import { text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { pgTable, jsonb } from 'drizzle-orm/pg-core'

const USER_TYPES = ['user', 'ai'] as const

export const usersTable = pgTable(
  'users',
  {
    id: primaryKeyCol(),
    email: text('email').notNull(),
    name: text('name').notNull(),
    type: text('type', { enum: USER_TYPES }).default('user').notNull(),
    ...timestampCols(),
  },
  (table) => ({
    emailIndex: uniqueIndex().on(table.email),
  })
)

export type SelectUser = typeof usersTable.$inferSelect
export type InsertUser = typeof usersTable.$inferInsert

export const usersRelations = relations(usersTable, ({ many }) => ({
  sessions: many(sessionsTable),
  oauthAccounts: many(oauthAccountsTable),
}))

export const sessionsTable = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', {
    withTimezone: true,
    mode: 'date',
  }).notNull(),
  deviceFingerprint: text('device_fingerprint').notNull(),
  deviceInfo: jsonb('device_info').$type<DeviceInfo>().notNull(),
  ...timestampCols(),
})

export type SelectSession = typeof sessionsTable.$inferSelect
export type InsertSession = typeof sessionsTable.$inferInsert

export const sessionRelations = relations(sessionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [sessionsTable.userId],
    references: [usersTable.id],
  }),
}))

export type EmailVerificationType = 'magic-link' | 'auth-code'

export const emailVerificationsTable = pgTable('email_verifications', {
  id: tokenCol('id').primaryKey(),
  email: text('email').notNull(),
  expiresAt: timestamp('expires_at', {
    withTimezone: true,
    mode: 'date',
  }).notNull(),
  type: text('type').$type<EmailVerificationType>().notNull(),
  /** If you want your verification to be realtime store channelName here */
  // channelName: text('channel_name'),
  ...timestampCols(),
})

export type SelectEmailVerification = typeof emailVerificationsTable.$inferSelect
export type InsertEmailVerification = typeof emailVerificationsTable.$inferInsert

export const oauthAccountsTable = pgTable('oauth_accounts', {
  id: primaryKeyCol(),
  userId: text('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  ...timestampCols(),
})

export const oauthAccountsRelations = relations(oauthAccountsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [oauthAccountsTable.userId],
    references: [usersTable.id],
  }),
}))

export type SelectOAuthAccount = typeof oauthAccountsTable.$inferSelect
export type InsertOAuthAccount = typeof oauthAccountsTable.$inferInsert
