import { envApi } from '@bulkit/api/envApi'
import { ioc } from '@bulkit/api/ioc'
import { injectXChannelManager } from '@bulkit/api/modules/channels/providers/x/x-channel.manager'
import { injectYoutubeChannelManager } from '@bulkit/api/modules/channels/providers/youtube/youtube-channel.manager'
import { injectInstagramChannelManager } from '@bulkit/api/modules/channels/providers/instagram/instagram-channel.manager'
import type { Platform } from '@bulkit/shared/constants/db.constants'
import { injectFacebookChannelManager } from '@bulkit/api/modules/channels/providers/facebook/facebook-channel.manager'
import { injectLinkedInChannelManager } from '@bulkit/api/modules/channels/providers/linkedin/linkedin-channel.manager'
import { injectTikTokChannelManager } from '@bulkit/api/modules/channels/providers/tiktok/tiktok-channel.manager'

export function buildChannelRedirectUri(platform: Platform) {
  return `${envApi.SERVER_URL}/channels/auth/${platform}/callback`
}

export function resolveChannelManager<TPlatform extends Platform>(platform: TPlatform) {
  const container = ioc.resolve([
    injectXChannelManager,
    injectYoutubeChannelManager,
    injectInstagramChannelManager,
    injectFacebookChannelManager,
    injectLinkedInChannelManager,
    injectTikTokChannelManager,
  ])

  switch (platform) {
    case 'instagram':
      return container.instagramChannelManager
    case 'youtube':
      return container.youtubeChannelManager
    case 'facebook':
      return container.facebookChannelManager
    case 'x':
      return container.xChannelManager
    case 'linkedin':
      return container.linkedinChannelManager
    case 'tiktok':
      return container.tiktokChannelManager
    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}
