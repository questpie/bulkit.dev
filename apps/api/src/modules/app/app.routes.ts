import type { Platform } from '@bulkit/api/db/db.constants'
import { envApi } from '@bulkit/api/envApi'
import Elysia from 'elysia'

export const appRoutes = new Elysia({ prefix: '/app' })
  .get('/healthy', () => 'ok', {
    detail: { description: 'Health check', tags: ['App'] },
  })
  .get('/settings', async (ctx) => {
    const platforms: Record<Platform, boolean> = {
      facebook: envApi.FACEBOOK_ENABLED,
      tiktok: envApi.TIKTOK_ENABLED,
      linkedin: envApi.LINKEDIN_ENABLED,
      instagram: envApi.INSTAGRAM_ENABLED,
      youtube: envApi.GOOGLE_ENABLED,
      x: envApi.X_ENABLED,
    }
  })
