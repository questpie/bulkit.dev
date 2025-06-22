import { injectCache } from '@bulkit/api/cache/cache.helper'
import type { TransactionLike } from '@bulkit/api/db/db.client'
import { organizationsTable, userOrganizationsTable, usersTable } from '@bulkit/api/db/db.schema'
import { envApi } from '@bulkit/api/envApi'
import { ioc } from '@bulkit/api/ioc'
import type { DiscriminatedWebhookPayload } from '@bulkit/api/lemon-squeezy/lemon-squeezy.types'
import type { CacheClient } from '@bulkit/cache/base-cache'
import * as LemonSqueezy from '@lemonsqueezy/lemonsqueezy.js'
import { eq } from 'drizzle-orm'
import { HttpError } from 'elysia-http-error'

import crypto from 'node:crypto'

export class LemonSqueezyService {
  readonly client: typeof LemonSqueezy

  constructor(private readonly cache: CacheClient) {
    if (envApi.DEPLOYMENT_TYPE !== 'cloud') {
      throw new Error('You are trying to access LM functionality in non cloud deployment')
    }

    LemonSqueezy.lemonSqueezySetup({
      // if we got here we are okey, otherwise the validation would have failed
      apiKey: envApi.LEMON_SQUEEZY_API_KEY!,
    })

    this.client = LemonSqueezy
  }

  verifyWebhook<TCustomData = unknown>(payload: string, signature: string) {
    if (!envApi.LEMON_SQUEEZY_WEBHOOK_SECRET) {
      throw new Error('LEMON_SQUEEZY_WEBHOOK_SECRET not configured')
    }

    const hmac = crypto.createHmac('sha256', envApi.LEMON_SQUEEZY_WEBHOOK_SECRET)
    const digest = Buffer.from(hmac.update(payload).digest('hex'), 'hex')
    const bufferSignature = Buffer.from(signature, 'hex')

    if (!crypto.timingSafeEqual(digest, bufferSignature)) {
      throw HttpError.BadRequest('Invalid signature.')
    }

    return JSON.parse(payload.toString()) as DiscriminatedWebhookPayload<TCustomData>
  }

  async getCustomerForOrganization(db: TransactionLike, organizationId: string) {
    const externalCustomerId = await db
      .select({ externalCustomerId: organizationsTable.externalCustomerId })
      .from(organizationsTable)
      .where(eq(organizationsTable.id, organizationId))
      .then((r) => r[0]?.externalCustomerId)

    if (!externalCustomerId) {
      const owner = await db
        .select({ email: usersTable.email })
        .from(usersTable)
        .where(eq(userOrganizationsTable.organizationId, organizationId))
        .innerJoin(userOrganizationsTable, eq(usersTable.id, userOrganizationsTable.userId))
        .then((r) => r[0])

      if (!owner) {
        throw HttpError.NotFound('Organization owner not found')
      }

      const customer = await this.client.createCustomer(envApi.LEMON_SQUEEZY_STORE_SLUG, {
        email: owner.email,
        name: owner.email,
      })

      if (!customer.data?.data) {
        throw HttpError.Internal('Failed to create customer')
      }

      await db
        .update(organizationsTable)
        .set({ externalCustomerId: customer.data?.data.id })
        .where(eq(organizationsTable.id, organizationId))

      return customer.data?.data
    }

    const customer = await this.client.getCustomer(externalCustomerId)

    if (!customer.data?.data) {
      throw HttpError.NotFound('Customer not found')
    }

    return customer.data?.data
  }

  async getProductVariantsWithPrice(productId: string) {
    const product = await this.client.getProduct(productId, {
      include: ['variants'],
    })

    const variants = (product.data?.included?.filter((i) => i.type === 'variants') ??
      []) as LemonSqueezy.Variant['data'][]

    // we have to fetch prices because price attribute in variant object is deprecated
    return Promise.all(
      variants.map(async (v) => {
        const price = await this.client
          .listPrices({
            filter: {
              variantId: v.id,
            },
          })
          .then((r) => r.data?.data[0])

        if (!price) {
          throw HttpError.Internal('Failed to fetch price')
        }

        return {
          ...v,
          price: price,
        }
      })
    )
  }

  async getStore(): Promise<LemonSqueezy.Store> {
    const cachedStore = await this.cache.get(
      `lemon-squeezy:store:${envApi.LEMON_SQUEEZY_STORE_SLUG}`
    )

    if (cachedStore) {
      return cachedStore as LemonSqueezy.Store
    }

    const store = await this.client.getStore(envApi.LEMON_SQUEEZY_STORE_SLUG)

    if (!store.data) {
      throw HttpError.Internal('Failed to fetch store')
    }

    await this.cache.set(`lemon-squeezy:store:${envApi.LEMON_SQUEEZY_STORE_SLUG}`, store.data)
    return store.data
  }
}
/**
 * This has to be always injected at function level to prevent global namespace pollution for self-hosted instances
 * @example const {lemonSqueezy} = ioc.resolve([injectLemonSqueezy])
 */
export const injectLemonSqueezy = ioc.register('lemonSqueezy', () => {
  const container = ioc.resolve([injectCache])

  return new LemonSqueezyService(container.cache)
})
