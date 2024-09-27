import { relations } from 'drizzle-orm'
import { index, integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'
import {
  POST_STATUS,
  POST_TYPE,
  SCHEDULED_POST_STATUS,
} from '../../../../../packages/shared/src/constants/db.constants'
import { primaryKeyCol } from './_base.schema'
import { channelsTable } from './channels.schema'
import { commentsTable } from './comments.schema'
import { organizationsTable } from './organizations.schema'
import { resourcesTable } from './resources.schema'
import { workflowsTable } from './workflows.schema'

// Modified Posts table
export const postsTable = pgTable(
  'posts',
  {
    id: primaryKeyCol('id'),
    name: text('name').notNull(),
    status: text('status', { enum: POST_STATUS }).notNull(),
    organizationId: text('organization_id').notNull(),
    type: text('type', { enum: POST_TYPE }).notNull(),
    workflowId: text('workflow_id').references(() => workflowsTable.id),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .defaultNow()
      .$onUpdate(() => new Date().toISOString())
      .notNull(),
  },
  (table) => ({
    orgIdIdx: index().on(table.organizationId),
    typeIdx: index().on(table.type),
  })
)
export const insertPostSchema = createInsertSchema(postsTable)
export const selectPostSchema = createSelectSchema(postsTable)

export type SelectPost = typeof postsTable.$inferSelect
export type InsertPost = typeof postsTable.$inferInsert

// New table for thread posts
export const threadPostsTable = pgTable(
  'thread_posts',
  {
    id: primaryKeyCol('id'),
    postId: text('post_id')
      .references(() => postsTable.id)
      .notNull(),
    order: integer('order').notNull(),
    text: text('text').notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .$onUpdate(() => new Date().toISOString())
      .notNull(),
  },
  (table) => ({
    postIdIdx: index().on(table.postId),
    orderIdx: uniqueIndex().on(table.order, table.postId),
  })
)

export type SelectThreadPost = typeof threadPostsTable.$inferSelect
export type InsertThreadPost = typeof threadPostsTable.$inferInsert
export const insertThreadPostSchema = createInsertSchema(threadPostsTable)
export const selectThreadPostSchema = createSelectSchema(threadPostsTable)

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

    createAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .$onUpdate(() => new Date().toISOString())
      .notNull(),
  },
  (table) => ({
    treadPostIdIdx: index().on(table.threadPostId),
    orderIdx: uniqueIndex().on(table.threadPostId, table.order),
  })
)

export type SelectThreadMedia = typeof threadMediaTable.$inferSelect
export type InsertThreadMedia = typeof threadMediaTable.$inferInsert
export const insertThreadMediaSchema = createInsertSchema(threadMediaTable)
export const selectThreadMediaSchema = createSelectSchema(threadMediaTable)

// New table for regular posts
export const regularPostsTable = pgTable(
  'regular_posts',
  {
    id: primaryKeyCol('id'),
    postId: text('post_id').notNull(),
    text: text('text').notNull(),

    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .$onUpdate(() => new Date().toISOString())
      .notNull(),
  },
  (table) => ({
    postIdIdx: index().on(table.postId),
  })
)

export type SelectRegularPost = typeof regularPostsTable.$inferSelect
export type InsertRegularPost = typeof regularPostsTable.$inferInsert
export const insertRegularPostSchema = createInsertSchema(regularPostsTable)
export const selectRegularPostSchema = createSelectSchema(regularPostsTable)

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

    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .$onUpdate(() => new Date().toISOString())
      .notNull(),
  },
  (table) => ({
    regularPostIdIdx: index().on(table.regularPostId),
    orderIdx: uniqueIndex().on(table.regularPostId, table.order),
  })
)

export type SelectRegularPostMedia = typeof regularPostMediaTable.$inferSelect
export type InsertRegularPostMedia = typeof regularPostMediaTable.$inferInsert
export const insertRegularPostMediaSchema = createInsertSchema(regularPostMediaTable)
export const selectRegularPostMediaSchema = createSelectSchema(regularPostMediaTable)

