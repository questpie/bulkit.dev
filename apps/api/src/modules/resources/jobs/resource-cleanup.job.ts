appLogger

import { db } from '@bulkit/api/db/db.client'
import {
  regularPostMediaTable,
  resourcesTable,
  shortPostsTable,
  storyPostsTable,
  threadMediaTable,
} from '@bulkit/api/db/db.schema'
import { drive } from '@bulkit/api/drive/drive'
import { jobFactory } from '@bulkit/api/jobs/job-factory'
import { redisManager } from '@bulkit/api/redis/redis-clients'
import { appLogger } from '@bulkit/shared/utils/logger'
import { eq, isNull } from 'drizzle-orm'

export const resourceCleanupJob = jobFactory.createJob({
  name: 'resource-cleanup',
  repeat: {
    // pattern: '0 0 * * *', // Run every day at midnight,
    pattern: '* * * * *', // Run every minute for testing
  },
  handler: async (job) => {
    appLogger.info('Fetching unused resources')
    job.log('Fetching unused resources')

    const usedAq = db
      .select({ resourceId: storyPostsTable.resourceId })
      .from(storyPostsTable)
      .unionAll(db.select({ resourceId: shortPostsTable.resourceId }).from(shortPostsTable))
      .unionAll(db.select({ resourceId: threadMediaTable.resourceId }).from(threadMediaTable))
      .unionAll(
        db.select({ resourceId: regularPostMediaTable.resourceId }).from(regularPostMediaTable)
      )
      .as('used')
    // Get unused resources using Drizzle syntax
    const unusedResources = await db
      .select({
        id: resourcesTable.id,
        location: resourcesTable.location,
        isExternal: resourcesTable.isExternal,
      })
      .from(resourcesTable)
      .leftJoin(usedAq, eq(resourcesTable.id, usedAq.resourceId))
      .where(isNull(usedAq.resourceId))

    if (!unusedResources.length) {
      appLogger.info('No unused resources found')
      job.log('No unused resources found')
      return
    }

    for (let i = 0; i < unusedResources.length; i++) {
      const resource = unusedResources[i]!
      job.log(`Deleting resource: ${resource.id}`)
      appLogger.debug(`Deleting resource: ${resource.id}`)
      job.updateProgress(Math.round((i / unusedResources.length) * 100))

      await db.transaction(async (trx) => {
        await trx.delete(resourcesTable).where(eq(resourcesTable.id, resource.id))

        if (!resource.isExternal && resource.location) {
          await drive.use().delete(resource.location)
        }
      })
    }

    appLogger.info(`Deleted ${unusedResources.length} unused resources`)
    job.log(`Deleted ${unusedResources.length} unused resources`)
  },
})
