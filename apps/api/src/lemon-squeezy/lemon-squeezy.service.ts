import { envApi } from '@bulkit/api/envApi'
import { iocRegister } from '@bulkit/api/ioc'
import type { DiscriminatedWebhookPayload } from '@bulkit/api/lemon-squeezy/lemon-squeezy.types'
import * as LemonSqueezy from '@lemonsqueezy/lemonsqueezy.js'
import { HttpError } from 'elysia-http-error'

import crypto from 'node:crypto'

export class LemonSqueezyService {
  readonly client: typeof LemonSqueezy

  constructor() {
    if (envApi.DEPLOYMENT_TYPE !== 'cloud') {
      throw new Error('You are trying to access LM functionality in non cloud deployment')
    }

    LemonSqueezy.lemonSqueezySetup({
      // if we got here we are okey, otherwise the validation would have failed
      apiKey: envApi.LEMON_SQUEEZY_API_KEY!,
    })

    this.client = LemonSqueezy
  }

  verifyWebhook<TCustomData = unknown>(payload: Buffer, signature: string) {
    const secret = 'SIGNING_SECRET'
    const hmac = crypto.createHmac('sha256', secret)
    const digest = Buffer.from(hmac.update(payload).digest('hex'), 'utf8')
    const bufferSignature = Buffer.from(signature, 'utf8')

    if (!crypto.timingSafeEqual(digest, bufferSignature)) {
      throw HttpError.BadRequest('Invalid signature.')
    }

    // TODO: type this
    return JSON.parse(payload.toString()) as DiscriminatedWebhookPayload<TCustomData>
  }
}
/**
 * This has to be always injected at function level to prevent global namespace pollution for self-hosted instances
 * @example const {lemonSqueezy} = iocResolve(ioc.use(injectLemonSqueezy))
 */
export const injectLemonSqueezy = iocRegister('lemonSqueezy', () => {
  return new LemonSqueezyService()
})
