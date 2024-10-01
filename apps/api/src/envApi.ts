import { createEnv } from '@bulkit/shared/env/create-env'
import { generalEnv } from '@bulkit/shared/env/general.env'
import { StringBoolean, StringInt } from '@bulkit/shared/schemas/misc'
import { Type } from '@sinclair/typebox'

export const envApi = createEnv({
  server: {
    PORT: StringInt({ default: 3333 }),
    LOG_LEVEL: Type.Optional(
      Type.String({ default: generalEnv.PUBLIC_NODE_ENV === 'development' ? 'debug' : 'info' })
    ),

    RUNTIME_MODE: Type.Union([Type.Literal('worker'), Type.Literal('api'), Type.Literal('all')], {
      default: 'all',
    }),

    API_KEY_ENCRYPTION_SECRET: Type.String({
      minLength: 64,
      maxLength: 64,
      description:
        'The secret key used to encrypt and decrypt API keys. Must be 64 characters long.',
    }),

    // database
    DATABASE_URL: Type.String(),

    // server
    SERVER_URL: Type.String(),

    // storage
    DEFAULT_DRIVER: Type.Union([Type.Literal('s3'), Type.Literal('fs')], {
      default: 's3',
    }),
    S3_ENDPOINT: process.env.DEFAULT_DRIVER === 's3' ? Type.String() : Type.Optional(Type.String()),
    S3_PORT: process.env.DEFAULT_DRIVER === 's3' ? StringInt() : Type.Optional(StringInt()),
    S3_BUCKET: process.env.DEFAULT_DRIVER === 's3' ? Type.String() : Type.Optional(Type.String()),
    S3_ACCESS_KEY:
      process.env.DEFAULT_DRIVER === 's3' ? Type.String() : Type.Optional(Type.String()),
    S3_SECRET_KEY:
      process.env.DEFAULT_DRIVER === 's3' ? Type.String() : Type.Optional(Type.String()),
    S3_REGION: process.env.DEFAULT_DRIVER === 's3' ? Type.String() : Type.Optional(Type.String()),
    S3_USE_PATH_STYLE:
      process.env.DEFAULT_DRIVER === 's3' ? StringBoolean() : Type.Optional(StringBoolean()),

    // redis
    REDIS_URL: Type.String(),

    // OAuth providers
    GOOGLE_CLIENT_ID: Type.Optional(Type.String()),
    GOOGLE_CLIENT_SECRET: Type.Optional(Type.String()),
    GOOGLE_ENABLED: StringBoolean({ default: false }),

    GITHUB_CLIENT_ID: Type.Optional(Type.String()),
    GITHUB_CLIENT_SECRET: Type.Optional(Type.String()),
    GITHUB_ENABLED: StringBoolean({ default: false }),

    FACEBOOK_APP_ID: Type.Optional(Type.String()),
    FACEBOOK_APP_SECRET: Type.Optional(Type.String()),
    FACEBOOK_ENABLED: StringBoolean({ default: false }),

    // Integrations
    // X_CLIENT_ID: Type.Optional(Type.String()),
    // X_CLIENT_SECRET: Type.Optional(Type.String()),
    X_APP_KEY: Type.Optional(Type.String()),
    X_APP_SECRET: Type.Optional(Type.String()),
    X_ENABLED: StringBoolean({ default: false }),

    INSTAGRAM_APP_ID: Type.Optional(Type.String()),
    INSTAGRAM_APP_SECRET: Type.Optional(Type.String()),
    INSTAGRAM_ENABLED: StringBoolean({ default: false }),

    YOUTUBE_CLIENT_ID: Type.Optional(Type.String()),
    YOUTUBE_CLIENT_SECRET: Type.Optional(Type.String()),
    YOUTUBE_ENABLED: StringBoolean({ default: false }),

    TIKTOK_CLIENT_ID: Type.Optional(Type.String()),
    TIKTOK_CLIENT_SECRET: Type.Optional(Type.String()),
    TIKTOK_ENABLED: StringBoolean({ default: false }),

    LINKEDIN_CLIENT_ID: Type.Optional(Type.String()),
    LINKEDIN_CLIENT_SECRET: Type.Optional(Type.String()),
    LINKEDIN_ENABLED: StringBoolean({ default: false }),

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
    PORT: process.env.PORT,
    LOG_LEVEL: process.env.LOG_LEVEL,

    API_KEY_ENCRYPTION_SECRET: process.env.API_KEY_ENCRYPTION_SECRET,

    RUNTIME_MODE: process.env.RUNTIME_MODE,

    DATABASE_URL: process.env.DATABASE_URL,

    SERVER_URL: process.env.SERVER_URL,

    DEFAULT_DRIVER: process.env.DEFAULT_DRIVER,
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_PORT: process.env.S3_PORT,
    S3_BUCKET: process.env.S3_BUCKET,
    S3_ACCESS_KEY: process.env.S3_ACCESS_KEY,
    S3_SECRET_KEY: process.env.S3_SECRET_KEY,
    S3_REGION: process.env.S3_REGION,
    S3_USE_PATH_STYLE: process.env.S3_USE_PATH_STYLE,

    REDIS_URL: process.env.REDIS_URL,

    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_ENABLED: process.env.GOOGLE_ENABLED,

    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    GITHUB_ENABLED: process.env.GITHUB_ENABLED,

    FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,
    FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET,
    FACEBOOK_ENABLED: process.env.FACEBOOK_ENABLED,

    // X_CLIENT_ID: process.env.X_CLIENT_ID,
    // X_CLIENT_SECRET: process.env.X_CLIENT_SECRET,
    X_APP_KEY: process.env.X_APP_KEY,
    X_APP_SECRET: process.env.X_APP_SECRET,
    X_ENABLED: process.env.X_ENABLED,

    INSTAGRAM_APP_ID: process.env.INSTAGRAM_APP_ID,
    INSTAGRAM_APP_SECRET: process.env.INSTAGRAM_APP_SECRET,
    INSTAGRAM_ENABLED: process.env.INSTAGRAM_ENABLED,

    YOUTUBE_CLIENT_ID: process.env.YOUTUBE_CLIENT_ID,
    YOUTUBE_CLIENT_SECRET: process.env.YOUTUBE_CLIENT_SECRET,
    YOUTUBE_ENABLED: process.env.YOUTUBE_ENABLED,

    TIKTOK_CLIENT_ID: process.env.TIKTOK_CLIENT_ID,
    TIKTOK_CLIENT_SECRET: process.env.TIKTOK_CLIENT_SECRET,
    TIKTOK_ENABLED: process.env.TIKTOK_ENABLED,

    LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID,
    LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET,
    LINKEDIN_ENABLED: process.env.LINKEDIN_ENABLED,

    PUSHER_APP_ID: process.env.PUSHER_APP_ID,
    PUSHER_KEY: process.env.PUSHER_KEY,
    PUSHER_SECRET: process.env.PUSHER_SECRET,
    PUSHER_HOST: process.env.PUSHER_HOST,
    PUSHER_PORT: process.env.PUSHER_PORT,
    PUSHER_USE_TLS: process.env.PUSHER_USE_TLS,

    RESEND_API_KEY: process.env.RESEND_API_KEY,
    MAIL_FROM: process.env.MAIL_FROM,
  },
})
