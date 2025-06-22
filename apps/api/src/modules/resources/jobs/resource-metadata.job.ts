import { injectDatabase } from '@bulkit/api/db/db.client'
import { resourcesTable } from '@bulkit/api/db/db.schema'
import { injectDrive } from '@bulkit/api/drive/drive'
import { ioc } from '@bulkit/api/ioc'
import { iocJobRegister } from '@bulkit/api/jobs/job-factory'
import type { ResourceMetadata } from '@bulkit/shared/modules/resources/resources.schemas'
import { appLogger } from '@bulkit/shared/utils/logger'
import { Type } from '@sinclair/typebox'
import { eq, inArray } from 'drizzle-orm'
import ffmpeg from 'fluent-ffmpeg'
import { imageSize } from 'image-size'
import { unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const injectResourceMetadataJob = iocJobRegister('resourceMetadata', {
  name: 'resource-metadata',
  schema: Type.Object({
    resourceIds: Type.Array(Type.String()),
  }),
  handler: async (job) => {
    const { db, drive } = ioc.resolve([injectDatabase, injectDrive])

    appLogger.info('Fetching resources without metadata')
    job.log('Fetching resources without metadata')

    const resourcesToProcess = await db
      .select({
        id: resourcesTable.id,
        location: resourcesTable.location,
        type: resourcesTable.type,
        isExternal: resourcesTable.isExternal,
      })
      .from(resourcesTable)
      .where(inArray(resourcesTable.id, job.data.resourceIds))
      .limit(50)

    if (!resourcesToProcess.length) {
      appLogger.info('No resources found')
      throw new Error('No resources found')
    }

    for (let i = 0; i < resourcesToProcess.length; i++) {
      const resource = resourcesToProcess[i]!
      job.log(`Processing resource: ${resource.id}`)
      appLogger.debug(`Processing resource: ${resource.id}`)
      job.updateProgress(Math.round((i / resourcesToProcess.length) * 100))

      try {
        const buffer = await drive.get(resource.location)
        if (!buffer) continue

        let metadata: ResourceMetadata = {
          sizeInBytes: buffer.length,
        }

        if (resource.type.startsWith('image/')) {
          try {
            const imageInfo = imageSize(buffer)
            metadata.width = imageInfo.width
            metadata.height = imageInfo.height
          } catch (error) {
            appLogger.error('Failed to extract image dimensions', {
              error,
              resourceId: resource.id,
            })
          }
        } else if (resource.type.startsWith('video/')) {
          try {
            const tempPath = join(tmpdir(), `temp-${resource.id}.mp4`)
            await writeFile(tempPath, buffer)

            // Use promise-based ffprobe
            const videoMetadata = await new Promise<{
              width?: number
              height?: number
              duration?: number
            }>((resolve, reject) => {
              ffmpeg.ffprobe(tempPath, (err, metadata) => {
                if (err) return reject(err)
                const videoStream = metadata.streams.find((s) => s.codec_type === 'video')
                resolve({
                  width: videoStream?.width,
                  height: videoStream?.height,
                  duration: videoStream?.duration ? Number(videoStream.duration) : undefined,
                })
              })
            })

            metadata = {
              ...metadata,
              ...videoMetadata,
            }

            await unlink(tempPath)
          } catch (error) {
            appLogger.error('Failed to extract video metadata', { error, resourceId: resource.id })
          }
        }

        await db
          .update(resourcesTable)
          .set({
            metadata,
          })
          .where(eq(resourcesTable.id, resource.id))

        job.log(`Updated metadata for resource: ${resource.id}`)
      } catch (error) {
        appLogger.error('Failed to process resource', { error, resourceId: resource.id })
        job.log(`Failed to process resource: ${resource.id}`)
      }
    }

    appLogger.info(`Processed ${resourcesToProcess.length} resources`)
    job.log(`Processed ${resourcesToProcess.length} resources`)
  },
})
