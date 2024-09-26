import { adminMiddleware } from '@bulkit/api/modules/auth/admin/admin.middleware'
import { channelSettingsRoutes } from '@bulkit/api/modules/auth/admin/routes/channel-settings/channel-settings.routes'
import Elysia from 'elysia'

export const adminRoutes = new Elysia({ prefix: '/admin' })
  .use(adminMiddleware)
  .use(channelSettingsRoutes)
  .get('/status', () => {
    return { isAdmin: true }
  })
