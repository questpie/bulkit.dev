import { adminMiddleware } from '@bulkit/api/modules/auth/admin/admin.middleware'
import Elysia from 'elysia'

export const channelSettingsRoutes = new Elysia({ prefix: '/channels' })
  .use(adminMiddleware)
  .get('/', async () => {})
