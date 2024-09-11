import { PLATFORMS, PLATFORM_TO_NAME } from '@bulkit/api/db/db.constants'
import cors from '@elysiajs/cors'
import swagger from '@elysiajs/swagger'
import { Elysia } from 'elysia'
import logixlysia from 'logixlysia'
import { rootRoutes } from './root.routes'

/**
 * Here you can either listen inside server.entry.ts or import to next.js and serve the api from next.js
 */
export const api = new Elysia()
  .use(logixlysia())
  .use(cors())
  .use(
    swagger({
      documentation: {
        info: {
          title: 'Questpie API',
          description: 'The Questpie API',
          version: '1.0.0',
        },

        tags: [
          {
            name: 'Auth',
            description: 'Endpoints for authentication',
          },
          ...PLATFORMS.map((platform) => ({
            name: PLATFORM_TO_NAME[platform],
            description: `${PLATFORM_TO_NAME[platform]} endpoints`,
          })),
        ],
      },
    })
  )
  .use(rootRoutes)

export type ApiType = typeof api
