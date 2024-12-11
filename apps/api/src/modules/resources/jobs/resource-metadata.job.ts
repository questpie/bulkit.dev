import { injectDatabase } from '@bulkit/api/db/db.client'
import { resourcesTable } from '@bulkit/api/db/db.schema'
import { injectDrive } from '@bulkit/api/drive/drive'
import { ioc, iocResolve } from '@bulkit/api/ioc'
import { iocJobRegister } from '@bulkit/api/jobs/job-factory'
import { appLogger } from '@bulkit/shared/utils/logger'
import { and, eq, inArray, isNull } from 'drizzle-orm'
import { imageSize } from 'image-size'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from '@ffmpeg-installer/ffmpeg'
import ffprobePath from '@ffprobe-installer/ffprobe'
import { writeFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import type { ResourceDimensions } from '@bulkit/shared/modules/resources/resources.schemas'
import { Type } from '@sinclair/typebox'

// Configure ffmpeg with the installed binaries
ffmpeg.setFfmpegPath(ffmpegPath.path)
ffmpeg.setFfprobePath(ffprobePath.path)

export const injectResourceMetadataJob = iocJobRegister('resourceMetadata', {
  name: 'resource-metadata',
  schema: Type.Object({
    resourceIds: Type.Array(Type.String()),
  }),
  handler: async (job) => {
    const { db, drive } = iocResolve(ioc.use(injectDatabase).use(injectDrive))

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

        let dimensions: ResourceDimensions | undefined
        const sizeInBytes = buffer.length

        if (resource.type.startsWith('image/')) {
          try {
            const imageInfo = imageSize(buffer)
            if (imageInfo.width && imageInfo.height) {
              dimensions = {
                width: imageInfo.width,
                height: imageInfo.height,
              }
            }
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
            const metadata = await new Promise<{
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

            if (metadata.width && metadata.height) {
              dimensions = {
                width: metadata.width,
                height: metadata.height,
                duration: metadata.duration,
              }
            }

            await unlink(tempPath)
          } catch (error) {
            appLogger.error('Failed to extract video metadata', { error, resourceId: resource.id })
          }
        }

        await db
          .update(resourcesTable)
          .set({
            dimensions,
            sizeInBytes,
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
