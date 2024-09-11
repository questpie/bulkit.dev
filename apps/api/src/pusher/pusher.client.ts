import Pusher from 'pusher'
import { env } from '../env'

export const pusher = new Pusher({
  appId: env.PUSHER_APP_ID,
  key: env.PUSHER_KEY,
  secret: env.PUSHER_SECRET,
  host: env.PUSHER_HOST,
  port: String(env.PUSHER_PORT),
  useTLS: env.PUSHER_USE_TLS,
})
