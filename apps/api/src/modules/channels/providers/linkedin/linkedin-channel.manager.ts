import type { Platform, PostType } from '@bulkit/api/db/db.constants'
import type { SelectPost } from '@bulkit/api/db/db.schema'
import { getOAuthProvider } from '@bulkit/api/modules/auth/oauth'
import type { ChannelWithIntegration } from '@bulkit/api/modules/channels/channels.dal'
import { ChannelManager } from '@bulkit/api/modules/channels/providers/channel-manager.abstract'

export class LinkedInChannelManager extends ChannelManager {
  constructor() {
    super('linkedin' as Platform, getOAuthProvider('linkedin'))
  }

  getAllowedPostTypes(): PostType[] {
    return ['post', 'short', 'thread']
  }

  async sendPost(channel: ChannelWithIntegration, post: SelectPost): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
