import { applyRateLimit } from '@bulkit/api/common/rate-limit'
import { lemonSqueezyWebhookRoutes } from '@bulkit/api/lemon-squeezy/lemon-squeezy-webhook.routes'
import { aiRoutes } from '@bulkit/api/modules/ai/ai.routes'
import { appRoutes } from '@bulkit/api/modules/app/app.routes'
import { adminRoutes } from '@bulkit/api/modules/auth/admin/admin.routes'
import { authRoutes } from '@bulkit/api/modules/auth/auth.routes'
import { channelRoutes } from '@bulkit/api/modules/channels/channels.routes'
import { commentsRoutes } from '@bulkit/api/modules/comments/comments.routes'
import { openGraphRoutes } from '@bulkit/api/modules/open-graph/open-graph.routes'
import { organizationRoutes } from '@bulkit/api/modules/organizations/organizations.routes'
import { planRoutes } from '@bulkit/api/modules/plans/plans.routes'
import { postsRoutes } from '@bulkit/api/modules/posts/posts.routes'
import { resourceRoutes } from '@bulkit/api/modules/resources/resources.routes'
import { Elysia } from 'elysia'

/**
 * Aggregate all routes here
 */
export const rootRoutes = new Elysia()
  .use(adminRoutes)
  .use(appRoutes)
  .use(aiRoutes)
  .use(authRoutes)
  .use(channelRoutes)
  .use(commentsRoutes)
  .use(organizationRoutes)
  .use(postsRoutes)
  .use(resourceRoutes)
  .use(openGraphRoutes)
  .use(lemonSqueezyWebhookRoutes)
  .use(planRoutes)
