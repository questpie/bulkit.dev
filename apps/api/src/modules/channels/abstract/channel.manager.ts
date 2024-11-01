import { injectDatabase, type TransactionLike } from '@bulkit/api/db/db.client'
import { ioc, iocResolve } from '@bulkit/api/ioc'
import type { channelAuthRoutes } from '@bulkit/api/modules/channels/channel-auth.routes'
import type { ChannelWithIntegration } from '@bulkit/api/modules/channels/services/channels.service'
import type { Post } from '@bulkit/api/modules/posts/services/posts.service'
import type { Platform } from '@bulkit/shared/constants/db.constants'
import type { InferContext } from 'elysia'

export abstract class ChannelAuthenticator {
  abstract handleAuthRequest(ctx: InferContext<typeof channelAuthRoutes>): Promise<string>
  abstract handleAuthCallback(ctx: InferContext<typeof channelAuthRoutes>): Promise<any>

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

export type ChannelPostResult = {
  externalReferenceId: string
  externalUrl: string
}

export abstract class ChannelPublisher {
  constructor(private readonly authenticator: ChannelAuthenticator) {}

  async publishPost(channel: ChannelWithIntegration, post: Post): Promise<ChannelPostResult> {
    let refreshedChannel = channel

    if (
      channel.socialMediaIntegration.tokenExpiry &&
      Date.now() >= new Date(channel.socialMediaIntegration.tokenExpiry).getTime()
    ) {
      const { db } = iocResolve(ioc.use(injectDatabase))
      refreshedChannel = await this.authenticator.handleRenewal(db, channel)
    }

    let result: ChannelPostResult

    switch (post.type) {
      case 'post':
        result = await this.postPost(refreshedChannel, post)
        break
      case 'reel':
        result = await this.postReel(refreshedChannel, post)
        break
      case 'story':
        result = await this.postStory(refreshedChannel, post)
        break
      case 'thread':
        result = await this.postThread(refreshedChannel, post)
        break
      default:
        throw new Error(`Unsupported post type: ${(post as any).type}`)
    }

    return result
  }

  protected abstract postReel(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'reel' }>
  ): Promise<ChannelPostResult>
  protected abstract postStory(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'story' }>
  ): Promise<ChannelPostResult>
  protected abstract postThread(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'thread' }>
  ): Promise<ChannelPostResult>
  protected abstract postPost(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'post' }>
  ): Promise<ChannelPostResult>
}

export abstract class ChannelManager {
  public readonly publisher: ChannelPublisher
  public readonly authenticator: ChannelAuthenticator

  protected constructor(
    readonly platform: Platform,
    readonly AuthenticatorFactory: new () => ChannelAuthenticator,
    private readonly PublisherFactory: new (authenticator: ChannelAuthenticator) => ChannelPublisher
  ) {
    this.authenticator = new this.AuthenticatorFactory()
    this.publisher = new this.PublisherFactory(this.authenticator)
  }
}
