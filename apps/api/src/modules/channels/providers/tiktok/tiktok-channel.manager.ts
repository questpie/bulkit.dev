import type { Platform, PostType } from '@bulkit/shared/constants/db.constants'
import type { SelectPost } from '@bulkit/api/db/db.schema'
import { getOAuthProvider } from '@bulkit/api/modules/auth/oauth'
import type { ChannelWithIntegration } from '@bulkit/api/modules/channels/services/channels.service'
import { ChannelManager } from '@bulkit/api/modules/channels/abstract/channel.manager'

export class TikTokChannelManager extends ChannelManager {
  allowedPostTypes: PostType[] = ['short']
  constructor() {
    super('tiktok' as Platform, getOAuthProvider('tiktok'))
  }

  postShort(channel: ChannelWithIntegration, post: SelectPost): Promise<void> {
    throw new Error('Method not implemented.')
  }
  postStory(channel: ChannelWithIntegration, post: SelectPost): Promise<void> {
    throw new Error('Method not implemented.')
  }
  postThread(channel: ChannelWithIntegration, post: SelectPost): Promise<void> {
    throw new Error('Method not implemented.')
  }
  postPost(channel: ChannelWithIntegration, post: SelectPost): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
