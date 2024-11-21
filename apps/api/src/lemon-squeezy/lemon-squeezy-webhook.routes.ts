import { injectDatabase } from '@bulkit/api/db/db.client'
import { envApi } from '@bulkit/api/envApi'
import { ioc, iocResolve } from '@bulkit/api/ioc'
import { injectLemonSqueezy } from '@bulkit/api/lemon-squeezy/lemon-squeezy.service'
import { injectProcessWebhookJob } from '@bulkit/api/modules/plans/jobs/process-webhook.job'
import Elysia from 'elysia'
import { HttpError } from 'elysia-http-error'
import ms from 'ms'

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
          const { jobProcessLemonSqueezyWebhook } = iocResolve(ioc.use(injectProcessWebhookJob))
          const signature = ctx.headers['x-signature']

          if (!signature) {
            throw HttpError.BadRequest('Missing signature header')
          }

          const payload = ctx.lemonSqueezy.verifyWebhook<{
            organizationId: string
            planId?: string
            creditTransactionId?: string
          }>(ctx.body as Buffer, signature)

          await jobProcessLemonSqueezyWebhook.invoke(
            {
              eventName: payload.meta.event_name,
              payload: payload.data,
              customData: payload.meta.custom_data,
            },
            {
              // Create idempotency key from webhook ID to prevent duplicate processing
              jobId: `lemon-squeezy-webhook-${payload.meta.event_name}-${payload.data.id}`,
              attempts: 5,
              backoff: { type: 'exponential', delay: ms('1s') },
            }
          )

          return { success: true }
        })
