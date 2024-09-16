import type { DeviceInfo } from '@bulkit/api/modules/auth/utils/device-info'
import cuid2 from '@paralleldrive/cuid2'
import { Type } from '@sinclair/typebox'
import { relations } from 'drizzle-orm'
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
} from '../../../../packages/shared/src/constants/db.constants'

const primaryKeyCol = (name = 'id') =>
  text(name)
    .$default(() => cuid2.createId())
    .primaryKey()

const verificationTokenCuid = cuid2.init({ length: 63 })

// Resources table for media assets
export type ResourceType = 'image' | 'video' | 'audio'
export const resourcesTable = pgTable('resources', {
  id: primaryKeyCol('id'),
  isExternal: boolean('is_external').notNull().default(false),
  location: text('location'), // URL of the resource if it's external, otherwise the local path inside storage
  type: text('type').$type<ResourceType>().notNull(), // e.g., 'image', 'video', 'audio'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
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
    type: text('type', { enum: POST_TYPE }).notNull(),
    status: text('status', { enum: POST_STATUS }).notNull().default('draft'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    organizationId: text('organization_id').notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    orgIdIdx: index().on(table.organizationId),
    typeIdx: index().on(table.type),
    statusIdx: index().on(table.status),
  })
)
export const insertPostSchema = createInsertSchema(postsTable)
export const selectPostSchema = createSelectSchema(postsTable)

export type SelectPost = typeof postsTable.$inferSelect
export type InsertPost = typeof postsTable.$inferInsert

export const postDetailsTable = pgTable(
  'post_details',
  {
    id: primaryKeyCol(),
    postId: text('post_id').notNull(),
    name: text('name').notNull(),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    postIdIdx: index().on(table.postId),
    versionIdx: index().on(table.version),
  })
)

export type SelectPostDetails = typeof postDetailsTable.$inferSelect
export type InsertPostDetails = typeof postDetailsTable.$inferInsert
export const insertPostDetailsSchema = createInsertSchema(postDetailsTable)
export const selectPostDetailsSchema = createSelectSchema(postDetailsTable)

// New table for thread posts
export const threadPostsTable = pgTable(
  'thread_posts',
  {
    id: primaryKeyCol('id'),
    postId: text('post_id').notNull(),
    order: integer('order').notNull(),
    text: text('text').notNull(),
    version: integer('version').notNull().default(1),
    createdBy: text('created_by').notNull(), // Added createdBy
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    postIdIdx: index().on(table.postId),
    versionIdx: index().on(table.version),
  })
)

export type SelectThreadPost = typeof threadPostsTable.$inferSelect
export type InsertThreadPost = typeof threadPostsTable.$inferInsert
export const insertThreadPostSchema = createInsertSchema(threadPostsTable)
export const selectThreadPostSchema = createSelectSchema(threadPostsTable)

// New table for thread media
export const threadMediaTable = pgTable('thread_media', {
  id: primaryKeyCol('id'),
  threadPostId: text('thread_post_id').notNull(),
  resourceId: text('resource_id').notNull(),
  order: integer('order').notNull(),
})

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
    version: integer('version').notNull().default(1),
    createdBy: text('created_by').notNull(), // Added createdBy
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    postIdIdx: index().on(table.postId),
    versionIdx: index().on(table.version),
  })
)

export type SelectRegularPost = typeof regularPostsTable.$inferSelect
export type InsertRegularPost = typeof regularPostsTable.$inferInsert
export const insertRegularPostSchema = createInsertSchema(regularPostsTable)
export const selectRegularPostSchema = createSelectSchema(regularPostsTable)

// New table for regular post media
export const regularPostMediaTable = pgTable('regular_post_media', {
  id: primaryKeyCol('id'),
  regularPostId: text('regular_post_id').notNull(),
  resourceId: text('resource_id').notNull(),
  order: integer('order').notNull(),
})

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
    resourceId: text('resource_id').notNull(),
    version: integer('version').notNull().default(1),
    createdBy: text('created_by').notNull(), // Added createdBy
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    postIdIdx: index().on(table.postId),
    resourceIdIdx: index().on(table.resourceId),
    versionIdx: index().on(table.version),
  })
)

