import type { Platform, PostType } from '@bulkit/shared/constants/db.constants'
import type { SelectPost } from '@bulkit/api/db/db.schema'
import { getOAuthProvider } from '@bulkit/api/modules/auth/oauth'
import type { ChannelWithIntegration } from '@bulkit/api/modules/channels/channels.dal'
import { ChannelManager } from '@bulkit/api/modules/channels/providers/channel-manager.abstract'

export class LinkedInChannelManager extends ChannelManager {
  allowedPostTypes: PostType[] = ['post', 'short', 'thread']
  constructor() {
    super('linkedin' as Platform, getOAuthProvider('linkedin'))
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
