import { ioc } from '@bulkit/api/ioc'
import { ChannelManager } from '@bulkit/api/modules/channels/abstract/channel.manager'
import { LinkedInAuthenticator } from '@bulkit/api/modules/channels/providers/linkedin/linkedin-channel.authenticator'
import { LinkedInChannelPublisher } from '@bulkit/api/modules/channels/providers/linkedin/linkedin-channel.publisher'

class LinkedInChannelManager extends ChannelManager {
  constructor() {
    super('linkedin', LinkedInAuthenticator, LinkedInChannelPublisher)
  }
}

export const injectLinkedInChannelManager = ioc.register('linkedinChannelManager', () => {
  return new LinkedInChannelManager()
})
