import type { PostType } from '@bulkit/api/db/db.constants'
import type { SelectPost } from '@bulkit/api/db/db.schema'
import { getOAuthProvider } from '@bulkit/api/modules/auth/oauth'
import type { ChannelWithIntegration } from '@bulkit/api/modules/channels/channels.dal'
import { ChannelManager } from '@bulkit/api/modules/channels/providers/channel-manager.abstract'
import { TwitterApi } from 'twitter-api-v2'

export class XChannelManager extends ChannelManager {
  constructor() {
    super('x', getOAuthProvider('x'))
  }

  getAllowedPostTypes(): PostType[] {
    return ['post', 'short', 'thread']
  }

  async sendPost(channel: ChannelWithIntegration, post: SelectPost): Promise<void> {
    const client = new TwitterApi(channel.socialMediaIntegration.accessToken)
    // return client.v1.tweet(post
  }
}
