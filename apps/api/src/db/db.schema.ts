import type { DeviceInfo } from '@bulkit/api/modules/auth/utils/device-info'
import cuid2 from '@paralleldrive/cuid2'
import { Type } from '@sinclair/typebox'
import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'
import {
  CHANNEL_STATUS,
  PLATFORMS,
  POST_STATUS,
  POST_TYPE,
  SCHEDULED_POST_STATUS,
  USER_ROLE,
  WORKFLOW_STEP_TYPES,
} from '../../../../packages/shared/src/constants/db.constants'
import type { WorkflowStepConfig } from '@bulkit/shared/modules/workflows/workflows.constants'

/**
 * Primary key generates a unique id using cuid2 thats 16
 */
const primaryKeyCol = (name = 'id') =>
  text(name)
    .$default(() => cuid2.createId())
    .primaryKey()

const longCuid = cuid2.init({ length: 64 })

const tokenCol = (name = 'token') => text(name).$default(() => longCuid())

// Workflows
export const workflowsTable = pgTable('workflows', {
  id: primaryKeyCol(),
  name: text('name').notNull(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizationsTable.id),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' })
    .defaultNow()
    .$onUpdate(() => new Date().toISOString())
    .notNull(),
})

// Workflow steps table with parentStepId
export const workflowStepsTable = pgTable('workflow_steps', {
  id: primaryKeyCol(),
  workflowId: text('workflow_id')
    .notNull()
    .references(() => workflowsTable.id),
  parentStepId: text('parent_step_id'),
  type: text('type', { enum: WORKFLOW_STEP_TYPES }).notNull(),
  config: jsonb('config').$type<WorkflowStepConfig>().notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' })
    .defaultNow()
    .$onUpdate(() => new Date().toISOString())
    .notNull(),
})

// Workflow executions table
export const workflowExecutionsTable = pgTable('workflow_executions', {
  id: primaryKeyCol(),
  workflowId: text('workflow_id')
    .notNull()
    .references(() => workflowsTable.id),
  status: text('status', { enum: ['pending', 'in_progress', 'completed', 'failed'] }).notNull(),
  currentStepId: text('current_step_id').references(() => workflowStepsTable.id),
  startedAt: timestamp('started_at', { mode: 'string' }),
  completedAt: timestamp('completed_at', { mode: 'string' }),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' })
    .defaultNow()
    .$onUpdate(() => new Date().toISOString())
    .notNull(),
})

// Reposts table
export const repostsTable = pgTable('reposts', {
  id: primaryKeyCol(),
  originalPostId: text('original_post_id')
    .notNull()
    .references(() => postsTable.id),
  repostedPostId: text('reposted_post_id')
    .notNull()
    .references(() => postsTable.id),
  workflowStepId: text('workflow_step_id')
    .notNull()
    .references(() => workflowStepsTable.id),
  channelId: text('channel_id')
    .notNull()
    .references(() => channelsTable.id),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
})

// Resources table for media assets
export type ResourceType = 'image' | 'video' | 'audio'
export const resourcesTable = pgTable('resources', {
  id: primaryKeyCol('id'),
  isExternal: boolean('is_external').notNull().default(false),
  location: text('location').notNull(), // URL of the resource if it's external, otherwise the local path inside storage
  type: text('type').notNull(), // e.g., 'image', 'video', 'audio'
  isPrivate: boolean('is_private').notNull().default(false),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' })
    .defaultNow()
    .$onUpdate(() => new Date().toISOString())
    .notNull(),
  organizationId: text('organization_id').notNull(),
})

export type SelectResource = typeof resourcesTable.$inferSelect
export type InsertResource = typeof resourcesTable.$inferInsert
export const insertResourceSchema = createInsertSchema(resourcesTable)
export const selectResourceSchema = createSelectSchema(resourcesTable)

