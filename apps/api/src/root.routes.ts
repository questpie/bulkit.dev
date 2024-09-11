import { appRoutes } from '@bulkit/api/modules/app/app.routes'
import { authRoutes } from '@bulkit/api/modules/auth/auth.routes'
import { channelRoutes } from '@bulkit/api/modules/channels/channels.route'
import { organizationRoutes } from '@bulkit/api/modules/organizations/organizations.routes'
import { Elysia } from 'elysia'

/**
 * Aggregate all routes here
 */
export const rootRoutes = new Elysia()
  .use(authRoutes)
  .use(organizationRoutes)
  .use(channelRoutes)
  .use(appRoutes)
