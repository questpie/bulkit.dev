import {
  ChannelPublisher,
  type PostMetrics,
} from '@bulkit/api/modules/channels/abstract/channel.manager'
import type { ChannelWithIntegration } from '@bulkit/api/modules/channels/services/channels.service'
import type { Post } from '@bulkit/api/modules/posts/services/posts.service'
import { appLogger } from '@bulkit/shared/utils/logger'
import { buildYouTubeClient } from './youtube-api-client'

export class YoutubeChannelPublisher extends ChannelPublisher {
  protected async postReel(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'reel' }>
  ): Promise<string> {
    const client = await buildYouTubeClient(
      channel.socialMediaIntegration.accessToken,
      channel.socialMediaIntegration.refreshToken!
    )

    if (!post.resource) {
      throw new Error(`Post resource is required for YouTube Shorts. Post ID: ${post.id}`)
    }

    try {
      const fileStream = await this.drive.getStream(post.resource.location)

      const res = await client.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: post.description.substring(0, 100),
            description: post.description,
            tags: ['#Shorts'],
          },
          status: {
            privacyStatus: 'public',
            selfDeclaredMadeForKids: false,
          },
        },
        media: {
          body: fileStream,
        },
      })

      appLogger.info(`Successfully uploaded YouTube Short: ${res.data.id}`)
      return res.data.id!
    } catch (error) {
      appLogger.error('Error posting YouTube Short:', error)
      throw new Error('Failed to post YouTube Short')
    }
  }

  protected postStory(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'story' }>
  ): Promise<string> {
    throw new Error('Stories are not supported on YouTube')
  }

  protected postThread(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'thread' }>
  ): Promise<string> {
    throw new Error('Threads are not supported on YouTube')
  }

  protected async postPost(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'post' }>
  ): Promise<string> {
    throw new Error('Bulletin posts are already deprecated on YouTube')
  }

  protected async getMetrics(
    channel: ChannelWithIntegration,
    externalId: string,
    oldMetrics: PostMetrics | null
  ): Promise<PostMetrics> {
    const client = await buildYouTubeClient(
      channel.socialMediaIntegration.accessToken,
      channel.socialMediaIntegration.refreshToken!
    )

    try {
      const response = await client.videos.list({
        part: ['statistics'],
        id: [externalId],
      })

      const videoStats = response.data.items?.[0]?.statistics

      if (!videoStats) {
        throw new Error('Failed to get video metrics')
      }

      return {
        likes: Number(videoStats.likeCount) ?? oldMetrics?.likes ?? 0,
        shares: oldMetrics?.shares ?? 0, // YouTube API doesn't provide share count
        comments: Number(videoStats.commentCount) ?? oldMetrics?.comments ?? 0,
        impressions: Number(videoStats.viewCount) ?? oldMetrics?.impressions ?? 0,
        clicks: oldMetrics?.clicks ?? 0,
        reach: oldMetrics?.reach ?? 0,
      }
    } catch (error) {
      appLogger.error('Error getting YouTube video metrics:', error)
      throw new Error('Failed to get YouTube video metrics')
    }
  }
}
