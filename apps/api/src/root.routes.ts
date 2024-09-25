import { appRoutes } from '@bulkit/api/modules/app/app.routes'
import { authRoutes } from '@bulkit/api/modules/auth/auth.routes'
import { channelRoutes } from '@bulkit/api/modules/channels/channels.routes'
import { openGraphRoutes } from '@bulkit/api/modules/open-graph/open-graph.routes'
import { organizationRoutes } from '@bulkit/api/modules/organizations/organizations.routes'
import { postsRoutes } from '@bulkit/api/modules/posts/posts.routes'
import { resourceRoutes } from '@bulkit/api/modules/resources/resources.routes'
import { Elysia } from 'elysia'

/**
 * Aggregate all routes here
 */
export const rootRoutes = new Elysia()
  .use(appRoutes)
  .use(authRoutes)
  .use(channelRoutes)
  .use(organizationRoutes)
  .use(postsRoutes)
  .use(resourceRoutes)
  .use(openGraphRoutes)
