import { primaryKeyCol, timestampCols } from './_base.table'
import { usersTable } from './auth.table'
import { organizationsTable } from './organizations.table'
import { postsTable } from './posts.table'
import { relations } from 'drizzle-orm'
import { text, jsonb, index } from 'drizzle-orm/pg-core'
import { pgTable } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'

export const postHistoryTable = pgTable(
  'post_history',
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
    snapshot: jsonb('snapshot').notNull(), // The full post data at this point
    changeDescription: text('change_description').notNull(), // Description of what changed
    ...timestampCols(),
  },
  (table) => ({
    postIdIdx: index().on(table.postId),
    userIdIdx: index().on(table.userId),
    orgIdIdx: index().on(table.organizationId),
  })
)

export type SelectPostHistory = typeof postHistoryTable.$inferSelect
export type InsertPostHistory = typeof postHistoryTable.$inferInsert
export const insertPostHistorySchema = createInsertSchema(postHistoryTable)
export const selectPostHistorySchema = createSelectSchema(postHistoryTable)

export const postHistoryRelations = relations(postHistoryTable, ({ one }) => ({
  post: one(postsTable, {
    fields: [postHistoryTable.postId],
    references: [postsTable.id],
  }),
  user: one(usersTable, {
    fields: [postHistoryTable.userId],
    references: [usersTable.id],
  }),
  organization: one(organizationsTable, {
    fields: [postHistoryTable.organizationId],
    references: [organizationsTable.id],
  }),
}))
