import { ChannelManager } from '@bulkit/api/modules/channels/abstract/channel.manager'
import { xChannelAuthenticator } from '@bulkit/api/modules/channels/providers/x/x-channel.authenticator'
import { xChannelPublisher } from '@bulkit/api/modules/channels/providers/x/x-channel.publisher'

class XChannelManager extends ChannelManager {
  constructor() {
    super('x', xChannelAuthenticator, xChannelPublisher)
  }
}

export const xChannelManager = new XChannelManager()
