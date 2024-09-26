import { drive } from '@bulkit/api/drive/drive'
import { ChannelPublisher } from '@bulkit/api/modules/channels/abstract/channel.manager'
import { buildXClient } from '@bulkit/api/modules/channels/providers/x/x-api-client'
import type { ChannelWithIntegration } from '@bulkit/api/modules/channels/services/channels.service'
import type { Post } from '@bulkit/api/modules/posts/services/posts.service'
import { appLogger } from '@bulkit/shared/utils/logger'
import type { TwitterApi } from 'twitter-api-v2'

class XChannelPublisher extends ChannelPublisher {
  protected async postReel(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'reel' }>
  ): Promise<void> {
    const client = buildXClient(
      channel.socialMediaIntegration.accessToken,
      channel.socialMediaIntegration.refreshToken!
    )
    try {
      const mediaIds = post.resource ? await this.postMedia(client, [post.resource]) : []

      await client.v2.tweet(post.description, {
        media: mediaIds.length ? { media_ids: mediaIds as [string] } : undefined,
      })
    } catch (error) {
      console.error('Error posting reel:', error)
      throw new Error('Failed to post reel')
    }
  }

  protected postStory(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'story' }>
  ): Promise<void> {
    throw new Error('Stories are not supported on Twitter')
  }

  protected async postThread(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'thread' }>
  ): Promise<void> {
    const client = buildXClient(
      channel.socialMediaIntegration.accessToken,
      channel.socialMediaIntegration.refreshToken!
    )
    const sortedItems = post.items.sort((a, b) => a.order - b.order)
    try {
      let lastTweetId: string | undefined

      for (const tweet of sortedItems) {
        const mediaIds = await this.postMedia(client, tweet.media)

        const { data } = await client.v2.tweet(tweet.text, {
          reply: lastTweetId ? { in_reply_to_tweet_id: lastTweetId } : undefined,
          media: mediaIds.length ? { media_ids: mediaIds as [string] } : undefined,
        })

        lastTweetId = data.id
      }
    } catch (error) {
      console.error('Error posting thread:', error)
      throw new Error('Failed to post thread')
    }
  }

  protected async postPost(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'post' }>
  ): Promise<void> {
    const client = buildXClient(
      channel.socialMediaIntegration.accessToken,
      channel.socialMediaIntegration.refreshToken!
    )
    try {
      const mediaIds = await this.postMedia(client, post.media)

      await client.v2.tweet(post.text, {
        media: mediaIds.length ? { media_ids: mediaIds as [string] } : undefined,
      })
    } catch (error) {
      appLogger.error('Error posting tweet:')
      appLogger.error(error)
      throw new Error('Failed to post tweet')
    }
  }

  private async postMedia(client: TwitterApi, mediaItems: any[]): Promise<string[]> {
    const mediaIds: string[] = []
    let i = 0
    for (const mediaItem of mediaItems) {
      if (i > 3) break
      const buffer = Buffer.from(await drive.use().getBytes(mediaItem.resource.location))
      // client.loginWithOAuth2().

      const mediaId = await client.v1.uploadMedia(buffer, {
        target: 'tweet',
        mimeType: mediaItem.resource.type,
        // mimeType: mediaItem.resource.type,
      })
      mediaIds.push(mediaId)
      i++
    }

    if (mediaIds.length > 4) {
      mediaIds.splice(4)
      appLogger.warn(
        'Twitter only supports up to 4 media items per tweet. Some media items were removed.'
      )
    }

    return mediaIds
  }
}

export const xChannelPublisher = new XChannelPublisher()
