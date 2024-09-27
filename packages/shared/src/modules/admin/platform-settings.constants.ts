import type { Platform } from '@bulkit/shared/constants/db.constants'

/**
 * Represents the settings for a social media platform.
 */
type PlatformSettings = {
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
  /** Type of thread supported by the platform.
   * - 'multiple-posts': Each thread item is a singular post
   * - 'first-post-only': Only the first post in a thread is considered
   * - 'concat-all': Concatenate all thread items (text + media) into singular post
   * - 'concat-text-media-first': Concatenate all thread items (text only) into singular post, only media from first post is included
   * - 'concat-text-only': Concatenate all thread items (text only) into singular post
   *
   */
  threadHandlingStrategy: 'multiple-posts' | 'first-post-only' | 'concat-all'
  /** Maximum number of posts in a thread. */
  threadLimit: number
}

/**
 * Default settings for various social media platforms.
 */
export const DEFAULT_PLATFORM_SETTINGS: Record<Platform, PlatformSettings> = {
  x: {
    maxPostLength: 280,
    maxMediaPerPost: 4,
    mediaAllowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
    mediaMaxSizeInBytes: 512 * 1024 * 1024, // 512 MB
    postLimit: 50,
    postLimitWindowInSeconds: 24 * 60 * 60, // 24 hours
    threadHandlingStrategy: 'multiple-posts',
    threadLimit: 25,
  },
  facebook: {
    maxPostLength: 63206,
    maxMediaPerPost: 10,
    mediaAllowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
    mediaMaxSizeInBytes: 4 * 1024 * 1024 * 1024, // 4 GB
    postLimit: 50,
    postLimitWindowInSeconds: 24 * 60 * 60, // 24 hours
    threadHandlingStrategy: 'concat-all',
    threadLimit: 50,
  },
  tiktok: {
    maxPostLength: 2200,
    maxMediaPerPost: 1,
    mediaAllowedMimeTypes: ['video/mp4'],
    mediaMaxSizeInBytes: 287 * 1024 * 1024, // 287 MB
    postLimit: 50,
    postLimitWindowInSeconds: 24 * 60 * 60, // 24 hours
    threadHandlingStrategy: 'first-post-only',
    threadLimit: 1,
  },
  youtube: {
    maxPostLength: 5000,
    maxMediaPerPost: 1,
    mediaAllowedMimeTypes: ['video/mp4'],
    mediaMaxSizeInBytes: 256 * 1024 * 1024 * 1024, // 256 GB
    postLimit: 100,
    postLimitWindowInSeconds: 24 * 60 * 60, // 24 hours
    threadHandlingStrategy: 'first-post-only',
    threadLimit: 1,
  },
  instagram: {
    maxPostLength: 2200,
    maxMediaPerPost: 10,
    mediaAllowedMimeTypes: ['image/jpeg', 'image/png', 'video/mp4'],
    mediaMaxSizeInBytes: 100 * 1024 * 1024, // 100 MB
    postLimit: 100,
    postLimitWindowInSeconds: 24 * 60 * 60, // 24 hours
    threadHandlingStrategy: 'concat-all',
    threadLimit: 1,
  },
  linkedin: {
    maxPostLength: 3000,
    maxMediaPerPost: 20,
    mediaAllowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
    mediaMaxSizeInBytes: 200 * 1024 * 1024, // 200 MB
    postLimit: 100,
    postLimitWindowInSeconds: 24 * 60 * 60, // 24 hours
    threadHandlingStrategy: 'concat-all',
    threadLimit: 1,
  },
}
