import type { TransactionLike } from '@bulkit/api/db/db.client'
import { appSettingsTable } from '@bulkit/api/db/db.schema'
import { createSeeder } from '@bulkit/seed/index'
import { appLogger } from '@bulkit/shared/utils/logger'

export const appSettingsSeeder = createSeeder({
  name: 'app-settings',
  options: {
    once: true,
  },
  async seed(db: TransactionLike) {
    // First, ensure we have at least one AI provider

    // Now, insert the app settings
    await db.insert(appSettingsTable).values({
      id: 'app-settings',
    })

    appLogger.info('App settings seeded successfully')
  },
})
