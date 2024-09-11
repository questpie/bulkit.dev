import type { Platform, PostType } from '@bulkit/api/db/db.constants'
import type { SelectPost } from '@bulkit/api/db/db.schema'
import { getOAuthProvider } from '@bulkit/api/modules/auth/oauth'
import type { ChannelWithIntegration } from '@bulkit/api/modules/channels/channels.dal'
import { ChannelManager } from '@bulkit/api/modules/channels/providers/channel-manager.abstract'

export class InstagramChannelManager extends ChannelManager {
  constructor() {
    super('instagram' as Platform, getOAuthProvider('instagram'))
  }

  getAllowedPostTypes(): PostType[] {
    return ['post', 'short', 'thread', 'story']
  }

  async sendPost(channel: ChannelWithIntegration, post: SelectPost): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
