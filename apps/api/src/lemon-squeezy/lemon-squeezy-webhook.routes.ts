import { injectDatabase } from '@bulkit/api/db/db.client'
import { creditTransactionsTable } from '@bulkit/api/db/schema/credits.table'
import { subscriptionsTable } from '@bulkit/api/db/schema/plans.table'
import { envApi } from '@bulkit/api/envApi'
import { injectLemonSqueezy } from '@bulkit/api/lemon-squeezy/lemon-squeezy.service'
import type { SubscriptionStatus } from '@bulkit/api/modules/plans/plans.constants'
import { and, eq } from 'drizzle-orm'
import Elysia from 'elysia'
import { HttpError } from 'elysia-http-error'

export const lemonSqueezyWebhookRoutes =
  envApi.DEPLOYMENT_TYPE !== 'cloud'
    ? new Elysia()
    : new Elysia({ prefix: '/lemon-squeezy' })
        .use(injectLemonSqueezy)
        .use(injectDatabase)
        .onParse(async ({ request, headers }) => {
          if (headers['content-type'] === 'application/json; charset=utf-8') {
            const arrayBuffer = await Bun.readableStreamToArrayBuffer(request.body!)
            const rawBody = Buffer.from(arrayBuffer)
            return rawBody
          }
        })
        .post('/webhook', async (ctx) => {
          // Verify webhook signature
          // TODO: Implement webhook signature verification using lemonSqueezy.client.verifyWebhook

          const signature = ctx.headers['x-Signature']

          if (!signature) {
            throw HttpError.BadRequest('Missing signature header')
          }

          const body = ctx.lemonSqueezy.verifyWebhook<{
            organizationId: string
            planId?: string
            creditTransactionId?: string
          }>(ctx.body as Buffer, signature)

          switch (body.event_name) {
            case 'subscription_created':
            case 'subscription_updated': {
              const subscription = body.data
              const customData = body.meta.custom_data

              if (!customData.planId) {
                throw HttpError.Internal('Plan id not provided')
              }

              const newStatus: SubscriptionStatus =
                subscription.attributes.status === 'active'
                  ? 'active'
                  : subscription.attributes.status === 'expired'
                    ? 'expired'
                    : 'cancelled'

              await ctx.db
                .insert(subscriptionsTable)
                .values({
                  organizationId: customData.organizationId,
                  planId: customData.planId,
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
              break
            }

            case 'order_created': {
              const order = body.data.attributes
              const customData = body.meta.custom_data

              // Handle credit purchase
              if (!customData.creditTransactionId) {
                break
              }

              const transaction = await ctx.db
                .select()
                .from(creditTransactionsTable)
                .where(
                  and(
                    eq(creditTransactionsTable.organizationId, customData.organizationId),
                    eq(creditTransactionsTable.id, customData.creditTransactionId)
                  )
                )
                .then((r) => r[0])

              if (!transaction) {
                throw HttpError.BadRequest(
                  `Transaction with id ${customData.creditTransactionId} for org ${customData.organizationId} does not exists`
                )
              }

              await ctx.db
                .update(creditTransactionsTable)
                .set({
                  status: 'completed',
                })
                .where(eq(creditTransactionsTable.id, transaction.id))
                .returning()
                .then((r) => r[0])

              break
            }

            case 'subscription_cancelled': {
              const subscription = body.data

              await ctx.db
                .update(subscriptionsTable)
                .set({
                  status: 'cancelled',
                  currentPeriodEnd: subscription.attributes.ends_at,
                })
                .where(eq(subscriptionsTable.externalSubscriptionId, subscription.id))
              break
            }
          }

          return { success: true }
        })
