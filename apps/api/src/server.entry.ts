import cors from '@elysiajs/cors'
import { env } from '@questpie/api/env'
import { api } from '@questpie/api/index'
import { logger } from '@questpie/shared/utils/logger'
import { Elysia } from 'elysia'

/**
 * TODO: if you want to listen to the api from next.js,
 * you can import the server from index.ts and use it in next.js and delete this file after
 */
const app = new Elysia().use(api).listen(env.PORT)

logger.info(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`)