// Modified Posts table
export const postsTable = pgTable(
  'posts',
  {
    id: primaryKeyCol('id'),
    name: text('name').notNull(),
    status: text('status', { enum: POST_STATUS }).notNull(),
    organizationId: text('organization_id').notNull(),
    type: text('type', { enum: POST_TYPE }).notNull(),
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

// Social Media Integrations table (for OAuth details)
export const socialMediaIntegrationsTable = pgTable(
  'social_media_integrations',
  {
    id: primaryKeyCol(),
    platformAccountId: text('platform_account_id').notNull(),
    platform: text('platform', {
      enum: PLATFORMS,
    }).notNull(),
    accessToken: text('access_token').notNull(),
    refreshToken: text('refresh_token'),
    tokenExpiry: timestamp('token_expiry', { mode: 'string' }),
    scope: text('scope'),
    additionalData: jsonb('additional_data').default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .defaultNow()
      .$onUpdate(() => new Date().toISOString())
      .notNull(),
    organizationId: text('organization_id').notNull(),
  },
  (table) => ({
    orgIdIdx: index().on(table.organizationId),
    platformIdx: index().on(table.platform),
    platformAccountIdIdx: index().on(table.platformAccountId),
    uniquePlatformIdx: uniqueIndex().on(
      table.platformAccountId,
      table.platform,
      table.organizationId
    ),
  })
)

export type SelectSocialMediaIntegration = typeof socialMediaIntegrationsTable.$inferSelect
export type InsertSocialMediaIntegration = typeof socialMediaIntegrationsTable.$inferInsert
export const insertSocialMediaIntegrationSchema = createInsertSchema(socialMediaIntegrationsTable)
export const selectSocialMediaIntegrationSchema = createSelectSchema(socialMediaIntegrationsTable)

// New UserOrganizations table for many-to-many relationship
export const userOrganizationsTable = pgTable(
  'user_organizations',
  {
    id: primaryKeyCol(),
    userId: text('user_id').notNull(),
    organizationId: text('organization_id').notNull(),
    role: text('role', { enum: USER_ROLE }).notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .defaultNow()
      .$onUpdate(() => new Date().toISOString())
      .notNull(),
  },
  (table) => ({
    userIdIdx: index().on(table.userId),
    orgIdIdx: index().on(table.organizationId),
    roleIdx: index().on(table.role),
  })
)

export type SelectUserOrganization = typeof userOrganizationsTable.$inferSelect
export type InsertUserOrganization = typeof userOrganizationsTable.$inferInsert
export const insertUserOrganizationSchema = createInsertSchema(userOrganizationsTable)
export const selectUserOrganizationSchema = createSelectSchema(userOrganizationsTable)

// New Organizations table
export const organizationsTable = pgTable('organizations', {
  id: primaryKeyCol(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' })
    .defaultNow()
    .$onUpdate(() => new Date().toISOString())
    .notNull(),
})

export type SelectOrganization = typeof organizationsTable.$inferSelect
export type InsertOrganization = typeof organizationsTable.$inferInsert
export const insertOrganizationSchema = createInsertSchema(organizationsTable, {
  id: Type.Never(),
  updatedAt: Type.Never(),
  createdAt: Type.Never(),
})
export const selectOrganizationSchema = createSelectSchema(organizationsTable)

// Add this new table definition
export const organizationInvitesTable = pgTable('organization_invites', {
  id: tokenCol('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  email: text('email').notNull(),
  role: text('role', { enum: USER_ROLE }).notNull(),
  expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' })
    .defaultNow()
    .$onUpdate(() => new Date().toISOString())
    .notNull(),
})

export type SelectOrganizationInvite = typeof organizationInvitesTable.$inferSelect
export type InsertOrganizationInvite = typeof organizationInvitesTable.$inferInsert
export const insertOrganizationInviteSchema = createInsertSchema(organizationInvitesTable)
export const selectOrganizationInviteSchema = createSelectSchema(organizationInvitesTable)

// New Channels table
export const channelsTable = pgTable(
  'channels',
  {
    id: primaryKeyCol(),
    name: text('name').notNull(),
    platform: text('platform', { enum: PLATFORMS }).notNull(),
    imageUrl: text('image_url'),
    url: text('url'),
    status: text('status', { enum: CHANNEL_STATUS }).notNull().default('active'),
    organizationId: text('organization_id').notNull(),
    socialMediaIntegrationId: text('social_media_integration_id').references(
      () => socialMediaIntegrationsTable.id
    ),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .defaultNow()
      .$onUpdate(() => new Date().toISOString())
      .notNull(),
  },
  (table) => ({
    platformIdx: index().on(table.platform),
    statusIdx: index().on(table.status),
    orgIdIdx: index().on(table.organizationId),
    socialMediaIntegrationIdIdx: uniqueIndex().on(table.socialMediaIntegrationId), // Add this line
  })
)

export type SelectChannel = typeof channelsTable.$inferSelect
export type InsertChannel = typeof channelsTable.$inferInsert
export const insertChannelSchema = createInsertSchema(channelsTable)
export const selectChannelSchema = createSelectSchema(channelsTable)

// Scheduled Posts table (to handle the relationship between posts and platforms)
export const scheduledPostsTable = pgTable(
  'scheduled_posts',
  {
    id: primaryKeyCol(),
    postId: text('post_id').notNull(),
    channelId: text('channel_id')
      .references(() => channelsTable.id)
      .notNull(),
    scheduledAt: timestamp('scheduled_at', { mode: 'string' }).notNull(),
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

export const organizationsRelations = relations(organizationsTable, ({ many }) => ({
  userOrganizations: many(userOrganizationsTable),
  posts: many(postsTable),
  socialMediaIntegrations: many(socialMediaIntegrationsTable),
  scheduledPosts: many(scheduledPostsTable),
  resources: many(resourcesTable),
  channels: many(channelsTable), // Add this line
  invites: many(organizationInvitesTable),
}))

export const userOrganizationsRelations = relations(userOrganizationsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [userOrganizationsTable.userId],
    references: [usersTable.id],
  }),
  organization: one(organizationsTable, {
    fields: [userOrganizationsTable.organizationId],
    references: [organizationsTable.id],
  }),
}))
// Add this new relation
export const organizationInvitesRelations = relations(organizationInvitesTable, ({ one }) => ({
  organization: one(organizationsTable, {
    fields: [organizationInvitesTable.organizationId],
    references: [organizationsTable.id],
  }),
}))

export const resourcesRelations = relations(resourcesTable, ({ one }) => ({
  organization: one(organizationsTable, {
    fields: [resourcesTable.organizationId],
    references: [organizationsTable.id],
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

// Add relations for the channelsTable
export const channelsRelations = relations(channelsTable, ({ one, many }) => ({
  organization: one(organizationsTable, {
    fields: [channelsTable.organizationId],
    references: [organizationsTable.id],
  }),
  socialMediaIntegration: one(socialMediaIntegrationsTable, {
    // Add this relation
    fields: [channelsTable.socialMediaIntegrationId],
    references: [socialMediaIntegrationsTable.id],
  }),
  scheduledPosts: many(scheduledPostsTable),
}))

// Update scheduledPostsRelations to reference channels
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

// Update socialMediaIntegrationsRelations to include the reverse relation
export const socialMediaIntegrationsRelations = relations(
  socialMediaIntegrationsTable,
  ({ one, many }) => ({
    organization: one(organizationsTable, {
      fields: [socialMediaIntegrationsTable.organizationId],
      references: [organizationsTable.id],
    }),
    channels: many(channelsTable), // Add this line
  })
)

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

// AUTH

export const usersTable = pgTable(
  'users',
  {
    id: primaryKeyCol(),
    email: text('email').notNull(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .defaultNow()
      .$onUpdate(() => new Date().toISOString()),
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
    .references(() => usersTable.id),
  expiresAt: timestamp('expires_at', {
    withTimezone: true,
    mode: 'date',
  }).notNull(),
  deviceFingerprint: text('device_fingerprint').notNull(),
  deviceInfo: jsonb('device_info').$type<DeviceInfo>().notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' })
    .defaultNow()
    .$onUpdate(() => new Date().toISOString()),
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
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' })
    .defaultNow()
    .$onUpdate(() => new Date().toISOString()),
})

export type SelectEmailVerification = typeof emailVerificationsTable.$inferSelect
export type InsertEmailVerification = typeof emailVerificationsTable.$inferInsert

export const oauthAccountsTable = pgTable('oauth_accounts', {
  id: primaryKeyCol(),
  userId: text('user_id')
    .notNull()
    .references(() => usersTable.id),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
})

export const oauthAccountsRelations = relations(oauthAccountsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [oauthAccountsTable.userId],
    references: [usersTable.id],
  }),
}))

export type SelectOAuthAccount = typeof oauthAccountsTable.$inferSelect
export type InsertOAuthAccount = typeof oauthAccountsTable.$inferInsert
