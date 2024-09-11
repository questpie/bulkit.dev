import { createEnv } from '@bulkit/shared/env/create-env'
import { generalEnv } from '@bulkit/shared/env/general.env'
import { StringBoolean, StringInt } from '@bulkit/shared/schemas/misc'
import { Type } from '@sinclair/typebox'

export const envApi = createEnv({
  server: {
    PORT: StringInt({ default: 3333 }),

    // database
    DATABASE_URL: Type.String(),

    // server
    SERVER_URL: Type.String(),

    // if no s3 needed, remove this
    S3_ENDPOINT: Type.String(),
    S3_PORT: StringInt(),
    S3_SSL: StringBoolean({ default: false }),
    S3_BUCKET: Type.String(),
    S3_ACCESS_KEY: Type.String(),
    S3_SECRET_KEY: Type.String(),

    //if no redis needed, remove this
    REDIS_URL: Type.String(),

    // OAuth providers
    GOOGLE_CLIENT_ID: Type.Optional(Type.String()),
    GOOGLE_CLIENT_SECRET: Type.Optional(Type.String()),
    GOOGLE_REDIRECT_URI: Type.Optional(Type.String()),
    GOOGLE_ENABLED: StringBoolean({ default: false }),

    GITHUB_CLIENT_ID: Type.Optional(Type.String()),
    GITHUB_CLIENT_SECRET: Type.Optional(Type.String()),
    GITHUB_ENABLED: StringBoolean({ default: false }),

    FACEBOOK_CLIENT_ID: Type.Optional(Type.String()),
    FACEBOOK_CLIENT_SECRET: Type.Optional(Type.String()),
    FACEBOOK_REDIRECT_URI: Type.Optional(Type.String()),
    FACEBOOK_ENABLED: StringBoolean({ default: false }),

    // Integrations
    X_CLIENT_ID: Type.Optional(Type.String()),
    X_CLIENT_SECRET: Type.Optional(Type.String()),
    X_REDIRECT_URI: Type.Optional(Type.String()),
    X_ENABLED: StringBoolean({ default: false }),

    INSTAGRAM_CLIENT_ID: Type.Optional(Type.String()),
    INSTAGRAM_CLIENT_SECRET: Type.Optional(Type.String()),
    INSTAGRAM_REDIRECT_URI: Type.Optional(Type.String()),
    INSTAGRAM_ENABLED: StringBoolean({ default: false }),

    YOUTUBE_CLIENT_ID: Type.Optional(Type.String()),
    YOUTUBE_CLIENT_SECRET: Type.Optional(Type.String()),
    YOUTUBE_REDIRECT_URI: Type.Optional(Type.String()),
    YOUTUBE_ENABLED: StringBoolean({ default: false }),

    TIKTOK_CLIENT_ID: Type.Optional(Type.String()),
    TIKTOK_CLIENT_SECRET: Type.Optional(Type.String()),
    TIKTOK_REDIRECT_URI: Type.Optional(Type.String()),
    TIKTOK_ENABLED: StringBoolean({ default: false }),

    LINKEDIN_CLIENT_ID: Type.Optional(Type.String()),
    LINKEDIN_CLIENT_SECRET: Type.Optional(Type.String()),
    LINKEDIN_REDIRECT_URI: Type.Optional(Type.String()),
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

    DATABASE_URL: process.env.DATABASE_URL,

    SERVER_URL: process.env.SERVER_URL,

    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_PORT: process.env.S3_PORT,
    S3_SSL: process.env.S3_SSL,
    S3_BUCKET: process.env.S3_BUCKET,
    S3_ACCESS_KEY: process.env.S3_ACCESS_KEY,
    S3_SECRET_KEY: process.env.S3_SECRET_KEY,

    REDIS_URL: process.env.REDIS_URL,

    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
    GOOGLE_ENABLED: process.env.GOOGLE_ENABLED,

    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    GITHUB_ENABLED: process.env.GITHUB_ENABLED,

    FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
    FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET,
    FACEBOOK_REDIRECT_URI: process.env.FACEBOOK_REDIRECT_URI,
    FACEBOOK_ENABLED: process.env.FACEBOOK_ENABLED,

    X_CLIENT_ID: process.env.X_CLIENT_ID,
    X_CLIENT_SECRET: process.env.X_CLIENT_SECRET,
    X_REDIRECT_URI: process.env.X_REDIRECT_URI,
    X_ENABLED: process.env.X_ENABLED,
    INSTAGRAM_CLIENT_ID: process.env.INSTAGRAM_CLIENT_ID,
    INSTAGRAM_CLIENT_SECRET: process.env.INSTAGRAM_CLIENT_SECRET,
    INSTAGRAM_REDIRECT_URI: process.env.INSTAGRAM_REDIRECT_URI,
    INSTAGRAM_ENABLED: process.env.INSTAGRAM_ENABLED,

    YOUTUBE_CLIENT_ID: process.env.YOUTUBE_CLIENT_ID,
    YOUTUBE_CLIENT_SECRET: process.env.YOUTUBE_CLIENT_SECRET,
    YOUTUBE_REDIRECT_URI: process.env.YOUTUBE_REDIRECT_URI,
    YOUTUBE_ENABLED: process.env.YOUTUBE_ENABLED,

    TIKTOK_CLIENT_ID: process.env.TIKTOK_CLIENT_ID,
    TIKTOK_CLIENT_SECRET: process.env.TIKTOK_CLIENT_SECRET,
    TIKTOK_REDIRECT_URI: process.env.TIKTOK_REDIRECT_URI,
    TIKTOK_ENABLED: process.env.TIKTOK_ENABLED,

    LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID,
    LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET,
    LINKEDIN_REDIRECT_URI: process.env.LINKEDIN_REDIRECT_URI,
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
