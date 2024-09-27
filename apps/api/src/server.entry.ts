import { envApi } from '@bulkit/api/envApi'
import { api } from '@bulkit/api/index'
import { appLogger } from '@bulkit/shared/utils/logger'
import { Elysia } from 'elysia'

export function bootApi() {
  /**
   * TODO: if you want to listen to the api from next.js,
   * you can import the server from index.ts and use it in next.js and delete this file after
   */
  const app = new Elysia().use(api).listen(envApi.PORT)

  appLogger.info(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`)
}
