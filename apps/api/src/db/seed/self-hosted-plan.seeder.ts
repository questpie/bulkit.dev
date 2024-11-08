import type { TransactionLike } from '@bulkit/api/db/db.client'
import { organizationsTable, plansTable, subscriptionsTable } from '@bulkit/api/db/db.schema'
import { envApi } from '@bulkit/api/envApi'
import { SELF_HOSTED_PLAN_ID } from '@bulkit/api/modules/plans/plans.constants'
import { createSeeder } from '@bulkit/seed/index'
import { appLogger } from '@bulkit/shared/utils/logger'
import { eq, isNull } from 'drizzle-orm'

const UNLIMITED = 999_999_999_999

export const appSettingsSeeder = createSeeder({
  name: 'self-hosted-plan',
  options: {
    once: true,
  },
  async seed(db: TransactionLike) {
    if (envApi.DEPLOYMENT_TYPE === 'self-hosted') {
      appLogger.info('Skipping self-hosted plan seeder, as we are in CLOUD version')
      return
    }

    // Now, insert the app settings
    await db
      .insert(plansTable)
      .values({
        id: SELF_HOSTED_PLAN_ID,
        displayName: 'Self-Hosted Plan',
        maxChannels: UNLIMITED,
        maxPosts: UNLIMITED,
        maxPostsPerMonth: UNLIMITED,
        monthlyAICredits: UNLIMITED,
        // all are allowed
        allowedPlatforms: null,
      })
      .onConflictDoNothing({
        target: plansTable.id,
      })

    // if for some unknown reason there are already created organizations without plans attach this plan to them
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
            planId: SELF_HOSTED_PLAN_ID,
            status: 'active',
          })
        )
      )
      appLogger.info(
        `Attached self-hosted plan to ${organizationsWithoutPlan.length} organizations`
      )
    }
  },
})
