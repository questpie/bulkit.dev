import { envApi } from '@bulkit/api/envApi'
import Elysia from 'elysia'
import crypto from 'node:crypto'
import fs from 'node:fs'

export const staticPlugin =
  envApi.STORAGE_DRIVER === 'fs'
    ? new Elysia({
        name: 'static',
      })
        .use(async (app: Elysia) => {
          if (!envApi.LOCAL_STORAGE_PATH) {
            throw new Error('LOCAL_STORAGE_PATH is not defined')
          }

          // Ensure the path exists
          fs.mkdirSync(envApi.LOCAL_STORAGE_PATH, { recursive: true })

          return app
        })
        .group(envApi.LOCAL_STORAGE_URL_PATH!, (app) =>
          app.get('/*', async ({ request }) => {
            const url = new URL(request.url)
            const pathname = url.pathname

            if (!pathname.startsWith(envApi.LOCAL_STORAGE_URL_PATH!)) {
              return
            }

            let file = pathname.replace(envApi.LOCAL_STORAGE_URL_PATH!, '')

            // Remove leading slash
            if (file.startsWith('/')) {
              file = file.slice(1)
            }

            if (!file) {
              throw new Error('File is required')
            }

            // Always require signature for private files
            const isPrivateFile = file.startsWith('private/')
            const signature = url.searchParams.get('signature')
            const expires = url.searchParams.get('expires')

            if (isPrivateFile) {
              if (!signature || !expires) {
                throw new Error('Signature required for private files')
              }

              const timestamp = Number.parseInt(expires)
              const now = Date.now()

              // Check if URL has expired
              if (now > timestamp) {
                throw new Error('URL has expired')
              }

              // Validate signature
              const expectedSignature = crypto
                .createHmac('sha256', envApi.ENCRYPTION_SECRET)
                .update(`${file}:${timestamp}`)
                .digest('hex')

              if (signature !== expectedSignature) {
                throw new Error('Invalid signature')
              }
            }

            const filePath = `${envApi.LOCAL_STORAGE_PATH}/${file}`
            const bunFile = Bun.file(filePath)

            return new Response(bunFile, {
              headers: {
                'Cache-Control': isPrivateFile
                  ? 'private, no-cache, no-store, must-revalidate'
                  : 'public, max-age=31536000',
              },
            })
          })
        )
        .as('plugin')
    : new Elysia({
        name: 'static',
      })
