import { primaryKeyCol, timestampCols } from './_base.table'
import { usersTable } from './auth.table'
import { organizationsTable } from './organizations.table'
import { postsTable } from './posts.table'
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
      .references(() => postsTable.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationsTable.id, {
        onDelete: 'cascade',
      }),
    content: text('content').notNull(),
    ...timestampCols(),
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
