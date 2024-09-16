export const POST_TYPE = ['short', 'story', 'post', 'thread'] as const
export type PostType = (typeof POST_TYPE)[number]

export const POST_TYPE_NAME = {
  short: 'Short',
  story: 'Story',
  post: 'Post',
  thread: 'Thread',
} as const

export const POST_STATUS = ['draft', 'ready'] as const
export type PostStatus = (typeof POST_STATUS)[number]

export const PLATFORMS = [
  'instagram',
  'facebook',
  'tiktok',
  'youtube',
  'x',
  'linkedin',
  // 'google',
] as const

export const PLATFORM_TO_NAME = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  x: 'X (Twitter)',
  linkedin: 'LinkedIn',
  // google: 'Google',
}

export type Platform = (typeof PLATFORMS)[number]

export const USER_ROLE = ['owner', 'member'] as const
export type UserRole = (typeof USER_ROLE)[number]

/**
 *
 * Enum representing the possible statuses of a channel.
 * @readonly
 * @enum {string}
 * @property {string} active - The channel is currently active and functioning normally.
 * @property {string} inactive - The channel is currently inactive or archived.
 * @property {string} error - The channel is experiencing an auth error or other issue.
 */
export const CHANNEL_STATUS = ['active', 'inactive', 'error'] as const
export type ChannelStatus = (typeof CHANNEL_STATUS)[number]

export const SCHEDULED_POST_STATUS = ['pending', 'published', 'failed'] as const
export type ScheduledPostStatus = (typeof SCHEDULED_POST_STATUS)[number]
