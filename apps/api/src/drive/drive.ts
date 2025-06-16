import { envApi } from '@bulkit/api/envApi'
import { iocRegister } from '@bulkit/api/ioc'
import { appLogger } from '@bulkit/shared/utils/logger'
import { addMilliseconds } from 'date-fns'
import { DriveManager } from 'flydrive'
import { FSDriver } from 'flydrive/drivers/fs'
import { S3Driver } from 'flydrive/drivers/s3'
import crypto from 'node:crypto'
import path from 'node:path'

/**
 * @description Drive manager
 * To use the drive, inject it using `ioc.use(injectDrive)`
 * Don't get the drive instance directly, use the injector
 */
export const driveManager = new DriveManager({
  /**
   * Name of the default service. It must be defined inside
   * the service object
   */
  default: envApi.STORAGE_DRIVER,

  fakes: {
    location: new URL('./uploads', import.meta.url).toString(),
    urlBuilder: {
      async generateURL(key, filePath) {
        return [filePath, key].filter(Boolean).join('/')
      },
      async generateSignedURL(key, filePath) {
        return [filePath, key].filter(Boolean).join('/')
      },
    },
  },
  /**
   * A collection of services you plan to use in your application
   */
  services: {
    fs: () => {
      if (envApi.STORAGE_DRIVER !== 'fs') {
        throw new Error('STORAGE_DRIVER is not set to fs')
      }

      if (!envApi.LOCAL_STORAGE_PATH) {
        throw new Error('LOCAL_STORAGE_PATH is not defined')
      }

      const uploadPath = path.resolve(process.cwd(), envApi.LOCAL_STORAGE_PATH!)

      return new FSDriver({
        location: uploadPath,
        visibility: 'private',
        urlBuilder: {
          async generateURL(key, filePath) {
            if (key.startsWith('private/')) {
              throw new Error('Private files are not accessible via URL')
            }

            const baseUrl = new URL(envApi.LOCAL_STORAGE_URL_PATH!, envApi.SERVER_URL)
            return [baseUrl, key].filter(Boolean).join('/')
          },
          async generateSignedURL(key, filePath, options) {
            const timestamp = options?.expiresIn
              ? addMilliseconds(Date.now(), Number(options.expiresIn))
              : Date.now() + 60 * 60 * 1000 // 1 hour expiry

            const signature = crypto
              .createHmac('sha256', envApi.ENCRYPTION_SECRET)
              .update(`${key}:${timestamp}`)
              .digest('hex')

            const baseUrl = new URL(envApi.LOCAL_STORAGE_URL_PATH!, envApi.SERVER_URL)
            const url = new URL([baseUrl, key].filter(Boolean).join('/'))
            url.searchParams.set('signature', signature)
            url.searchParams.set('expires', timestamp.toString())

            return url.toString()
          },
        },
      })
    },
    s3: () => {
      if (envApi.STORAGE_DRIVER !== 's3') {
        throw new Error('STORAGE_DRIVER is not set to s3')
      }

      return new S3Driver({
        credentials: {
          accessKeyId: envApi.S3_ACCESS_KEY!,
          secretAccessKey: envApi.S3_SECRET_KEY!,
        },
        endpoint: envApi.S3_ENDPOINT!,
        forcePathStyle: envApi.S3_USE_PATH_STYLE,
        urlBuilder: {
          async generateURL(key, bucket, s3Client) {
            const url = [envApi.S3_ENDPOINT, envApi.S3_PORT].filter(Boolean).join(':')
            const bucketUrl = [url, bucket].filter(Boolean).join('/')
            return [bucketUrl, key].filter(Boolean).join('/')
          },
        },
        region: envApi.S3_REGION!,
        bucket: envApi.S3_BUCKET!,
        visibility: 'private',
        logger: appLogger,
      })
    },
  },
})

export type Drive = ReturnType<typeof driveManager.use>

export const injectDrive = iocRegister('drive', () => {
  return driveManager.use()
})
