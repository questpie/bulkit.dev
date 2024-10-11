import type { Platform, PostType } from '@bulkit/shared/constants/db.constants'
import { DEFAULT_PLATFORM_SETTINGS } from '@bulkit/shared/modules/admin/platform-settings.constants'

export function getAllowedPlatformsFromPostType(postType: PostType) {
  const result: Platform[] = []

  for (const platform in DEFAULT_PLATFORM_SETTINGS) {
    const settings = DEFAULT_PLATFORM_SETTINGS[platform as Platform]
    if (settings.allowedPostTypes.includes(postType)) {
      result.push(platform as Platform)
    }
  }

  return result
}
