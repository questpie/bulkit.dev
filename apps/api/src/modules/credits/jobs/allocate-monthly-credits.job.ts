import { injectDatabase } from '@bulkit/api/db/db.client'
import { creditTransactionsTable, plansTable, subscriptionsTable } from '@bulkit/api/db/db.schema'
import { ioc } from '@bulkit/api/ioc'
import { iocJobRegister } from '@bulkit/api/jobs/job-factory'
import { appLogger } from '@bulkit/shared/utils/logger'
import { and, eq, gt, sql } from 'drizzle-orm'
import { subDays } from 'date-fns'

export const injectAllocateMonthlyCreditsJob = iocJobRegister('allocateMonthlyCredits', {
  name: 'allocate-monthly-credits',
  // Run every hour, so there are no issues with timezone
  repeat: {
    pattern: '*/1 * * * *',
  },
  handler: async (job) => {
    const { db } = ioc.resolve([injectDatabase])

    await job.log('Starting monthly credits allocation')

    // Find organizations with active subscriptions that have monthly AI credits
    // and haven't received plan credits in the last 30 days
    const eligibleOrganizations = await db
      .select({
        organizationId: subscriptionsTable.organizationId,
        monthlyAICredits: plansTable.monthlyAICredits,
      })
      .from(subscriptionsTable)
      .innerJoin(plansTable, eq(plansTable.id, subscriptionsTable.planId))
      .where(
        and(
          eq(subscriptionsTable.status, 'active'),
          gt(plansTable.monthlyAICredits, 0),
          // Check if organization hasn't received plan credits in last 30 days
          sql`NOT EXISTS (
            SELECT 1 FROM ${creditTransactionsTable}
            WHERE ${creditTransactionsTable.organizationId} = ${subscriptionsTable.organizationId}
            AND ${creditTransactionsTable.type} = 'plan'
            AND ${creditTransactionsTable.status} = 'completed'
            AND ${creditTransactionsTable.createdAt} > ${subDays(new Date(), 30).toISOString()}
          )`
        )
      )

    await job.log(`Found ${eligibleOrganizations.length} organizations eligible for credits`)

    let processedCount = 0
    for (const org of eligibleOrganizations) {
      try {
        await db.insert(creditTransactionsTable).values({
          organizationId: org.organizationId,
          type: 'plan',
          status: 'completed',
          amount: org.monthlyAICredits,
          description: 'Monthly plan AI credits',
        })

        processedCount++
        await job.log(`Added ${org.monthlyAICredits} credits to organization ${org.organizationId}`)
      } catch (error) {
        appLogger.error('Failed to allocate monthly credits:', error)
        await job.log(`Failed to allocate credits for organization ${org.organizationId}: ${error}`)
      }

      // Update progress
      job.updateProgress((processedCount / eligibleOrganizations.length) * 100)
    }

    await job.log(`Successfully allocated credits to ${processedCount} organizations`)
  },
})
