import { injectDatabase } from '@bulkit/api/db/db.client'
import { resourcesTable } from '@bulkit/api/db/db.schema'
import { injectDrive } from '@bulkit/api/drive/drive'
import { ioc, iocResolve } from '@bulkit/api/ioc'
import { iocJobRegister } from '@bulkit/api/jobs/job-factory'
import { appLogger } from '@bulkit/shared/utils/logger'
import { and, eq, isNotNull, lt } from 'drizzle-orm'

export const injectResourceCleanupJob = iocJobRegister('resourceCleanup', {
  name: 'resource-cleanup',
  repeat: {
    pattern: '0 0 * * *', // Run every day at midnight,
    // pattern: '* * * * *', // Run every minute for testing
    // every: 10000, // Run every 10 seconds for testing
  },
  handler: async (job) => {
    const { db, drive } = iocResolve(ioc.use(injectDatabase).use(injectDrive))

    appLogger.info('Fetching unused resources')
    job.log('Fetching unused resources')
    // Get the current timestamp
    const now = new Date()

    // Get resources to clean up using Drizzle syntax
    const resourcesToCleanup = await db
      .select({
        id: resourcesTable.id,
        location: resourcesTable.location,
        isExternal: resourcesTable.isExternal,
      })
      .from(resourcesTable)
      .where(
        and(lt(resourcesTable.cleanupAt, now.toISOString()), isNotNull(resourcesTable.cleanupAt))
      )

    if (!resourcesToCleanup.length) {
      appLogger.info('No resources to clean up')
      job.log('No resources to clean up')
      return
    }

    for (let i = 0; i < resourcesToCleanup.length; i++) {
      const resource = resourcesToCleanup[i]!
      job.log(`Deleting resource: ${resource.id}`)
      appLogger.debug(`Deleting resource: ${resource.id}`)
      job.updateProgress(Math.round((i / resourcesToCleanup.length) * 100))

      await db.transaction(async (trx) => {
        await trx.delete(resourcesTable).where(eq(resourcesTable.id, resource.id))

        if (!resource.isExternal && resource.location) {
          await drive.delete(resource.location)
        }
      })
    }

    appLogger.info(`Deleted ${resourcesToCleanup.length} resources`)
    job.log(`Deleted ${resourcesToCleanup.length} resources`)
  },
})
