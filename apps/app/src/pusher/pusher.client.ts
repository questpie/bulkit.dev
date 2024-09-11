import { apiClient } from '@questpie/app/api/api.client'
import { env } from '@questpie/app/env'
import PusherJs from 'pusher-js'

export type PusherOverrides = {
  appKey?: string
  wsHost?: string
  wsPort?: number
  forceTLS?: boolean
}

export function createPusherInstance(overrides?: PusherOverrides) {
  return new PusherJs(overrides?.appKey || env.PUBLIC_PUSHER_APP_KEY, {
    cluster: env.PUBLIC_PUSHER_APP_CLUSTER,
    wsPort: env.PUBLIC_PUSHER_PORT,
    wsHost: env.PUBLIC_PUSHER_HOST,
    forceTLS: env.PUBLIC_PUSHER_USE_TLS,
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
    userAuthentication: {
      customHandler: (params, cb) => {
        apiClient.auth.pusher.user
          .post({
            socketId: params.socketId,
          })
          .then((res) => {
            cb(null, res.data)
          })
          .catch((err) => {
            cb(err, null)
          })
      },
    },
    channelAuthorization: {
      customHandler: (params, cb) => {
        apiClient.auth.pusher.channel
          .post({
            socketId: params.socketId,
            channelName: params.channelName,
          })
          .then((res) => {
            cb(null, res.data)
          })
      },
    },
  })
}
