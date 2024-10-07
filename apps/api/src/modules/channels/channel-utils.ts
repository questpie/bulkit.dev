import { envApi } from '@bulkit/api/envApi'
import { ioc, iocResolve } from '@bulkit/api/ioc'
import { injectXChannelManager } from '@bulkit/api/modules/channels/providers/x/x-channel.manager'
import { injectYoutubeChannelManager } from '@bulkit/api/modules/channels/providers/youtube/youtube-channel.manager'
import { injectInstagramChannelManager } from '@bulkit/api/modules/channels/providers/instagram/instagram-channel.manager'
import type { Platform } from '@bulkit/shared/constants/db.constants'
export function buildChannelRedirectUri(platform: Platform) {
  return `${envApi.SERVER_URL}/channels/auth/${platform}/callback`
}

export function resolveChannelManager<TPlatform extends Platform>(platform: TPlatform) {
  const container = iocResolve(
    ioc
      .use(injectXChannelManager)
      .use(injectYoutubeChannelManager)
      .use(injectInstagramChannelManager)
  )

  switch (platform) {
    case 'instagram':
      return container.instagramChannelManager
    case 'youtube':
      return container.youtubeChannelManager
    case 'x':
      return container.xChannelManager
    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}
