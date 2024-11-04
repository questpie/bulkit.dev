import { HttpErrorSchema } from '@bulkit/api/common/http-error-handler'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import { injectPostMetricsService } from '@bulkit/api/modules/posts/services/post-metrics.service'
import {
  MetricsPeriodSchema,
  OrganizationMetricsResponseSchema,
  PostMetricsResponseSchema,
} from '@bulkit/shared/modules/posts/post-metrics.schemas'
import Elysia, { t } from 'elysia'
import { HttpError } from 'elysia-http-error'

export const postMetricsRoutes = new Elysia({
  prefix: '/metrics',
  detail: { tags: ['Post Metrics'] },
})
  .use(organizationMiddleware)
  .use(injectPostMetricsService)
  .get(
    '/post/:id',
    async (ctx) => {
      const metrics = await ctx.postMetricsService.getPostMetrics(ctx.db, {
        postId: ctx.params.id,
        organizationId: ctx.organization!.id,
        period: ctx.query.period,
      })

      if (!metrics) {
        throw HttpError.NotFound('Post metrics not found')
      }

      return metrics
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      query: t.Object({
        period: t.Optional(MetricsPeriodSchema),
      }),
      response: {
        200: PostMetricsResponseSchema,
        404: HttpErrorSchema(),
      },
    }
  )
  .get(
    '/organization',
    async (ctx) => {
      return ctx.postMetricsService.getOrganizationMetrics(ctx.db, {
        organizationId: ctx.organization!.id,
        period: ctx.query.period,
      })
    },
    {
      query: t.Object({
        period: t.Optional(MetricsPeriodSchema),
      }),
      response: {
        200: OrganizationMetricsResponseSchema,
      },
    }
  )
