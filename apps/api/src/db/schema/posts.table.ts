import type {
  ParentPostSettingsSchema,
  RepostSettingsSchema,
} from '@bulkit/shared/modules/posts/posts.schemas'
import { relations } from 'drizzle-orm'
import {
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import type { Static } from 'elysia'
import {
  POST_STATUS,
  POST_TYPE,
  SCHEDULED_POST_STATUS,
} from '../../../../../packages/shared/src/constants/db.constants'
import { primaryKeyCol, timestampCols } from './_base.table'
import { channelsTable } from './channels.table'
import { commentsTable } from './comments.table'
import { organizationsTable } from './organizations.table'
import { resourcesTable } from './resources.table'

// Modified Posts table
export const postsTable = pgTable(
  'posts',
  {
    id: primaryKeyCol('id'),
    name: text('name').notNull(),
    status: text('status', { enum: POST_STATUS }).notNull(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationsTable.id, {
        onDelete: 'cascade',
      }),
    type: text('type', { enum: POST_TYPE }).notNull(),

    scheduledAt: timestamp('scheduled_at', { mode: 'string', withTimezone: true }),

    archivedAt: timestamp('archived_at', { mode: 'string', withTimezone: true }),

    // workflowId: text('workflow_id').references(() => workflowsTable.id),
    ...timestampCols(),
  },
  (table) => [index().on(table.organizationId), index().on(table.type)]
)

export type SelectPost = typeof postsTable.$inferSelect

// New table for thread posts
export const threadPostsTable = pgTable(
  'thread_posts',
  {
    id: primaryKeyCol('id'),
    postId: text('post_id')
      .references(() => postsTable.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    order: integer('order').notNull(),
    text: text('text').notNull(),
    ...timestampCols(),
  },
  (table) => [index().on(table.postId), uniqueIndex().on(table.order, table.postId)]
)

// New table for thread media
export const threadMediaTable = pgTable(
  'thread_media',
  {
    id: primaryKeyCol('id'),
    threadPostId: text('thread_post_id')
      .references(() => threadPostsTable.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    resourceId: text('resource_id')
      .references(() => resourcesTable.id, { onDelete: 'cascade' })
      .notNull(),
    order: integer('order').notNull(),

    ...timestampCols(),
  },
  (table) => [index().on(table.threadPostId), uniqueIndex().on(table.threadPostId, table.order)]
)

export type InsertThreadMedia = typeof threadMediaTable.$inferInsert

// New table for regular posts
export const regularPostsTable = pgTable(
  'regular_posts',
  {
    id: primaryKeyCol('id'),
    postId: text('post_id')
      .notNull()
      .references(() => postsTable.id, { onDelete: 'cascade' }),
    text: text('text').notNull(),

    ...timestampCols(),
  },
  (table) => [index().on(table.postId)]
)

// New table for regular post media
export const regularPostMediaTable = pgTable(
  'regular_post_media',
  {
    id: primaryKeyCol('id'),
    regularPostId: text('regular_post_id')
      .references(() => regularPostsTable.id, { onDelete: 'cascade' })
      .notNull(),
    resourceId: text('resource_id')
      .references(() => resourcesTable.id, { onDelete: 'cascade' })
      .notNull(),
    order: integer('order').notNull(),

    ...timestampCols(),
  },
  (table) => [index().on(table.regularPostId), uniqueIndex().on(table.regularPostId, table.order)]
)

// New table for story posts
export const storyPostsTable = pgTable(
  'story_posts',
  {
    id: primaryKeyCol('id'),
    postId: text('post_id')
      .notNull()
      .references(() => postsTable.id, { onDelete: 'cascade' }),
    resourceId: text('resource_id').references(() => resourcesTable.id, { onDelete: 'set null' }),

    ...timestampCols(),
  },
  (table) => [index().on(table.postId)]
)

// New table for reel posts
export const reelPostsTable = pgTable(
  'reel_posts',
  {
    id: primaryKeyCol(),
    postId: text('post_id')
      .notNull()
      .references(() => postsTable.id, { onDelete: 'cascade' }),
    resourceId: text('resource_id').references(() => resourcesTable.id, { onDelete: 'set null' }),
    description: text('description').notNull(),

    ...timestampCols(),
  },
  (table) => [index().on(table.postId), index().on(table.resourceId)]
)

export type RepostSettings = Static<typeof RepostSettingsSchema>
export type ParentPostSettings = Static<typeof ParentPostSettingsSchema>
// Scheduled Posts table (to handle the relationship between posts and platforms)
export const scheduledPostsTable = pgTable(
  'scheduled_posts',
  {
    id: primaryKeyCol(),
    postId: text('post_id')
      .notNull()
      .references(() => postsTable.id, { onDelete: 'cascade' }),
    channelId: text('channel_id')
      .references(() => channelsTable.id, { onDelete: 'cascade' })
      .notNull(),

    status: text('status', { enum: SCHEDULED_POST_STATUS }).notNull().default('draft'),

    scheduledAt: timestamp('scheduled_at', { mode: 'string', withTimezone: true }),
    publishedAt: timestamp('published_at', { mode: 'string', withTimezone: true }),
    failedAt: timestamp('failed_at', { mode: 'string', withTimezone: true }),
    startedAt: timestamp('started_at', { mode: 'string', withTimezone: true }),
    failureReason: text('failure_reason'),

    externalId: text('external_id'),

    parentPostId: text('parent_post_id'),
    parentPostSettings: jsonb('parent_post_settings').$type<ParentPostSettings>(),
    repostSettings: jsonb('repost_settings').$type<RepostSettings>(),

    ...timestampCols(),
  },
  (table) => [
    index().on(table.postId),
    index().on(table.channelId),
    uniqueIndex().on(table.postId, table.channelId),
    foreignKey({ columns: [table.parentPostId], foreignColumns: [table.id] }).onDelete('set null'),
  ]
)

export type SelectScheduledPost = typeof scheduledPostsTable.$inferSelect

// New table for metrics history
export const postMetricsHistoryTable = pgTable(
  'post_metrics_history',
  {
    id: primaryKeyCol(),
    scheduledPostId: text('scheduled_post_id')
      .notNull()
      .references(() => scheduledPostsTable.id, { onDelete: 'cascade' }),

    /** The number of likes or reactions the post has received */
    likes: integer('likes').notNull(),

    /** The number of comments or replies made on the post */
    comments: integer('comments').notNull(),

    /** The number of times the post has been shared by users */
    shares: integer('shares').notNull(),

    /* The total number of times the post has been displayed, including multiple views by the same user */
    impressions: integer('impressions').notNull(),

    /* The number of unique users who have seen the post, this may be hard to calculate */
    reach: integer('reach').notNull(),

    /** The number of times users have clicked on any links within the post */
    clicks: integer('clicks').notNull(),

    ...timestampCols(),
  },
  (table) => [index().on(table.scheduledPostId), index().on(table.createdAt)]
)

export type InsertPostMetricsHistory = typeof postMetricsHistoryTable.$inferInsert

// Add relations for the new table
export const postMetricsHistoryRelations = relations(postMetricsHistoryTable, ({ one }) => ({
  scheduledPost: one(scheduledPostsTable, {
    fields: [postMetricsHistoryTable.scheduledPostId],
    references: [scheduledPostsTable.id],
  }),
}))

export const postsRelations = relations(postsTable, ({ one, many }) => ({
  organization: one(organizationsTable, {
    fields: [postsTable.organizationId],
    references: [organizationsTable.id],
  }),
  threadPosts: many(threadPostsTable),
  regularPosts: many(regularPostsTable),
  storyPosts: many(storyPostsTable),
  reelPosts: many(reelPostsTable),
  scheduledPosts: many(scheduledPostsTable),
  comments: many(commentsTable),
}))

export const scheduledPostsRelations = relations(scheduledPostsTable, ({ one, many }) => ({
  post: one(postsTable, {
    fields: [scheduledPostsTable.postId],
    references: [postsTable.id],
  }),
  channel: one(channelsTable, {
    // Changed from platform to channel
    fields: [scheduledPostsTable.channelId],
    references: [channelsTable.id],
  }),
  metricsHistory: many(postMetricsHistoryTable), // Add this lines
  // organization: one(organizationsTable, {
  //   // Add this line
  //   fields: [scheduledPostsTable.],
  //   references: [organizationsTable.id],
  // }),
}))

export const threadPostsRelations = relations(threadPostsTable, ({ one, many }) => ({
  post: one(postsTable, {
    fields: [threadPostsTable.postId],
    references: [postsTable.id],
  }),
  media: many(threadMediaTable),
}))

export const threadMediaRelations = relations(threadMediaTable, ({ one }) => ({
  threadPost: one(threadPostsTable, {
    fields: [threadMediaTable.threadPostId],
    references: [threadPostsTable.id],
  }),
  resource: one(resourcesTable, {
    fields: [threadMediaTable.resourceId],
    references: [resourcesTable.id],
  }),
}))

export const regularPostsRelations = relations(regularPostsTable, ({ one, many }) => ({
  post: one(postsTable, {
    fields: [regularPostsTable.postId],
    references: [postsTable.id],
  }),
  media: many(regularPostMediaTable),
}))

export const regularPostMediaRelations = relations(regularPostMediaTable, ({ one }) => ({
  regularPost: one(regularPostsTable, {
    fields: [regularPostMediaTable.regularPostId],
    references: [regularPostsTable.id],
  }),
  resource: one(resourcesTable, {
    fields: [regularPostMediaTable.resourceId],
    references: [resourcesTable.id],
  }),
}))

export const storyPostsRelations = relations(storyPostsTable, ({ one }) => ({
  post: one(postsTable, {
    fields: [storyPostsTable.postId],
    references: [postsTable.id],
  }),
  resource: one(resourcesTable, {
    fields: [storyPostsTable.resourceId],
    references: [resourcesTable.id],
  }),
}))

export const reelPostsRelations = relations(reelPostsTable, ({ one }) => ({
  post: one(postsTable, {
    fields: [reelPostsTable.postId],
    references: [postsTable.id],
  }),
  resource: one(resourcesTable, {
    fields: [reelPostsTable.resourceId],
    references: [resourcesTable.id],
  }),
}))
