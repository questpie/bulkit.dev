import {
  ChannelPublisher,
  type PostMetrics,
} from '@bulkit/api/modules/channels/abstract/channel.manager'
import { buildTikTokClient } from '@bulkit/api/modules/channels/providers/tiktok/tiktok-api-client'
import type { ChannelWithIntegration } from '@bulkit/api/modules/channels/services/channels.service'
import type { Post } from '@bulkit/api/modules/posts/services/posts.service'
import { appLogger } from '@bulkit/shared/utils/logger'

export class TikTokChannelPublisher extends ChannelPublisher {
  protected async postReel(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'reel' }>
  ): Promise<string> {
    try {
      const client = await buildTikTokClient(
        channel.socialMediaIntegration.accessToken,
        channel.socialMediaIntegration.refreshToken!
      )

      if (!post.resource) {
        throw new Error('A video resource is required for a TikTok video')
      }

      const videoUrl = await this.drive.getSignedUrl(post.resource.location)

      // Implementation will depend on TikTok's API specifics
      const response = await client.videos.upload({
        video_url: videoUrl,
        description: post.description,
      })

      appLogger.info(`Successfully posted video to TikTok: ${response.id}`)
      return response.id
    } catch (error) {
      appLogger.error('Error posting to TikTok:', error)
      throw new Error('Failed to post to TikTok')
    }
  }

  protected async postPost(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'post' }>
  ): Promise<string> {
    // TikTok only supports video content
    throw new Error('Regular posts are not supported on TikTok')
  }

  protected async postStory(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'story' }>
  ): Promise<string> {
    throw new Error('Stories are not supported on TikTok')
  }

  protected async postThread(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'thread' }>
  ): Promise<string> {
    throw new Error('Threads are not supported on TikTok')
  }

  protected async getMetrics(
    channel: ChannelWithIntegration,
    externalId: string,
    oldMetrics: PostMetrics | null
  ): Promise<PostMetrics> {
    try {
      const client = await buildTikTokClient(
        channel.socialMediaIntegration.accessToken,
        channel.socialMediaIntegration.refreshToken!
      )

      const stats = await client.videos.getStats(externalId)

      return {
        likes: stats.like_count ?? oldMetrics?.likes ?? 0,
        comments: stats.comment_count ?? oldMetrics?.comments ?? 0,
        shares: stats.share_count ?? oldMetrics?.shares ?? 0,
        impressions: stats.view_count ?? oldMetrics?.impressions ?? 0,
        reach: stats.reach_count ?? oldMetrics?.reach ?? 0,
        clicks: oldMetrics?.clicks ?? 0,
      }
    } catch (error) {
      appLogger.error('Error getting TikTok metrics:', error)
      throw new Error('Failed to get TikTok metrics')
    }
  }
}
