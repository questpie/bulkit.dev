import type { TransactionLike } from '@bulkit/api/db/db.client'
import { organizationsTable, plansTable, subscriptionsTable } from '@bulkit/api/db/db.schema'
import { createSeeder } from '@bulkit/seed/index'
import { UNLIMITED_VALUE } from '@bulkit/shared/modules/plans/plans.constants'
import { eq } from 'drizzle-orm'
import { isNull } from 'drizzle-orm'

export const demoPlansSeeder = createSeeder({
  name: 'demo-plans',
  async seed(db: TransactionLike) {
    await db
      .insert(plansTable)
      .values([
        {
          id: 'pro',
          displayName: 'Cloud Version Pro',
          status: 'active',
          maxPosts: 500,
          maxPostsPerMonth: 200,
          maxChannels: 10,
          monthlyAICredits: 500,
          externalProductId: 'prod_yyy', // Your Lemon Squeezy product ID
          order: 2,
          priorityType: 'best-value',
          features: [
            'Up to 500 total posts',
            '200 posts per month',
            '10 social channels',
            '500 AI credits monthly',
            'Advanced analytics',
            'Priority support',
            'Team collaboration',
            'Custom branding',
          ],
          highlightFeatures: [
            'Ideal for growing teams',
            'Advanced automation',
            'Enhanced collaboration tools',
          ],
        },
      ])
      .onConflictDoNothing()

    const organizationsWithoutPlan = await db
      .select({ id: organizationsTable.id })
      .from(organizationsTable)
      .leftJoin(subscriptionsTable, eq(organizationsTable.id, subscriptionsTable.organizationId))
      .where(isNull(subscriptionsTable.organizationId))

    if (organizationsWithoutPlan.length > 0) {
      await Promise.all(
        organizationsWithoutPlan.map((org) =>
          db.insert(subscriptionsTable).values({
            organizationId: org.id,
            planId: 'starter',
            status: 'active',
          })
        )
      )
    }
  },
})
