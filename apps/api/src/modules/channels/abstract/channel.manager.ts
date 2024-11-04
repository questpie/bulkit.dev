import { injectDatabase, type TransactionLike } from '@bulkit/api/db/db.client'
import { postMetricsHistoryTable, type InsertPostMetricsHistory } from '@bulkit/api/db/db.schema'
import { ioc, iocResolve } from '@bulkit/api/ioc'
import type { channelAuthRoutes } from '@bulkit/api/modules/channels/channel-auth.routes'
import type { ChannelWithIntegration } from '@bulkit/api/modules/channels/services/channels.service'
import type { Post } from '@bulkit/api/modules/posts/services/posts.service'
import type { Platform } from '@bulkit/shared/constants/db.constants'
import { and } from 'drizzle-orm'
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

export type PostMetrics = Omit<
  InsertPostMetricsHistory,
  'id' | 'createdAt' | 'updatedAt' | 'scheduledPostId'
>
export abstract class ChannelPublisher {
  constructor(private readonly authenticator: ChannelAuthenticator) {}

  async publishPost(channel: ChannelWithIntegration, post: Post): Promise<string> {
    let refreshedChannel = channel

    if (
      channel.socialMediaIntegration.tokenExpiry &&
      Date.now() >= new Date(channel.socialMediaIntegration.tokenExpiry).getTime()
    ) {
      const { db } = iocResolve(ioc.use(injectDatabase))
      refreshedChannel = await this.authenticator.handleRenewal(db, channel)
    }

    let externalId: string

    switch (post.type) {
      case 'post':
        externalId = await this.postPost(refreshedChannel, post)
        break
      case 'reel':
        externalId = await this.postReel(refreshedChannel, post)
        break
      case 'story':
        externalId = await this.postStory(refreshedChannel, post)
        break
      case 'thread':
        externalId = await this.postThread(refreshedChannel, post)
        break
      default:
        throw new Error(`Unsupported post type: ${(post as any).type}`)
    }

    return externalId
  }

  async saveMetrics(channel: ChannelWithIntegration, scheduledPostId: string) {
    const { db } = iocResolve(ioc.use(injectDatabase))
    const scheduledPost = await db.query.scheduledPostsTable.findFirst({
      where: (scheduledPostsTable, { eq }) =>
        and(
          eq(scheduledPostsTable.id, scheduledPostId),
          eq(scheduledPostsTable.channelId, channel.id)
        ),
    })

    if (!scheduledPost) {
      throw new Error(`Post with id ${scheduledPostId} not found for channel ${channel.id}`)
    }

    if (scheduledPost?.status !== 'published') {
      throw new Error('Post is not published')
    }

    if (!scheduledPost.externalId) {
      throw new Error('Post has no external reference id')
    }

    const oldMetrics = await db.query.postMetricsHistoryTable.findFirst({
      where: (postMetricsHistoryTable, { eq }) =>
        eq(postMetricsHistoryTable.scheduledPostId, scheduledPost.id),
      orderBy: (postMetricsHistoryTable, { desc }) => desc(postMetricsHistoryTable.createdAt),
    })

    const metrics = await this.getMetrics(channel, scheduledPost.externalId, oldMetrics ?? null)

    return db
      .insert(postMetricsHistoryTable)
      .values({
        ...metrics,
        scheduledPostId: scheduledPost.id,
      })
      .returning()
  }

  protected abstract postReel(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'reel' }>
  ): Promise<string>
  protected abstract postStory(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'story' }>
  ): Promise<string>
  protected abstract postThread(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'thread' }>
  ): Promise<string>
  protected abstract postPost(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'post' }>
  ): Promise<string>

  protected abstract getMetrics(
    channel: ChannelWithIntegration,
    externalId: string,
    oldMetrics: PostMetrics | null
  ): Promise<PostMetrics>
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
