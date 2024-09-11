import { createEnv } from '@questpie/shared/env/create-env'
import { StringBoolean, StringInt } from '@questpie/shared/schemas/misc'
import { Type } from '@sinclair/typebox'

/**
 * This are env that are both accessible inside server and client environments
 */
export const env = createEnv({
  client: {
    PUBLIC_NODE_ENV: Type.Union(
      [Type.Literal('production'), Type.Literal('development'), Type.Literal('test')],
      {
        default: 'development',
      }
    ),

    // server
    PUBLIC_API_URL: Type.String(),

    // pusher
    PUBLIC_PUSHER_APP_KEY: Type.String(),
    PUBLIC_PUSHER_APP_CLUSTER: Type.String({ default: '' }), // if you are using soketi the cluster is just for pusher-js satisfaction
    PUBLIC_PUSHER_HOST: Type.Optional(Type.String()), // if you are using soketi
    PUBLIC_PUSHER_PORT: Type.Optional(StringInt()), // if you are using soketi
    PUBLIC_PUSHER_USE_TLS: Type.Optional(StringBoolean({ default: false })),
  },

  runtimeEnv: {
    PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    PUBLIC_PUSHER_APP_KEY: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
    PUBLIC_PUSHER_APP_CLUSTER: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER,
    PUBLIC_PUSHER_HOST: process.env.NEXT_PUBLIC_PUSHER_HOST,
    PUBLIC_PUSHER_PORT: process.env.NEXT_PUBLIC_PUSHER_PORT,
    PUBLIC_PUSHER_USE_TLS: process.env.NEXT_PUBLIC_PUSHER_USE_TLS,
    PUBLIC_NODE_ENV: process.env.NEXT_PUBLIC_NODE_ENV,
  },
})
