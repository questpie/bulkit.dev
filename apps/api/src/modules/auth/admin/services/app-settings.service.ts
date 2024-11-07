import type { TransactionLike } from '@bulkit/api/db/db.client'
import { iocRegister } from '@bulkit/api/ioc'

export class AppSettingsService {
  async get(db: TransactionLike) {
    const appSettings = await db.query.appSettingsTable.findFirst({
      where: (t, { eq }) => eq(t.id, 'app-settings'),
      with: {
        textAiProvider: true,
      },
    })

    if (!appSettings) {
      throw new Error('App is configuration is wrong. Missing App Settings')
    }

    return appSettings!
  }
}

export const injectAppSettingsService = iocRegister('appSettingsService', () => {
  return new AppSettingsService()
})
