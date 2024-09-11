import { createEnv } from '@questpie/shared/env/create-env'
import { generalEnv } from '@questpie/shared/env/general.env'
import { StringBoolean, StringInt } from '@questpie/shared/schemas/misc'
import { Type } from '@sinclair/typebox'

export const env = createEnv({
  server: {
    PORT: StringInt({ default: 3333 }),

    // database
    DATABASE_URL: Type.String(),

    // server
    SERVER_URL: Type.String(),

    // if no s3 needed, remove this
    S3_ENDPOINT: Type.String(),
    S3_PORT: StringInt(),
    S3_SSL: StringBoolean({ default: true }),
    S3_BUCKET: Type.String(),
    S3_ACCESS_KEY: Type.String(),
    S3_SECRET_KEY: Type.String(),

    //if no redis needed, remove this
    REDIS_URL: Type.String(),

    // Pusher/Soketi -> if no ws needed, remove this
    PUSHER_APP_ID: Type.String(),
    PUSHER_KEY: Type.String(),
    PUSHER_SECRET: Type.String(),
    PUSHER_HOST: Type.String(),
    PUSHER_PORT: StringInt(),
    PUSHER_USE_TLS: StringBoolean({ default: false }),

    // mail
    RESEND_API_KEY:
      generalEnv.PUBLIC_NODE_ENV === 'production' ? Type.String() : Type.Optional(Type.String()),
    MAIL_FROM: Type.String({
      default: 'noreply@yourdomain.com',
    }),
  },

  runtimeEnv: {
    PORT: Bun.env.PORT,
    DATABASE_URL: Bun.env.DATABASE_URL,
    SERVER_URL: Bun.env.SERVER_URL,
    S3_ENDPOINT: Bun.env.S3_ENDPOINT,
    S3_PORT: Bun.env.S3_PORT,
    S3_SSL: Bun.env.S3_SSL,
    S3_BUCKET: Bun.env.S3_BUCKET,
    S3_ACCESS_KEY: Bun.env.S3_ACCESS_KEY,
    S3_SECRET_KEY: Bun.env.S3_SECRET_KEY,
    REDIS_URL: Bun.env.REDIS_URL,
    PUSHER_APP_ID: Bun.env.PUSHER_APP_ID,
    PUSHER_KEY: Bun.env.PUSHER_KEY,
    PUSHER_SECRET: Bun.env.PUSHER_SECRET,
    PUSHER_HOST: Bun.env.PUSHER_HOST,
    PUSHER_PORT: Bun.env.PUSHER_PORT,
    PUSHER_USE_TLS: Bun.env.PUSHER_USE_TLS,
    RESEND_API_KEY: Bun.env.RESEND_API_KEY,
    MAIL_FROM: Bun.env.MAIL_FROM,
  },
})
