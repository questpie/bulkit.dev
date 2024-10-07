// apps/api/src/modules/channels/providers/instagram/instagram-channel.manager.ts

import { iocRegister } from '@bulkit/api/ioc'
import { ChannelManager } from '@bulkit/api/modules/channels/abstract/channel.manager'
import { InstagramChannelAuthenticator } from '@bulkit/api/modules/channels/providers/instagram/instagram-channel.authenticator'
import { InstagramChannelPublisher } from '@bulkit/api/modules/channels/providers/instagram/instagram-channel.publisher'

class InstagramChannelManager extends ChannelManager {
  constructor() {
    super('instagram', InstagramChannelAuthenticator, InstagramChannelPublisher)
  }
}

export const injectInstagramChannelManager = iocRegister(
  'instagramChannelManager',
  () => new InstagramChannelManager()
)
