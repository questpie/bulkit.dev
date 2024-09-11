import Pusher from 'pusher'
import { envApi } from '../envApi'

export const pusher = new Pusher({
  appId: envApi.PUSHER_APP_ID,
  key: envApi.PUSHER_KEY,
  secret: envApi.PUSHER_SECRET,
  host: envApi.PUSHER_HOST,
  port: String(envApi.PUSHER_PORT),
  useTLS: envApi.PUSHER_USE_TLS,
})
