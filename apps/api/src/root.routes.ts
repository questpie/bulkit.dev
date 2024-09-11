import { authRoutes } from '@questpie/api/modules/auth/auth.routes'
import { chatRoutes } from '@questpie/api/modules/chat/chat.routes'
import { userRoutes } from '@questpie/api/modules/user/user.routes'
import { Elysia } from 'elysia'

/**
 * Aggregate all routes here
 */
export const rootRoutes = new Elysia()
  .use(authRoutes)
  .use(chatRoutes)
  .use(userRoutes)
  .get('/healthy', () => 'ok', { detail: { description: 'Health check' } })
