import { adminMiddleware } from '@bulkit/api/modules/auth/admin/admin.middleware'
import Elysia from 'elysia'
import { aiProvidersRoutes } from './routes/ai-providers/ai-providers.routes'
import { channelSettingsRoutes } from './routes/channel-settings/channel-settings.routes'
import { stockImageProvidersRoutes } from './routes/stock-image-providers/stock-image-providers.routes'

export const adminRoutes = new Elysia({ prefix: '/admin' })
  .use(adminMiddleware)
  .use(channelSettingsRoutes)
  .use(stockImageProvidersRoutes)
  .use(aiProvidersRoutes)
  .get('/status', () => {
    return { isAdmin: true }
  })