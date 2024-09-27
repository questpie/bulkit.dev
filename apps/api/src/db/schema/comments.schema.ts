import { primaryKeyCol } from './_base.schema'
import { usersTable } from './auth.schema'
import { organizationsTable } from './organizations.schema'
import { postsTable } from './posts.schema'
import { relations } from 'drizzle-orm'
import { text, timestamp, index } from 'drizzle-orm/pg-core'
import { pgTable } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'

export const commentsTable = pgTable(
  'comments',
  {
    id: primaryKeyCol(),
    postId: text('post_id')
      .notNull()
      .references(() => postsTable.id),
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationsTable.id),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .defaultNow()
      .$onUpdate(() => new Date().toISOString())
      .notNull(),
  },
  (table) => ({
    postIdIdx: index().on(table.postId),
    userIdIdx: index().on(table.userId),
    orgIdIdx: index().on(table.organizationId),
  })
)

export type SelectComment = typeof commentsTable.$inferSelect
export type InsertComment = typeof commentsTable.$inferInsert
export const insertCommentSchema = createInsertSchema(commentsTable)
export const selectCommentSchema = createSelectSchema(commentsTable)

export const commentsRelations = relations(commentsTable, ({ one }) => ({
  post: one(postsTable, {
    fields: [commentsTable.postId],
    references: [postsTable.id],
  }),
  user: one(usersTable, {
    fields: [commentsTable.userId],
    references: [usersTable.id],
  }),
  organization: one(organizationsTable, {
    fields: [commentsTable.organizationId],
    references: [organizationsTable.id],
  }),
}))
