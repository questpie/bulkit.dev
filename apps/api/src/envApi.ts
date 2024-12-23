import { createEnv } from '@bulkit/shared/env/create-env'
import { generalEnv } from '@bulkit/shared/env/general.env'
import { DEPLOYMENT_TYPES, type DeploymentType } from '@bulkit/shared/modules/app/app-constants'
import { HexString, StringBoolean, StringInt, StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import { Type, type TSchema } from '@sinclair/typebox'

function cloudEnv<Schema extends TSchema>(schema: Schema) {
  return process.env.DEPLOYMENT_TYPE !== 'cloud' ? Type.Optional(schema) : schema
}

export const envApi = createEnv({
  server: {
    PORT: StringInt({ default: 3333 }),
    LOG_LEVEL: Type.Optional(
      Type.String({ default: generalEnv.PUBLIC_NODE_ENV === 'development' ? 'debug' : 'info' })
    ),

    APP_URL: Type.String(Type.String()),

    ENCRYPTION_SECRET: HexString({
      length: 64,
      description:
        'The secret key used to encrypt and decrypt API keys. Must be 64 characters long.',
    }),

    // database
    DB_URL: Type.String(),
    DIRECT_DB_URL: Type.Optional(Type.String()),
    DB_AUTO_MIGRATE: StringBoolean({ default: 'false' }),

    // server
    SERVER_URL: Type.String(),

    // maybe we should add an external ip validation for cloud instances if app is misused
    DEPLOYMENT_TYPE: StringLiteralEnum(DEPLOYMENT_TYPES, {
      default: 'self-hosted' satisfies DeploymentType,
    }),

    // Lemon Squeezy
    // this have no reason being specified on self-hosted
    LEMON_SQUEEZY_API_KEY: cloudEnv(Type.String()),
    LEMON_SQUEEZY_WEBHOOK_SECRET: cloudEnv(Type.String()),
    LEMON_SQUEEZY_STORE_SLUG: cloudEnv(StringInt({ default: '1' })),

    // TODO: support for local drive
    // storage
    STORAGE_DRIVER: Type.Union([Type.Literal('s3'), Type.Literal('fs')], {
      default: 's3',
    }),

    S3_ENDPOINT: process.env.STORAGE_DRIVER === 's3' ? Type.String() : Type.Optional(Type.String()),
    S3_PORT: Type.Optional(StringInt()),
    S3_BUCKET: process.env.STORAGE_DRIVER === 's3' ? Type.String() : Type.Optional(Type.String()),
    S3_ACCESS_KEY:
      process.env.STORAGE_DRIVER === 's3' ? Type.String() : Type.Optional(Type.String()),
    S3_SECRET_KEY:
      process.env.STORAGE_DRIVER === 's3' ? Type.String() : Type.Optional(Type.String()),
    S3_REGION: process.env.STORAGE_DRIVER === 's3' ? Type.String() : Type.Optional(Type.String()),
    S3_USE_PATH_STYLE: Type.Optional(StringBoolean({ default: 'false' })),

    // Local storage configuration
    LOCAL_STORAGE_PATH: Type.String({
      default: './uploads',
    }),
    LOCAL_STORAGE_URL_PATH: Type.String({
      default: '/uploads',
    }),

    // redis
    REDIS_URL: Type.String(),

    // OAuth providers
    GOOGLE_CLIENT_ID: Type.Optional(Type.String()),
    GOOGLE_CLIENT_SECRET: Type.Optional(Type.String()),
    GOOGLE_LOGIN_ENABLED: StringBoolean({ default: 'false' }),

    GITHUB_CLIENT_ID: Type.Optional(Type.String()),
    GITHUB_CLIENT_SECRET: Type.Optional(Type.String()),
    GITHUB_ENABLED: StringBoolean({ default: 'false' }),

    FACEBOOK_APP_ID: Type.Optional(Type.String()),
    FACEBOOK_APP_SECRET: Type.Optional(Type.String()),
    FACEBOOK_ENABLED: StringBoolean({ default: 'false' }),

    // Integrations
    // X_CLIENT_ID: Type.Optional(Type.String()),
    // X_CLIENT_SECRET: Type.Optional(Type.String()),
    X_APP_KEY: Type.Optional(Type.String()),
    X_APP_SECRET: Type.Optional(Type.String()),
    X_ENABLED: StringBoolean({ default: 'false' }),

    INSTAGRAM_APP_ID: Type.Optional(Type.String()),
    INSTAGRAM_APP_SECRET: Type.Optional(Type.String()),
    INSTAGRAM_ENABLED: StringBoolean({ default: 'false' }),

    YOUTUBE_CLIENT_ID: Type.Optional(Type.String()),
    YOUTUBE_CLIENT_SECRET: Type.Optional(Type.String()),
    YOUTUBE_ENABLED: StringBoolean({ default: 'false' }),

    TIKTOK_CLIENT_ID: Type.Optional(Type.String()),
    TIKTOK_CLIENT_SECRET: Type.Optional(Type.String()),
    TIKTOK_ENABLED: StringBoolean({ default: 'false' }),

    LINKEDIN_CLIENT_ID: Type.Optional(Type.String()),
    LINKEDIN_CLIENT_SECRET: Type.Optional(Type.String()),
    LINKEDIN_ENABLED: StringBoolean({ default: 'false' }),

    // Pusher/Soketi -> if no ws needed, remove this
    PUSHER_APP_ID: Type.String(),
    PUSHER_KEY: Type.String(),
    PUSHER_SECRET: Type.String(),
    PUSHER_HOST: Type.String(),
    PUSHER_PORT: StringInt(),
    PUSHER_USE_TLS: StringBoolean({ default: 'false' }),

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

    APP_URL: process.env.APP_URL,

    ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET,

    DEPLOYMENT_TYPE: process.env.DEPLOYMENT_TYPE,

    LEMON_SQUEEZY_API_KEY: process.env.LEMON_SQUEEZY_API_KEY,
    LEMON_SQUEEZY_WEBHOOK_SECRET: process.env.LEMON_SQUEEZY_WEBHOOK_SECRET,
    LEMON_SQUEEZY_STORE_SLUG: process.env.LEMON_SQUEEZY_STORE_SLUG,

    DB_URL: process.env.DB_URL,
    DIRECT_DB_URL: process.env.DIRECT_DB_URL,
    DB_AUTO_MIGRATE: process.env.DB_AUTO_MIGRATE,

    SERVER_URL: process.env.SERVER_URL,

    STORAGE_DRIVER: process.env.STORAGE_DRIVER,
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_PORT: process.env.S3_PORT,
    S3_BUCKET: process.env.S3_BUCKET,
    S3_ACCESS_KEY: process.env.S3_ACCESS_KEY,
    S3_SECRET_KEY: process.env.S3_SECRET_KEY,
    S3_REGION: process.env.S3_REGION,
    S3_USE_PATH_STYLE: process.env.S3_USE_PATH_STYLE,

    LOCAL_STORAGE_PATH: process.env.LOCAL_STORAGE_PATH,
    LOCAL_STORAGE_URL_PATH: process.env.LOCAL_STORAGE_URL_PATH,

    REDIS_URL: process.env.REDIS_URL,

    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_LOGIN_ENABLED: process.env.GOOGLE_LOGIN_ENABLED,

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
