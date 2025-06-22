import type { TransactionLike } from '@bulkit/api/db/db.client'
import { ioc } from '@bulkit/api/ioc'

export class AppSettingsService {
  /**
   * Only for internal server user.
   * Don't expose this to the client.
   */
  async get(db: TransactionLike) {
    const appSettings = await db.query.appSettingsTable.findFirst({
      where: (t, { eq }) => eq(t.id, 'app-settings'),
      with: {
        defaultTextProvider: true,
      },
    })

    if (!appSettings) {
      throw new Error('App is configuration is wrong. Missing App Settings')
    }

    return appSettings!
  }
}

export const injectAppSettingsService = ioc.register('appSettingsService', () => {
  return new AppSettingsService()
})
