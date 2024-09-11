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
  .get('/healthy', () => 'ok', { detail: { description: 'Health check', tags: ['App'] } })
