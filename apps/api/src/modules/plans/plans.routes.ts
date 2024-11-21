import { HttpErrorSchema } from '@bulkit/api/common/http-error-handler'
import { injectDatabase } from '@bulkit/api/db/db.client'
import { envApi } from '@bulkit/api/envApi'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import { injectPlanService } from '@bulkit/api/modules/plans/services/plans.service'
import { AvailablePlanSchema, PlanSchema } from '@bulkit/shared/modules/plans/plans.schemas'
import Elysia, { t } from 'elysia'

export const planRoutes = new Elysia({ prefix: '/plans' })
  .use(injectDatabase)
  .use(injectPlanService)
  .get(
    '/',
    async (ctx) => {
      return ctx.planService.getAvailablePlans(ctx.db)
    },
    {
      response: {
        200: t.Array(AvailablePlanSchema),
        500: HttpErrorSchema(),
      },
    }
  )
  .use(organizationMiddleware)
  .get(
    '/active',
    async (ctx) => {
      return ctx.planService.getActivePlanForOrganization(ctx.db, ctx.organization.id)
    },
    {
      response: {
        200: PlanSchema,
        404: HttpErrorSchema(),
      },
    }
  )
  .get(
    '/billing-portal',
    async (ctx) => {
      return {
        url: await ctx.planService.getBillingPortalUrl(ctx.db, ctx.organization.id),
      }
    },
    {
      response: {
        200: t.Object({
          url: t.String(),
        }),
        404: HttpErrorSchema(),
      },
    }
  )
  .post(
    '/checkout',
    async (ctx) => {
      return ctx.planService.createSubscription(ctx.db, {
        organizationId: ctx.organization.id,
        planId: ctx.body.planId,
        variantId: ctx.body.variantId,
      })
    },
    {
      body: t.Object({
        planId: t.String(),
        variantId: t.String(),
      }),
      response: {
        200: t.Object({
          checkoutUrl: t.String(),
        }),
        400: HttpErrorSchema(),
        404: HttpErrorSchema(),
      },
    }
  )
