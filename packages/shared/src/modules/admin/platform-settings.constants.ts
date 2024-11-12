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

  /** Media combination rules for multi-media posts.
   * - 'no-restriction': Allow mixing different media types (images, videos, etc)
   * - 'images-only': Only allow multiple images, single video posts
   */
  mediaCombineType: 'no-restriction' | 'images-only'

  /** Optional aspect ratio constraints for images
   * - minRatio: Minimum width/height ratio allowed
   * - maxRatio: Maximum width/height ratio allowed
   */
  imageAspectRatio?: {
    minRatio: number // width/height
    maxRatio: number // width/height
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
    mediaAllowedMimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'video/x-ms-wmv',
      'video/x-msvideo',
      'video/mpeg',
      'video/webm',
      'video/3gpp',
      'video/x-flv',
    ],
    mediaMaxSizeInBytes: 512 * 1024 * 1024, // 512 MB
    postLimit: 50,
    postLimitWindowInSeconds: 24 * 60 * 60, // 24 hours
    threadSettings: { handlingStrategy: 'separate', limit: 25 },
    mediaCombineType: 'no-restriction',
  },
  facebook: {
    allowedPostTypes: ['post', 'thread', 'reel', 'story'],
    minMediaPerPost: 0,
    maxPostLength: 63206,
    maxMediaPerPost: 10,
    mediaAllowedMimeTypes: [
      'image/*',
      'video/*',
      'application/x-mpegURL', // HLS streams
      'application/dash+xml', // DASH streams
    ],
    mediaMaxSizeInBytes: 4 * 1024 * 1024 * 1024, // 4 GB
    postLimit: 50,
    postLimitWindowInSeconds: 24 * 60 * 60, // 24 hours
    threadSettings: {
      handlingStrategy: 'concat',
      limit: 50,
    },
    mediaCombineType: 'images-only',
  },
  tiktok: {
    allowedPostTypes: ['post', 'reel'],
    maxPostLength: 2200,
    minMediaPerPost: 1,
    maxMediaPerPost: 1,
    mediaAllowedMimeTypes: [
      'video/mp4',
      'video/quicktime',
      'video/x-m4v',
      'video/webm',
      'video/3gpp',
    ],
    mediaMaxSizeInBytes: 287 * 1024 * 1024, // 287 MB
    postLimit: 50,
    postLimitWindowInSeconds: 24 * 60 * 60, // 24 hours
    mediaCombineType: 'no-restriction',
  },
  youtube: {
    allowedPostTypes: ['post', 'reel'],
    maxPostLength: 5000,
    minMediaPerPost: 1,
    maxMediaPerPost: 1,
    mediaAllowedMimeTypes: ['video/*', 'application/x-mpegURL', 'application/dash+xml'],
    mediaMaxSizeInBytes: 256 * 1024 * 1024 * 1024, // 256 GB
    postLimit: 100,
    postLimitWindowInSeconds: 24 * 60 * 60, // 24 hours
    mediaCombineType: 'no-restriction',
  },
  instagram: {
    allowedPostTypes: ['post', 'reel', 'story', 'thread'],
    maxPostLength: 2200,
    minMediaPerPost: 1,
    maxMediaPerPost: 10,
    mediaAllowedMimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'video/webm',
    ],
    mediaMaxSizeInBytes: 100 * 1024 * 1024, // 100 MB
    postLimit: 100,
    postLimitWindowInSeconds: 24 * 60 * 60, // 24 hours
    threadSettings: {
      handlingStrategy: 'concat',
      limit: 10,
    },
    mediaCombineType: 'images-only',
    imageAspectRatio: {
      minRatio: 4 / 5, // 0.8
      maxRatio: 1.91 / 1, // 1.91
    },
  },
  linkedin: {
    allowedPostTypes: ['post', 'reel', 'thread'],
    maxPostLength: 3000,
    minMediaPerPost: 0,
    maxMediaPerPost: 20,
    mediaAllowedMimeTypes: ['image/*', 'video/*', 'application/x-mpegURL', 'application/dash+xml'],
    mediaMaxSizeInBytes: 200 * 1024 * 1024, // 200 MB
    postLimit: 100,
    postLimitWindowInSeconds: 24 * 60 * 60, // 24 hours
    threadSettings: {
      handlingStrategy: 'concat',
      limit: 10,
    },
    mediaCombineType: 'images-only',
    imageAspectRatio: {
      minRatio: 1 / 3, // 0.33
      maxRatio: 2.5 / 1, // 2.5
    },
  },
}
