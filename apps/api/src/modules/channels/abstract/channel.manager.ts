import type { TransactionLike } from '@bulkit/api/db/db.client'
import type { channelAuthRotes } from '@bulkit/api/modules/channels/channel-auth.routes'
import type { ChannelWithIntegration } from '@bulkit/api/modules/channels/services/channels.service'
import type { Post } from '@bulkit/api/modules/posts/services/posts.service'
import type { Platform } from '@bulkit/shared/constants/db.constants'
import type { InferContext } from 'elysia'

export abstract class ChannelAuthenticator {
  abstract handleAuthRequest(ctx: InferContext<typeof channelAuthRotes>): Promise<string>
  abstract handleAuthCallback(ctx: InferContext<typeof channelAuthRotes>): Promise<any>

  /**
   * If channel has some sort of refreshing mechanism, this method should be implemented.
   * @param db The database transaction
   * @param channel
   */
  abstract handleRenewal(
    db: TransactionLike,
    channel: ChannelWithIntegration
  ): Promise<ChannelWithIntegration>
}

export abstract class ChannelPublisher {
  publishPost(channel: ChannelWithIntegration, post: Post) {
    switch (post.type) {
      case 'post':
        return this.postPost(channel, post)
      case 'reel':
        return this.postReel(channel, post)
      case 'story':
        return this.postStory(channel, post)
      case 'thread':
        return this.postThread(channel, post)
    }
  }

  protected abstract postReel(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'reel' }>
  ): Promise<void>
  protected abstract postStory(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'story' }>
  ): Promise<void>
  protected abstract postThread(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'thread' }>
  ): Promise<void>
  protected abstract postPost(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'post' }>
  ): Promise<void>
}

export abstract class ChannelManager {
  protected constructor(
    readonly platform: Platform,
    readonly authenticator: ChannelAuthenticator,
    readonly publisher: ChannelPublisher
  ) {}
}
