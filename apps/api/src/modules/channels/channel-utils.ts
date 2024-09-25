import { envApi } from '@bulkit/api/envApi'
import { xChannelManager } from '@bulkit/api/modules/channels/providers/x/x-channel.manager'
import type { Platform } from '@bulkit/shared/constants/db.constants'

export function buildChannelRedirectUri(platform: Platform) {
  return `${envApi.SERVER_URL}/channels/auth/${platform}/callback`
}

export function getChannelManager<TPlatform extends Platform>(platform: TPlatform) {
  switch (platform) {
    // case 'instagram':
    //   return new InstagramChannelManager()
    // case 'facebook':
    //   return new FacebookChannelManager()
    // case 'tiktok':
    //   return new TikTokChannelManager()
    // case 'youtube':
    //   return new YouTubeChannelManager()
    case 'x':
      return xChannelManager
    // case 'linkedin':
    //   return new LinkedInChannelManager()
    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}
