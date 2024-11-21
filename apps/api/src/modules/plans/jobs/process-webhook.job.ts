import { injectDatabase, type TransactionLike } from '@bulkit/api/db/db.client'
import { ioc, iocResolve } from '@bulkit/api/ioc'
import { iocJobRegister } from '@bulkit/api/jobs/job-factory'
import { Type, type Static } from '@sinclair/typebox'
import { subscriptionsTable } from '@bulkit/api/db/schema/plans.table'
import { creditTransactionsTable } from '@bulkit/api/db/schema/credits.table'
import { and, eq } from 'drizzle-orm'
import type { SubscriptionStatus } from '@bulkit/shared/modules/plans/plans.constants'
import type { DiscriminatedWebhookPayload } from '@bulkit/api/lemon-squeezy/lemon-squeezy.types'
import type { Job } from 'bullmq'

const ProcessWebhookJobSchema = Type.Object({
  eventName: Type.String(),
  payload: Type.Any(),
  customData: Type.Object({
    organizationId: Type.String(),
    planId: Type.Optional(Type.String()),
    creditTransactionId: Type.Optional(Type.String()),
  }),
})

type ProcessWebhookJobData = Static<typeof ProcessWebhookJobSchema>

export const injectProcessWebhookJob = iocJobRegister('processLemonSqueezyWebhook', {
  name: 'process-lemon-squeezy-webhook',
  schema: ProcessWebhookJobSchema,
  handler: async (job) => {
    const { db } = iocResolve(ioc.use(injectDatabase))

    await job.log(`Processing ${job.data.eventName} webhook`)
    await job.log(`Organization ID: ${job.data.customData.organizationId}`)

    switch (job.data.eventName) {
      case 'subscription_created':
      case 'subscription_updated': {
        await handleSubscriptionUpdate(job, db)
        break
      }
      case 'subscription_cancelled': {
        await handleSubscriptionCancellation(job, db)
        break
      }
      case 'order_created': {
        await handleOrderCreated(job, db)
        break
      }
      default: {
        await job.log(`Unhandled event type: ${job.data.eventName}`)
      }
    }

    await job.log('Webhook processing completed')
  },
})

async function handleSubscriptionUpdate(job: Job<ProcessWebhookJobData>, db: TransactionLike) {
  const subscription = job.data.payload
  const { organizationId, planId } = job.data.customData

  if (!planId) {
    throw new Error('Plan ID not provided in webhook custom data')
  }

  await job.log(`Updating subscription for plan: ${planId}`)

  const newStatus: SubscriptionStatus =
    subscription.attributes.status === 'active'
      ? 'active'
      : subscription.attributes.status === 'expired'
        ? 'expired'
        : 'cancelled'

  await db
    .insert(subscriptionsTable)
    .values({
      organizationId,
      planId,
      externalSubscriptionId: subscription.id,
      externalVariantId: String(subscription.attributes.variant_id),
      status: newStatus,
      currentPeriodStart: subscription.attributes.renews_at,
      currentPeriodEnd: subscription.attributes.ends_at,
    })
    .onConflictDoUpdate({
      target: [subscriptionsTable.organizationId],
      set: {
        status: newStatus,
        currentPeriodStart: subscription.attributes.renews_at,
        currentPeriodEnd: subscription.attributes.ends_at,
      },
    })

  await job.log(`Subscription status updated to: ${newStatus}`)
}

async function handleSubscriptionCancellation(
  job: Job<ProcessWebhookJobData>,
  db: TransactionLike
) {
  const subscription = job.data.payload

  await job.log(`Processing subscription cancellation: ${subscription.id}`)

  await db
    .update(subscriptionsTable)
    .set({
      status: 'cancelled',
      currentPeriodEnd: subscription.attributes.ends_at,
    })
    .where(eq(subscriptionsTable.externalSubscriptionId, subscription.id))

  await job.log('Subscription marked as cancelled')
}

async function handleOrderCreated(job: Job<ProcessWebhookJobData>, db: TransactionLike) {
  const { organizationId, creditTransactionId } = job.data.customData

  if (!creditTransactionId) {
    await job.log('No credit transaction ID provided, skipping')
    return
  }

  await job.log(`Processing credit purchase for transaction: ${creditTransactionId}`)

  const transaction = await db
    .select()
    .from(creditTransactionsTable)
    .where(
      and(
        eq(creditTransactionsTable.organizationId, organizationId),
        eq(creditTransactionsTable.id, creditTransactionId)
      )
    )
    .then((r) => r[0])

  if (!transaction) {
    throw new Error(
      `Transaction with id ${creditTransactionId} for org ${organizationId} does not exist`
    )
  }

  await db
    .update(creditTransactionsTable)
    .set({
      status: 'completed',
    })
    .where(eq(creditTransactionsTable.id, transaction.id))

  await job.log('Credit transaction marked as completed')
}
