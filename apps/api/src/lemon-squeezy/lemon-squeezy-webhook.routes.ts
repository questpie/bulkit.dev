import { injectDatabase } from '@bulkit/api/db/db.client'
import { creditTransactionsTable } from '@bulkit/api/db/schema/credits.table'
import { subscriptionsTable } from '@bulkit/api/db/schema/plans.table'
import { envApi } from '@bulkit/api/envApi'
import { injectLemonSqueezy } from '@bulkit/api/lemon-squeezy/lemon-squeezy.service'
import { eq } from 'drizzle-orm'
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

          const body = ctx.lemonSqueezy.verifyWebhook(ctx.body as Buffer, signature)

          switch (body.event_name) {
            case 'subscription_created':
            case 'subscription_updated': {
              const subscription = body.data.attributes

              await ctx.db
                .insert(subscriptionsTable)
                .values({
                  organizationId: subscription.custom_data.organizationId,
                  planId: subscription.custom_data.planId,
                  externalSubscriptionId: subscription.id,
                  externalVariantId: subscription.variant_id,
                  status: subscription.status === 'active' ? 'active' : 'cancelled',
                  currentPeriodStart: subscription.renews_at,
                  currentPeriodEnd: subscription.ends_at,
                })
                .onConflictDoUpdate({
                  target: [subscriptionsTable.organizationId],
                  set: {
                    status: subscription.status === 'active' ? 'active' : 'cancelled',
                    currentPeriodStart: subscription.renews_at,
                    currentPeriodEnd: subscription.ends_at,
                  },
                })
              break
            }

            case 'order_created': {
              const order = body.data.attributes

              // Handle credit purchase
              if (order.custom_data.type === 'credits') {
                await ctx.db.insert(creditTransactionsTable).values({
                  organizationId: order.custom_data.organizationId,
                  type: 'purchase',
                  status: 'completed',
                  amount: order.custom_data.credits,
                  description: `Purchased ${order.custom_data.credits} credits`,
                })
              }
              break
            }

            case 'subscription_cancelled': {
              const subscription = body.data.attributes

              await ctx.db
                .update(subscriptionsTable)
                .set({
                  status: 'cancelled',
                  currentPeriodEnd: subscription.ends_at,
                })
                .where(eq(subscriptionsTable.externalSubscriptionId, subscription.id))
              break
            }
          }

          return { success: true }
        })
