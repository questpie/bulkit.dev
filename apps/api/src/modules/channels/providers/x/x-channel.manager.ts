import { iocRegister } from '@bulkit/api/ioc'
import { ChannelManager } from '@bulkit/api/modules/channels/abstract/channel.manager'
import { XChannelAuthenticator } from '@bulkit/api/modules/channels/providers/x/x-channel.authenticator'
import { XChannelPublisher } from '@bulkit/api/modules/channels/providers/x/x-channel.publisher'

class XChannelManager extends ChannelManager {
  constructor() {
    super('x', XChannelAuthenticator, XChannelPublisher)
  }
}

export const injectXChannelManager = iocRegister('xChannelManager', () => new XChannelManager())