// New table for story posts
export const storyPostsTable = pgTable(
  'story_posts',
  {
    id: primaryKeyCol('id'),
    postId: text('post_id').notNull(),
    resourceId: text('resource_id'),

    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).$onUpdate(() =>
      new Date().toISOString()
    ),
  },
  (table) => ({
    postIdIdx: index().on(table.postId),
  })
)

export type SelectStoryPost = typeof storyPostsTable.$inferSelect
export type InsertStoryPost = typeof storyPostsTable.$inferInsert
export const insertStoryPostSchema = createInsertSchema(storyPostsTable)
export const selectStoryPostSchema = createSelectSchema(storyPostsTable)

// New table for reel posts
export const reelPostsTable = pgTable(
  'reel_posts',
  {
    id: primaryKeyCol(),
    postId: text('post_id').notNull(),
    resourceId: text('resource_id'),
    description: text('description').notNull(),

    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).$onUpdate(() =>
      new Date().toISOString()
    ),
  },
  (table) => ({
    postIdIdx: index().on(table.postId),
    resourceIdIdx: index().on(table.resourceId),
  })
)

export type SelectReelPost = typeof reelPostsTable.$inferSelect
export type InsertReelPost = typeof reelPostsTable.$inferInsert
export const insertReelPostSchema = createInsertSchema(reelPostsTable)
export const selectReelPostSchema = createSelectSchema(reelPostsTable)

// Scheduled Posts table (to handle the relationship between posts and platforms)
export const scheduledPostsTable = pgTable(
  'scheduled_posts',
  {
    id: primaryKeyCol(),
    postId: text('post_id').notNull(),
    channelId: text('channel_id')
      .references(() => channelsTable.id)
      .notNull(),
    scheduledAt: timestamp('scheduled_at', { mode: 'string' }),
    status: text('status', { enum: SCHEDULED_POST_STATUS }).notNull().default('pending'),
    publishedAt: timestamp('published_at', { mode: 'string' }),
    failureReason: text('failure_reason'),
    organizationId: text('organization_id')
      .references(() => organizationsTable.id)
      .notNull(),
  },
  (table) => ({
    postIdIdx: index().on(table.postId),
    channelIdIdx: index().on(table.channelId),
    statusIdx: index().on(table.status),
    orgIdIdx: index().on(table.organizationId),
    compountIdx: uniqueIndex().on(table.postId, table.channelId),
  })
)

// New table for metrics history
export const postMetricsHistoryTable = pgTable(
  'post_metrics_history',
  {
    id: primaryKeyCol(),
    scheduledPostId: text('scheduled_post_id')
      .notNull()
      .references(() => scheduledPostsTable.id),

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

    createdAt: timestamp('timestamp', { mode: 'string' }).notNull(),
  },
  (table) => ({
    scheduledPostIdIdx: index().on(table.scheduledPostId),
    craetedAtIdx: index().on(table.createdAt),
  })
)

export type SelectPostMetricsHistory = typeof postMetricsHistoryTable.$inferSelect
export type InsertPostMetricsHistory = typeof postMetricsHistoryTable.$inferInsert
export const insertPostMetricsHistorySchema = createInsertSchema(postMetricsHistoryTable)
export const selectPostMetricsHistorySchema = createSelectSchema(postMetricsHistoryTable)

// Add relations for the new table
export const postMetricsHistoryRelations = relations(postMetricsHistoryTable, ({ one }) => ({
  scheduledPost: one(scheduledPostsTable, {
    fields: [postMetricsHistoryTable.scheduledPostId],
    references: [scheduledPostsTable.id],
  }),
}))

export type SelectScheduledPost = typeof scheduledPostsTable.$inferSelect
export type InsertScheduledPost = typeof scheduledPostsTable.$inferInsert
export const insertScheduledPostSchema = createInsertSchema(scheduledPostsTable)
export const selectScheduledPostSchema = createSelectSchema(scheduledPostsTable)

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
  organization: one(organizationsTable, {
    fields: [scheduledPostsTable.organizationId],
    references: [organizationsTable.id],
  }),
  metricsHistory: many(postMetricsHistoryTable), // Add this lines
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
