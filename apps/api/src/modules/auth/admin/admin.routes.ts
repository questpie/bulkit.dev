import { adminMiddleware } from '@bulkit/api/modules/auth/admin/admin.middleware'
import Elysia from 'elysia'
import { aiProvidersRoutes } from './routes/ai-providers/ai-providers.routes'
import { channelSettingsRoutes } from './routes/channel-settings/channel-settings.routes'
import { stockImageProvidersRoutes } from './routes/stock-image-providers/stock-image-providers.routes'
import { applyRateLimit } from '@bulkit/api/common/rate-limit'
import { envApi } from '@bulkit/api/envApi'

export const adminRoutes = new Elysia({
  prefix: '/admin',
  detail: {
    hide: envApi.DEPLOYMENT_TYPE === 'cloud',
    tags: ['Admin'],
  },
})
  .use(applyRateLimit())
  .use(adminMiddleware)
  .use(channelSettingsRoutes)
  .use(stockImageProvidersRoutes)
  .use(aiProvidersRoutes)
  .get('/status', () => {
    return { isAdmin: true }
  })
