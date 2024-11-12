import { iocRegister } from '@bulkit/api/ioc'
import { ChannelManager } from '@bulkit/api/modules/channels/abstract/channel.manager'
import { FacebookChannelAuthenticator } from './facebook-channel.authenticator'
import { FacebookChannelPublisher } from './facebook-channel.publisher'

class FacebookChannelManager extends ChannelManager {
  constructor() {
    super('facebook', FacebookChannelAuthenticator, FacebookChannelPublisher)
  }
}

export const injectFacebookChannelManager = iocRegister(
  'facebookChannelManager',
  () => new FacebookChannelManager()
)
