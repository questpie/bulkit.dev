import cuid2 from '@paralleldrive/cuid2'
import type { DeviceInfo } from '@questpie/api/modules/auth/utils/device-info'
import { relations } from 'drizzle-orm'
import { jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

const primaryKey = (name = 'id') =>
  text(name)
    .$default(() => cuid2.createId())
    .primaryKey()

const verificationTokenCuid = cuid2.init({ length: 63 })

export const userTable = pgTable(
  'user',
  {
    id: primaryKey(),
    email: text('email').notNull(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    emailIndex: uniqueIndex().on(table.email),
  })
)

export type SelectUser = typeof userTable.$inferSelect
export type InsertUser = typeof userTable.$inferInsert

export const userRelations = relations(userTable, ({ many }) => ({
  sessions: many(sessionTable),
  emailVerifications: many(emailVerificationTable),
  oauthAccounts: many(oauthAccountsTable),
}))

export const sessionTable = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.id),
  expiresAt: timestamp('expires_at', {
    withTimezone: true,
    mode: 'date',
  }).notNull(),
  deviceFingerprint: text('device_fingerprint').notNull(),
  deviceInfo: jsonb('device_info').$type<DeviceInfo>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export type SelectSession = typeof sessionTable.$inferSelect
export type InsertSession = typeof sessionTable.$inferInsert

export const sessionRelations = relations(sessionTable, ({ one }) => ({
  user: one(userTable, {
    fields: [sessionTable.userId],
    references: [userTable.id],
  }),
}))

export type EmailVerificationType = 'magic-link' | 'auth-code'

export const emailVerificationTable = pgTable('email_verification', {
  id: text('id')
    .primaryKey()
    .$default(() => verificationTokenCuid()),
  email: text('email').notNull(),
  expiresAt: timestamp('expires_at', {
    withTimezone: true,
    mode: 'date',
  }).notNull(),
  type: text('type').$type<EmailVerificationType>().notNull(),
  /** If you want your verification to be realtime store channelName here */
  // channelName: text('channel_name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export type SelectEmailVerification = typeof emailVerificationTable.$inferSelect
export type InsertEmailVerification = typeof emailVerificationTable.$inferInsert

export const oauthAccountsTable = pgTable('oauth_accounts', {
  id: primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.id),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const oauthAccountsRelations = relations(oauthAccountsTable, ({ one }) => ({
  user: one(userTable, {
    fields: [oauthAccountsTable.userId],
    references: [userTable.id],
  }),
}))

export type SelectOAuthAccount = typeof oauthAccountsTable.$inferSelect
export type InsertOAuthAccount = typeof oauthAccountsTable.$inferInsert
