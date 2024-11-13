import { organizationsTable } from '@bulkit/api/db/db.schema'
import { primaryKeyCol, timestampCols } from '@bulkit/api/db/schema/_base.table'
import { PLAN_STATUSES, SUBSCRIPTION_STATUSES } from '@bulkit/api/modules/plans/plans.constants'
import { PLATFORMS } from '@bulkit/shared/constants/db.constants'
import { relations } from 'drizzle-orm'
import { boolean, integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

export const plansTable = pgTable('plans', {
  id: text('id').primaryKey(),

  // Maps to Lemonsqueezy Product, only on CLOUD
  externalProductId: text('external_product_id'),

  displayName: text('display_name').notNull(),
  isDefault: boolean('is_default').default(false),

  status: text('status', { enum: PLAN_STATUSES }).notNull().default('active'),

  // Plan features
  maxPosts: integer('max_posts').notNull(),
  maxPostsPerMonth: integer('max_posts_per_month').notNull(),
  maxChannels: integer('max_channels').notNull(),
  allowedPlatforms: text({ enum: PLATFORMS }).array(),
  monthlyAICredits: integer('monthly_ai_credits').notNull(),

  ...timestampCols(),
})

export const subscriptionsTable = pgTable(
  'subscriptions',
  {
    id: primaryKeyCol('id'),

    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationsTable.id, {
        onDelete: 'cascade',
      }),
    planId: text('plan_id')
      .notNull()
      .references(() => plansTable.id, { onDelete: 'restrict' }),

    // Optional - only for CLOUD version
    externalSubscriptionId: text('external_subscription_id'),
    externalVariantId: text('external_variant_id'),

    status: text('status', {
      enum: SUBSCRIPTION_STATUSES,
    }).notNull(),

    // Optional - only for time-based subscriptions
    currentPeriodStart: timestamp('current_period_start', {
      mode: 'string',
      withTimezone: true,
    }),
    currentPeriodEnd: timestamp('current_period_end', {
      mode: 'string',
      withTimezone: true,
    }),

    ...timestampCols(),
  },
  (t) => [uniqueIndex().on(t.organizationId)]
)

// Relations
export const organizationRelations = relations(organizationsTable, ({ many }) => ({
  subscriptions: many(subscriptionsTable),
}))

export const planRelations = relations(plansTable, ({ many, one }) => ({
  subscriptions: many(subscriptionsTable),
}))

export const subscriptionRelations = relations(subscriptionsTable, ({ one }) => ({
  organization: one(organizationsTable, {
    fields: [subscriptionsTable.organizationId],
    references: [organizationsTable.id],
  }),
  plan: one(plansTable, {
    fields: [subscriptionsTable.planId],
    references: [plansTable.id],
  }),
}))
