import { authRoutes } from '@bulkit/api/modules/auth/auth.routes'
import { channelRoutes } from '@bulkit/api/modules/channels/channels.route'
import { Elysia } from 'elysia'

/**
 * Aggregate all routes here
 */
export const rootRoutes = new Elysia()
  .use(authRoutes)
  .use(channelRoutes)
  .get('/healthy', () => 'ok', { detail: { description: 'Health check' } })
