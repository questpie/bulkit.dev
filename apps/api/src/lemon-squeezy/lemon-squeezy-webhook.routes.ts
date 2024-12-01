import { injectDatabase } from '@bulkit/api/db/db.client'
import { envApi } from '@bulkit/api/envApi'
import { ioc, iocResolve } from '@bulkit/api/ioc'
import { injectLemonSqueezy } from '@bulkit/api/lemon-squeezy/lemon-squeezy.service'
import {
  injectProcessWebhookJob,
  type LemonSqueezyCustomData,
} from '@bulkit/api/modules/plans/jobs/process-webhook.job'
import { generalEnv } from '@bulkit/shared/env/general.env'
import Elysia from 'elysia'
import { HttpError } from 'elysia-http-error'
import ms from 'ms'

export const lemonSqueezyWebhookRoutes =
  envApi.DEPLOYMENT_TYPE !== 'cloud'
    ? new Elysia()
    : new Elysia({
        prefix: '/lemon-squeezy',
        detail: {
          hide: true,
        },
      })
        .use(injectLemonSqueezy)
        .use(injectDatabase)
        .onParse(async ({ request }) => {
          const rawBody = await request.text()
          return rawBody
        })
        .post('/webhook', async (ctx) => {
          const { jobProcessLemonSqueezyWebhook } = iocResolve(ioc.use(injectProcessWebhookJob))
          const signature = ctx.headers['x-signature']

          if (!signature) {
            throw HttpError.BadRequest('Missing signature header')
          }

          const payload = ctx.lemonSqueezy.verifyWebhook<LemonSqueezyCustomData>(
            ctx.body as string,
            signature
          )

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
