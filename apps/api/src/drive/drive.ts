import { envApi } from '@bulkit/api/envApi'
import { DriveManager } from 'flydrive'
import { S3Driver } from 'flydrive/drivers/s3'

export const drive = new DriveManager({
  /**
   * Name of the default service. It must be defined inside
   * the service object
   */
  default: 's3',
  // default: envApi.DEFAULT_DRIVER,

  /**
   * A collection of services you plan to use in your application
   */
  services: {
    // fs: () => {
    //   return new FSDriver({
    //     location: new URL('./uploads', import.meta.url),
    //     visibility: 'public',
    //   })
    // },
    s3: () => {
      return new S3Driver({
        credentials: {
          accessKeyId: envApi.S3_ACCESS_KEY,
          secretAccessKey: envApi.S3_SECRET_KEY,
        },

        endpoint: envApi.S3_ENDPOINT,
        forcePathStyle: envApi.S3_USE_PATH_STYLE,

        urlBuilder: {
          async generateURL(key, bucket, s3Client) {
            const url = [envApi.S3_ENDPOINT, envApi.S3_PORT].filter(Boolean).join(':')
            const bucketUrl = [url, bucket].filter(Boolean).join('/')

            return [bucketUrl, key].filter(Boolean).join('/')
          },
        },

        region: envApi.S3_REGION,
        bucket: envApi.S3_BUCKET,
        visibility: 'public',
      })
    },
  },
})
