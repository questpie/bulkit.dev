import {
  organizationsTable,
  primaryKeyCol,
  timestampCols,
  usersTable,
} from '@bulkit/api/db/db.schema'
import {
  NOTIFICATION_REFERENCE_TYPES,
  NOTIFICATION_TYPES,
} from '@bulkit/shared/modules/notifications/notification.schemas'
import { relations } from 'drizzle-orm'
import { boolean, index, pgTable, text } from 'drizzle-orm/pg-core'

// Notifications for chat-related events
export const notificationsTable = pgTable(
  'notifications',
  {
    id: primaryKeyCol('id'),
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),

    // Notification content
    title: text('title').notNull(),
    message: text('message').notNull(),
    notificationType: text('notification_type', {
      enum: NOTIFICATION_TYPES,
    }).notNull(),

    // Related entities
    relatedEntityType: text('related_entity_type', {
      enum: NOTIFICATION_REFERENCE_TYPES,
    }),
    relatedEntityId: text('related_entity_id'),

    // Status
    isRead: boolean('is_read').default(false).notNull(),
    isActionable: boolean('is_actionable').default(false).notNull(),
    actionUrl: text('action_url'),

    ...timestampCols(),
  },
  (table) => [index().on(table.userId), index().on(table.organizationId)]
)

export const notificationsRelations = relations(notificationsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [notificationsTable.userId],
    references: [usersTable.id],
  }),
  organization: one(organizationsTable, {
    fields: [notificationsTable.organizationId],
    references: [organizationsTable.id],
  }),
}))
