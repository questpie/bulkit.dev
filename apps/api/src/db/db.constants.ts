export const POST_TYPE = ['short', 'story', 'post', 'thread'] as const
export type PostType = (typeof POST_TYPE)[number]

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
  x: 'X',
  linkedin: 'LinkedIn',
  // google: 'Google',
}

export type Platform = (typeof PLATFORMS)[number]

export const USER_ROLE = ['owner', 'member'] as const
export type UserRole = (typeof USER_ROLE)[number]

export const CHANNEL_STATUS = ['active', 'inactive', 'pending'] as const
export type ChannelStatus = (typeof CHANNEL_STATUS)[number]

export const SCHEDULED_POST_STATUS = ['pending', 'published', 'failed'] as const
export type ScheduledPostStatus = (typeof SCHEDULED_POST_STATUS)[number]