export type SelectStoryPost = typeof storyPostsTable.$inferSelect
export type InsertStoryPost = typeof storyPostsTable.$inferInsert
export const insertStoryPostSchema = createInsertSchema(storyPostsTable)
export const selectStoryPostSchema = createSelectSchema(storyPostsTable)

// New table for short posts
export const shortPostsTable = pgTable(
  'short_posts',
  {
    id: primaryKeyCol(),
    postId: text('post_id').notNull(),
    resourceId: text('resource_id').notNull(),
    description: text('description').notNull(),
    version: integer('version').notNull().default(1),
    createdBy: text('created_by').notNull(), // Added createdBy
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    postIdIdx: index().on(table.postId),
    resourceIdIdx: index().on(table.resourceId),
    versionIdx: index().on(table.version),
  })
)

export type SelectShortPost = typeof shortPostsTable.$inferSelect
export type InsertShortPost = typeof shortPostsTable.$inferInsert
export const insertShortPostSchema = createInsertSchema(shortPostsTable)
export const selectShortPostSchema = createSelectSchema(shortPostsTable)

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
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
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
    tokenExpiry: timestamp('token_expiry'),
    scope: text('scope'),
    // additionalData: jsonb('additional_data'), // For any platform-specific data
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
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
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
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
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
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
  id: text('id')
    .primaryKey()
    .$default(() => verificationTokenCuid()),
  organizationId: text('organization_id').notNull(),
  email: text('email').notNull(),
  role: text('role', { enum: USER_ROLE }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
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
    status: text('status', { enum: CHANNEL_STATUS }).notNull().default('active'),
    organizationId: text('organization_id').notNull(),
    socialMediaIntegrationId: text('social_media_integration_id').references(
      () => socialMediaIntegrationsTable.id
    ),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
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
export const scheduledPostsTable = pgTable('scheduled_posts', {
  id: primaryKeyCol(),
  postId: text('post_id').notNull(),
  channelId: text('channel_id').notNull(), // Changed from platform to channelId
  scheduledAt: timestamp('scheduled_at').notNull(),
  status: text('status', { enum: SCHEDULED_POST_STATUS }).notNull().default('pending'), // pending, published, failed
  publishedAt: timestamp('published_at'),
  failureReason: text('failure_reason'),
  organizationId: text('organization_id').notNull(),
})

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
  shortPosts: many(shortPostsTable),
  scheduledPosts: many(scheduledPostsTable),
  postsDetails: many(postDetailsTable),
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

export const postDetailsRelations = relations(postDetailsTable, ({ one }) => ({
  post: one(postsTable, {
    fields: [postDetailsTable.postId],
    references: [postsTable.id],
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
export const scheduledPostsRelations = relations(scheduledPostsTable, ({ one }) => ({
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

export const shortPostsRelations = relations(shortPostsTable, ({ one }) => ({
  post: one(postsTable, {
    fields: [shortPostsTable.postId],
    references: [postsTable.id],
  }),
  resource: one(resourcesTable, {
    fields: [shortPostsTable.resourceId],
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
  createdAt: timestamp('created_at').defaultNow().notNull(),
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
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date()),
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
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date()),
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

export type SelectEmailVerification = typeof emailVerificationsTable.$inferSelect
export type InsertEmailVerification = typeof emailVerificationsTable.$inferInsert

export const oauthAccountsTable = pgTable('oauth_accounts', {
  id: primaryKeyCol(),
  userId: text('user_id')
    .notNull()
    .references(() => usersTable.id),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const oauthAccountsRelations = relations(oauthAccountsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [oauthAccountsTable.userId],
    references: [usersTable.id],
  }),
}))

export type SelectOAuthAccount = typeof oauthAccountsTable.$inferSelect
export type InsertOAuthAccount = typeof oauthAccountsTable.$inferInsert
