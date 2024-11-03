import { drive } from '@bulkit/api/drive/drive'
import {
  ChannelPublisher,
  type ChannelPostResult,
  type PostMetrics,
} from '@bulkit/api/modules/channels/abstract/channel.manager'
import { buildXClient } from '@bulkit/api/modules/channels/providers/x/x-api-client'
import type { ChannelWithIntegration } from '@bulkit/api/modules/channels/services/channels.service'
import type { Post } from '@bulkit/api/modules/posts/services/posts.service'
import type { Resource } from '@bulkit/api/modules/resources/services/resources.service'
import { appLogger } from '@bulkit/shared/utils/logger'
import { Rettiwt } from 'rettiwt-api'
import type { TwitterApi } from 'twitter-api-v2'

export class XChannelPublisher extends ChannelPublisher {
  private rettiwt = new Rettiwt()

  protected async postReel(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'reel' }>
  ): Promise<ChannelPostResult> {
    const client = buildXClient(
      channel.socialMediaIntegration.accessToken,
      channel.socialMediaIntegration.refreshToken!
    )
    try {
      const mediaIds = post.resource ? await this.postMedia(client, [post.resource]) : []

      const result = await client.v2.tweet(post.description, {
        media: mediaIds.length ? { media_ids: mediaIds as [string] } : undefined,
      })

      return this.getChannelPostResult(result.data.id, channel)
    } catch (error) {
      console.error('Error posting reel:', error)
      throw new Error('Failed to post reel')
    }
  }

  protected postStory(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'story' }>
  ): Promise<ChannelPostResult> {
    throw new Error('Stories are not supported on Twitter')
  }

  protected async postThread(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'thread' }>
  ): Promise<ChannelPostResult> {
    const client = buildXClient(
      channel.socialMediaIntegration.accessToken,
      channel.socialMediaIntegration.refreshToken!
    )
    const sortedItems = post.items.sort((a, b) => a.order - b.order)
    try {
      let lastTweetId: string | undefined
      let firstTweetId: string | undefined

      for (const tweet of sortedItems) {
        const mediaIds = await this.postMedia(
          client,
          tweet.media.map((r) => r.resource)
        )

        const { data } = await client.v2.tweet(tweet.text, {
          reply: lastTweetId ? { in_reply_to_tweet_id: lastTweetId } : undefined,
          media: mediaIds.length ? { media_ids: mediaIds as [string] } : undefined,
        })

        if (firstTweetId === undefined) {
          firstTweetId = data.id
        }

        lastTweetId = data.id
      }

      // TODO: handle this
      return this.getChannelPostResult(firstTweetId! ?? '', channel)
    } catch (error) {
      console.error('Error posting thread:', error)
      throw new Error('Failed to post thread')
    }
  }

  protected async postPost(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'post' }>
  ): Promise<ChannelPostResult> {
    const client = buildXClient(
      channel.socialMediaIntegration.accessToken,
      channel.socialMediaIntegration.refreshToken!
    )
    try {
      const mediaIds = await this.postMedia(
        client,
        post.media.map((r) => r.resource)
      )

      const result = await client.v2.tweet(post.text, {
        media: mediaIds.length ? { media_ids: mediaIds as [string] } : undefined,
      })

      return this.getChannelPostResult(result.data.id, channel)
    } catch (error) {
      appLogger.error('Error posting tweet:')
      appLogger.error(error)
      throw new Error('Failed to post tweet')
    }
  }

  protected async getMetrics(
    scheduledPost: {
      id: string
      externalReferenceId: string
    },
    oldMetrics: PostMetrics | null
  ): Promise<PostMetrics> {
    const tweetData = await this.rettiwt.tweet.details(scheduledPost.externalReferenceId)

    if (!tweetData) {
      throw new Error('Failed to get tweet metrics')
    }

    return {
      likes: tweetData.likeCount ?? oldMetrics?.likes ?? 0,
      shares: tweetData.retweetCount ?? oldMetrics?.shares ?? 0,
      comments: tweetData.replyCount ?? oldMetrics?.comments ?? 0,
      impressions: tweetData.viewCount ?? oldMetrics?.impressions ?? 0,
      clicks: oldMetrics?.clicks ?? 0,
      reach: oldMetrics?.reach ?? 0,
    }
  }

  private async postMedia(client: TwitterApi, resources: Resource[]): Promise<string[]> {
    const uploadedIds: string[] = []
    let i = 0
    for (const resource of resources) {
      if (i > 3) break
      const buffer = Buffer.from(await drive.use().getBytes(resource.location))
      // client.loginWithOAuth2().

      const mediaId = await client.v1.uploadMedia(buffer, {
        target: 'tweet',
        mimeType: resource.type,
        // mimeType: mediaItem.resource.type,
      })
      uploadedIds.push(mediaId)
      i++
    }

    if (resources.length > 4) {
      appLogger.warn(
        'X (Twitter) only supports up to 4 media items per tweet. Some media items were removed.'
      )
    }

    return uploadedIds
  }

  private getChannelPostResult(
    tweetId: string,
    channel: ChannelWithIntegration
  ): ChannelPostResult {
    return {
      externalReferenceId: tweetId,
      externalUrl: `https://x.com/${channel.handle ?? channel.name}/status/${tweetId}`,
    }
  }
}
