import type { Platform, PostType } from '@bulkit/shared/constants/db.constants'

/**
 * Represents the settings for a social media platform.
 */
type PlatformSettings = {
  /** Post types that are allowed to be published on the platform. */
  allowedPostTypes: PostType[]
  minMediaPerPost: number
  /** Maximum length of a post in characters. */
  maxPostLength: number
  /** Maximum number of media items allowed per post. */
  maxMediaPerPost: number
  /** Allowed MIME types for media uploads. */
  mediaAllowedMimeTypes: string[]
  /** Maximum size of media uploads in bytes. */
  mediaMaxSizeInBytes: number
  /** Maximum number of posts allowed within the time window. */
  postLimit: number
  /** Time window for post limit in seconds. */
  postLimitWindowInSeconds: number

  threadSettings?: {
    /*  Type of thread supported by the platform.
     * - 'separate': Each thread item is a separate post
     * - 'concat': Concatenate all thread items (text + media) into singular post
     */
    handlingStrategy: 'separate' | 'concat'
    /** Maximum number of posts in a thread. */
    limit: number
  }
}

/**
 * Default settings for various social media platforms.
 */
export const DEFAULT_PLATFORM_SETTINGS: Record<Platform, PlatformSettings> = {
  x: {
    allowedPostTypes: ['post', 'reel', 'thread'],
    maxPostLength: 280,
    minMediaPerPost: 0,
    maxMediaPerPost: 4,
    mediaAllowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
    mediaMaxSizeInBytes: 512 * 1024 * 1024, // 512 MB
    postLimit: 50,
    postLimitWindowInSeconds: 24 * 60 * 60, // 24 hours
    threadSettings: { handlingStrategy: 'separate', limit: 25 },
  },
  facebook: {
    allowedPostTypes: ['post', 'thread', 'reel', 'story'],
    minMediaPerPost: 0,
    maxPostLength: 63206,
    maxMediaPerPost: 10,
    mediaAllowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
    mediaMaxSizeInBytes: 4 * 1024 * 1024 * 1024, // 4 GB
    postLimit: 50,
    postLimitWindowInSeconds: 24 * 60 * 60, // 24 hours
    threadSettings: {
      handlingStrategy: 'concat',
      limit: 50,
    },
  },
  tiktok: {
    allowedPostTypes: ['post', 'reel'],
    maxPostLength: 2200,
    minMediaPerPost: 1,
    maxMediaPerPost: 1,
    mediaAllowedMimeTypes: ['video/mp4'],
    mediaMaxSizeInBytes: 287 * 1024 * 1024, // 287 MB
    postLimit: 50,
    postLimitWindowInSeconds: 24 * 60 * 60, // 24 hours
  },
  youtube: {
    allowedPostTypes: ['post', 'reel'],
    maxPostLength: 5000,
    minMediaPerPost: 1,
    maxMediaPerPost: 1,
    mediaAllowedMimeTypes: ['video/mp4'],
    mediaMaxSizeInBytes: 256 * 1024 * 1024 * 1024, // 256 GB
    postLimit: 100,
    postLimitWindowInSeconds: 24 * 60 * 60, // 24 hours
  },
  instagram: {
    allowedPostTypes: ['post', 'reel', 'story', 'thread'],
    maxPostLength: 2200,
    minMediaPerPost: 1,
    maxMediaPerPost: 10,
    mediaAllowedMimeTypes: ['image/jpeg', 'image/png', 'video/mp4'],
    mediaMaxSizeInBytes: 100 * 1024 * 1024, // 100 MB
    postLimit: 100,
    postLimitWindowInSeconds: 24 * 60 * 60, // 24 hours
    threadSettings: {
      handlingStrategy: 'concat',
      limit: 10,
    },
  },
  linkedin: {
    allowedPostTypes: ['post', 'reel', 'thread'],
    maxPostLength: 3000,
    minMediaPerPost: 0,
    maxMediaPerPost: 20,
    mediaAllowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
    mediaMaxSizeInBytes: 200 * 1024 * 1024, // 200 MB
    postLimit: 100,
    postLimitWindowInSeconds: 24 * 60 * 60, // 24 hours
    threadSettings: {
      handlingStrategy: 'concat',
      limit: 10,
    },
  },
}
