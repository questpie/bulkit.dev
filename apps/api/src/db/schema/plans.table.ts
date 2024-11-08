import { organizationsTable } from '@bulkit/api/db/db.schema'
import { timestampCols } from '@bulkit/api/db/schema/_base.table'
import { PLAN_SUBSCRIPTION_TYPES, PLATFORMS } from '@bulkit/shared/constants/db.constants'
import { relations } from 'drizzle-orm'
import { boolean, integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

export const plansTable = pgTable('plans', {
  id: text('id').primaryKey(),

  displayName: text('display_name').notNull(),

  /** If plan is default, it will be auto-assigned to organization upon creation   */
  isDefault: boolean('is_default').default(false),

  maxPosts: integer('max_posts').notNull(),
  maxPostsPerMonth: integer('max_posts_per_month').notNull(),
  maxChannels: integer('max_channels').notNull(),

  /**
   * If null, all platforms are allowed
   */
  allowedPlatforms: text({ enum: PLATFORMS }).array(),
  monthlyAICredits: integer('monthly_ai_credits').notNull(),

  monthlyPrice: integer('monthly_price'),
  annualPrice: integer('annual_price'),
  lifeTimePrice: integer('life_time_price'),
})

export const organizationPlansTable = pgTable(
  'organization_plans',
  {
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationsTable.id, {
        onDelete: 'cascade',
      }),
    planId: text('plan_id')
      .notNull()
      .references(() => plansTable.id, { onDelete: 'restrict' }),
    type: text('type', { enum: PLAN_SUBSCRIPTION_TYPES }).notNull(),
    /** this will be always prolonged after payment */
    expiresAt: timestamp('expires_at', { mode: 'string', withTimezone: true }),
    ...timestampCols(),
  },
  (t) => [uniqueIndex().on(t.organizationId)]
)

export const plansRelations = relations(plansTable, ({ many }) => ({
  organizationPlans: many(organizationPlansTable),
}))

export const organizationPlanRelations = relations(organizationPlansTable, ({ one }) => ({
  organization: one(organizationsTable, {
    fields: [organizationPlansTable.organizationId],
    references: [organizationsTable.id],
  }),
  plan: one(plansTable, {
    fields: [organizationPlansTable.planId],
    references: [plansTable.id],
  }),
}))
