import { injectDatabase, type TransactionLike } from '@bulkit/api/db/db.client'
import { creditTransactionsTable } from '@bulkit/api/db/schema/credits.table'
import { subscriptionsTable } from '@bulkit/api/db/schema/plans.table'
import { ioc, iocResolve } from '@bulkit/api/ioc'
import { iocJobRegister } from '@bulkit/api/jobs/job-factory'
import type { SubscriptionStatus } from '@bulkit/shared/modules/plans/plans.constants'
import { Type, type Static } from '@sinclair/typebox'
import type { Job } from 'bullmq'
import { and, eq } from 'drizzle-orm'

const LemonSqueezyCustomDataSchema = Type.Object({
  organization_id: Type.String(),
  plan_id: Type.Optional(Type.String()),
  credit_transaction_id: Type.Optional(Type.String()),
})
const ProcessWebhookJobSchema = Type.Object({
  eventName: Type.String(),
  payload: Type.Any(),
  customData: LemonSqueezyCustomDataSchema,
})

export type LemonSqueezyCustomData = Static<typeof LemonSqueezyCustomDataSchema>

type ProcessWebhookJobData = Static<typeof ProcessWebhookJobSchema>

export const injectProcessWebhookJob = iocJobRegister('processLemonSqueezyWebhook', {
  name: 'process-lemon-squeezy-webhook',
  schema: ProcessWebhookJobSchema,
  handler: async (job) => {
    const { db } = iocResolve(ioc.use(injectDatabase))

    await job.log(`Processing ${job.data.eventName} webhook`)
    await job.log(`Organization ID: ${job.data.customData.organization_id}`)

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
  const { organization_id, plan_id } = job.data.customData

  if (!plan_id) {
    throw new Error('Plan ID not provided in webhook custom data')
  }

  await job.log(`Updating subscription for plan: ${plan_id}`)

  const newStatus: SubscriptionStatus =
    subscription.attributes.status === 'active'
      ? 'active'
      : subscription.attributes.status === 'expired'
        ? 'expired'
        : 'cancelled'

  await db
    .insert(subscriptionsTable)
    .values({
      organizationId: organization_id,
      planId: plan_id,
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
  const { organization_id, credit_transaction_id } = job.data.customData

  if (!credit_transaction_id) {
    await job.log('No credit transaction ID provided, skipping')
    return
  }

  await job.log(`Processing credit purchase for transaction: ${credit_transaction_id}`)

  const transaction = await db
    .select()
    .from(creditTransactionsTable)
    .where(
      and(
        eq(creditTransactionsTable.organizationId, organization_id),
        eq(creditTransactionsTable.id, credit_transaction_id)
      )
    )
    .then((r) => r[0])

  if (!transaction) {
    throw new Error(
      `Transaction with id ${credit_transaction_id} for org ${organization_id} does not exist`
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
