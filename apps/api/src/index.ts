import { PLATFORMS, PLATFORM_TO_NAME } from '@bulkit/api/db/db.constants'
import cors from '@elysiajs/cors'
import swagger from '@elysiajs/swagger'
import { Elysia } from 'elysia'
import { rootRoutes } from './root.routes'

/**
 * Here you can either listen inside server.entry.ts or import to next.js and serve the api from next.js
 */
export const api = new Elysia()
  // .use(logixlysia() as any)
  .use(
    cors({
      origin: true,
    })
  )
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
            name: 'App',
            description: 'Generic App endpoints',
          },
          {
            name: 'Auth',
            description: 'Endpoints for authentication',
          },
          {
            name: 'Organizations',
            description: 'Endpoints for organizations',
          },
          {
            name: 'Channels',
            description: 'Endpoints for channels',
          },
          {
            name: 'Posts',
            description: 'Endpoints for posts',
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
