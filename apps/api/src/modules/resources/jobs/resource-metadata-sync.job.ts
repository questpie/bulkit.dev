import { injectDatabase } from '@bulkit/api/db/db.client'
import { resourcesTable } from '@bulkit/api/db/db.schema'
import { ioc } from '@bulkit/api/ioc'
import { iocJobRegister } from '@bulkit/api/jobs/job-factory'
import { injectResourceMetadataJob } from '@bulkit/api/modules/resources/jobs/resource-metadata.job'
import { appLogger } from '@bulkit/shared/utils/logger'
import { chunkAndProcess } from '@bulkit/shared/utils/misc'
import { Type } from '@sinclair/typebox'
import { isNull } from 'drizzle-orm'

export const injectResourceMetadataSyncJob = iocJobRegister('resourceMetadataSync', {
  name: 'resource-metadata-sync',
  schema: Type.Object({}),
  repeat: {
    pattern: '*/5 * * * *', // Run every 5 minutes
  },
  handler: async (job) => {
    const { db } = ioc.resolve([injectDatabase])
    const { jobResourceMetadata } = ioc.resolve([injectResourceMetadataJob])

    appLogger.info('Fetching resources without metadata')
    job.log('Fetching resources without metadata')

    // Find resources that either have no metadata or have failed metadata computation
    const resourcesToProcess = await db
      .select({
        id: resourcesTable.id,
      })
      .from(resourcesTable)
      .where(isNull(resourcesTable.metadata))

    if (!resourcesToProcess.length) {
      appLogger.info('No resources found without metadata')
      return
    }

    appLogger.info(`Found ${resourcesToProcess.length} resources without metadata`)
    job.log(`Found ${resourcesToProcess.length} resources without metadata`)

    let processedCount = 0
    await chunkAndProcess(resourcesToProcess, 50, async (chunk) => {
      const resourceIds = chunk.map((r) => r.id)
      appLogger.info(`Found ${resourceIds.length} resources without metadata`)
      job.log(`Found ${resourceIds.length} resources without metadata`)

      // Trigger the metadata computation job
      await jobResourceMetadata.invoke(
        { resourceIds },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        }
      )

      processedCount += resourceIds.length
      appLogger.info(
        `Triggered metadata computation ${processedCount} / ${resourcesToProcess.length}`
      )
      await job.log(
        `Triggered metadata computation ${processedCount} / ${resourcesToProcess.length}`
      )
    })
  },
})
