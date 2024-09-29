import { iocRegister } from '@bulkit/api/ioc'
import { ChannelManager } from '@bulkit/api/modules/channels/abstract/channel.manager'
import { YoutubeAuthenticator } from '@bulkit/api/modules/channels/providers/youtube/youtube-channel.authenticator'
import { YoutubeChannelPublisher } from '@bulkit/api/modules/channels/providers/youtube/youtube-channel.publisher'

class YoutubeChannelManager extends ChannelManager {
  constructor() {
    super('youtube', YoutubeAuthenticator, YoutubeChannelPublisher)
  }
}

export const injectYoutubeChannelManager = iocRegister(
  'youtubeChannelManager',
  () => new YoutubeChannelManager()
)
