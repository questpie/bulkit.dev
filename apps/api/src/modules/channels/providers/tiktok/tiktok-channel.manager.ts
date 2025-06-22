import { ioc } from '@bulkit/api/ioc'
import { ChannelManager } from '@bulkit/api/modules/channels/abstract/channel.manager'
import { TikTokChannelAuthenticator } from '@bulkit/api/modules/channels/providers/tiktok/tiktok-channel.authenticator'
import { TikTokChannelPublisher } from '@bulkit/api/modules/channels/providers/tiktok/tiktok-channel.publisher'

class TikTokChannelManager extends ChannelManager {
  constructor() {
    super('tiktok', TikTokChannelAuthenticator, TikTokChannelPublisher)
  }
}

export const injectTikTokChannelManager = ioc.register('tiktokChannelManager', () => {
  return new TikTokChannelManager()
})
