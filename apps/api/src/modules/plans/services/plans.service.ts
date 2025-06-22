import type { TransactionLike } from '@bulkit/api/db/db.client'
import { plansTable, subscriptionsTable } from '@bulkit/api/db/db.schema'
import { envApi } from '@bulkit/api/envApi'
import { ioc } from '@bulkit/api/ioc'
import {
  injectLemonSqueezy,
  type LemonSqueezyService,
} from '@bulkit/api/lemon-squeezy/lemon-squeezy.service'
import type { LemonSqueezyCustomData } from '@bulkit/api/modules/plans/jobs/process-webhook.job'
import { generalEnv } from '@bulkit/shared/env/general.env'
import type { AvailablePlan } from '@bulkit/shared/modules/plans/plans.schemas'
import { and, desc, eq, isNotNull } from 'drizzle-orm'
import { HttpError } from 'elysia-http-error'

export class PlansService {
  getLemonSqueezy() {
    if (envApi.DEPLOYMENT_TYPE !== 'cloud') {
      throw HttpError.BadRequest('Lemon Squeezy is not available in self-hosted version')
    }

    return ioc.resolve([injectLemonSqueezy]).lemonSqueezy
  }

  async getAvailablePlans(db: TransactionLike): Promise<AvailablePlan[]> {
    if (envApi.DEPLOYMENT_TYPE !== 'cloud') {
      throw HttpError.BadRequest('Plans are not available in self-hosted version')
    }

    const plans = await db
      .select()
      .from(plansTable)
      .where(and(eq(plansTable.status, 'active'), isNotNull(plansTable.externalProductId)))
      .orderBy(desc(plansTable.order))

    return Promise.all(
      plans.map(async (plan) => {
        const variants = await this.getLemonSqueezy().getProductVariantsWithPrice(
          plan.externalProductId!
        )

        const monthlyVariant = variants.find((v) => v.attributes.interval === 'month')
        const annualVariant = variants.find((v) => v.attributes.interval === 'year')

        if (!monthlyVariant || !annualVariant) {
          throw HttpError.Internal('Failed to fetch plan variants')
        }

        return {
          ...plan,
          externalProductId: plan.externalProductId!,
          monthlyVariantId: monthlyVariant.id,
          annualVariantId: annualVariant.id,
          monthlyPrice: monthlyVariant.price.attributes.unit_price,
          annualPrice: annualVariant.price.attributes.unit_price,
        } satisfies AvailablePlan
      })
    )
  }

  async getActivePlanForOrganization(db: TransactionLike, organizationId: string) {
    const subscription = await db
      .select()
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.organizationId, organizationId),
          eq(subscriptionsTable.status, 'active')
        )
      )
      .then((r) => r[0])

    if (!subscription) {
      throw HttpError.NotFound('No active subscription found')
    }

    const plan = await db
      .select()
      .from(plansTable)
      .where(eq(plansTable.id, subscription.planId))
      .then((r) => r[0])

    if (!plan) {
      throw HttpError.NotFound('Plan not found')
    }

    return plan
  }

  async getBillingPortalUrl(db: TransactionLike, organizationId: string) {
    const customer = await this.getLemonSqueezy().getCustomerForOrganization(db, organizationId)

    const customerPortalUrl = customer.attributes.urls.customer_portal

    if (!customerPortalUrl) {
      throw HttpError.NotFound('Customer portal URL not found')
    }

    return customerPortalUrl
  }

  async createSubscription(
    db: TransactionLike,
    data: {
      organizationId: string
      planId: string
      variantId: string
    }
  ) {
    const plan = await db
      .select()
      .from(plansTable)
      .where(eq(plansTable.id, data.planId))
      .then((r) => r[0])

    if (!plan) {
      throw HttpError.NotFound('Plan not found')
    }

    // Check if organization already has an active subscription
    const existingSubscription = await db
      .select()
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.organizationId, data.organizationId),
          eq(subscriptionsTable.status, 'active')
        )
      )
      .then((r) => r[0])

    if (existingSubscription) {
      throw HttpError.BadRequest('Organization already has an active subscription')
    }

    const { data: checkout } = await this.getLemonSqueezy().client.createCheckout(
      envApi.LEMON_SQUEEZY_STORE_SLUG,
      data.variantId,
      {
        productOptions: {
          redirectUrl: `${envApi.APP_URL}?orgId=${data.organizationId}`,
        },
        checkoutData: {
          custom: {
            organization_id: data.organizationId,
            plan_id: data.planId,
          } satisfies LemonSqueezyCustomData,
        },
        testMode: generalEnv.PUBLIC_NODE_ENV === 'development',
      }
    )

    const checkoutUrl = checkout?.data.attributes.url

    if (!checkoutUrl) {
      throw HttpError.Internal('Failed to create checkout URL')
    }

    return {
      checkoutUrl,
    }
  }
}

export const injectPlanService = ioc.register('planService', () => new PlansService())
