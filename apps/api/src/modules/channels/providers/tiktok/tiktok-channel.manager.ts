import type { Platform, PostType } from '@bulkit/api/db/db.constants'
import type { SelectPost } from '@bulkit/api/db/db.schema'
import { getOAuthProvider } from '@bulkit/api/modules/auth/oauth'
import type { ChannelWithIntegration } from '@bulkit/api/modules/channels/channels.dal'
import { ChannelManager } from '@bulkit/api/modules/channels/providers/channel-manager.abstract'

export class TikTokChannelManager extends ChannelManager {
  constructor() {
    super('tiktok' as Platform, getOAuthProvider('tiktok'))
  }

  getAllowedPostTypes(): PostType[] {
    return ['short']
  }

  async sendPost(channel: ChannelWithIntegration, post: SelectPost): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
