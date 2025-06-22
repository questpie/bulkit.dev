import {
  ChannelPublisher,
  type PostMetrics,
} from '@bulkit/api/modules/channels/abstract/channel.manager'
import type { ChannelWithIntegration } from '@bulkit/shared/modules/channels/channels.schemas'
import type { Post } from '@bulkit/api/modules/posts/services/posts.service'
import { appLogger } from '@bulkit/shared/utils/logger'
import fetch from 'node-fetch'

export class FacebookChannelPublisher extends ChannelPublisher {
  private readonly apiVersion = 'v18.0'
  private readonly baseUrl = `https://graph.facebook.com/${this.apiVersion}`

  protected async postReel(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'reel' }>
  ): Promise<string> {
    try {
      const accessToken = channel.socialMediaIntegration.accessToken
      const pageId = channel.socialMediaIntegration.platformAccountId

      if (!post.resource || post.resource.type.split('/')[0] !== 'video') {
        throw new Error('A video resource is required for a Facebook reel')
      }

      const videoUrl = await this.drive.getSignedUrl(post.resource.location)
      const params = new URLSearchParams({
        file_url: videoUrl,
        description: post.description,
        access_token: accessToken,
        is_reel: 'true',
      })

      const response = await fetch(`${this.baseUrl}/${pageId}/videos?${params}`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(`Failed to create Facebook reel: ${await response.text()}`)
      }

      const { id: postId } = await response.json()
      appLogger.info(`Successfully posted reel to Facebook: ${postId}`)
      return postId
    } catch (error) {
      appLogger.error('Error posting reel to Facebook:', error)
      throw new Error('Failed to post reel to Facebook')
    }
  }

  protected async postStory(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'story' }>
  ): Promise<string> {
    try {
      const accessToken = channel.socialMediaIntegration.accessToken
      const pageId = channel.socialMediaIntegration.platformAccountId

      if (!post.resource) {
        throw new Error('A media resource is required for a Facebook story')
      }

      const mediaUrl = await this.drive.getSignedUrl(post.resource.location)
      const isVideo = post.resource.type.startsWith('video/')

      const params = new URLSearchParams({
        [isVideo ? 'file_url' : 'url']: mediaUrl,
        access_token: accessToken,
        story: 'true',
      })

      const endpoint = isVideo ? 'videos' : 'photos'
      const response = await fetch(`${this.baseUrl}/${pageId}/${endpoint}?${params}`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(`Failed to create Facebook story: ${await response.text()}`)
      }

      const { id: postId } = await response.json()
      appLogger.info(`Successfully posted story to Facebook: ${postId}`)
      return postId
    } catch (error) {
      appLogger.error('Error posting story to Facebook:', error)
      throw new Error('Failed to post story to Facebook')
    }
  }

  protected async postThread(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'thread' }>
  ): Promise<string> {
    try {
      const accessToken = channel.socialMediaIntegration.accessToken
      const pageId = channel.socialMediaIntegration.platformAccountId

      const sortedItems = post.items.sort((a, b) => a.order - b.order)
      const mergedText = sortedItems.map((item) => item.text).join('\n\n')
      const allMedia = sortedItems.flatMap((item) => item.media)

      // For Facebook, we'll create this as a regular post with multiple media items
      const mediaIds = await Promise.all(
        allMedia.map(async (media) => {
          const mediaUrl = await this.drive.getSignedUrl(media.resource.location)
          const isVideo = media.resource.type.startsWith('video/')

          const params = new URLSearchParams({
            [isVideo ? 'file_url' : 'url']: mediaUrl,
            published: 'false',
            access_token: accessToken,
          })

          const endpoint = isVideo ? 'videos' : 'photos'
          const response = await fetch(`${this.baseUrl}/${pageId}/${endpoint}?${params}`, {
            method: 'POST',
          })

          if (!response.ok) {
            throw new Error(`Failed to upload media: ${await response.text()}`)
          }

          const { id } = await response.json()
          return id
        })
      )

      const params = new URLSearchParams({
        message: mergedText,
        access_token: accessToken,
        attached_media: JSON.stringify(mediaIds.map((mediaId) => ({ media_fbid: mediaId }))),
      })

      const response = await fetch(`${this.baseUrl}/${pageId}/feed?${params}`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(`Failed to create Facebook thread: ${await response.text()}`)
      }

      const { id: postId } = await response.json()
      appLogger.info(`Successfully posted thread to Facebook: ${postId}`)
      return postId
    } catch (error) {
      appLogger.error('Error posting thread to Facebook:', error)
      throw new Error('Failed to post thread to Facebook')
    }
  }

  protected async postPost(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'post' }>
  ): Promise<string> {
    try {
      const accessToken = channel.socialMediaIntegration.accessToken
      const pageId = channel.socialMediaIntegration.platformAccountId

      if (!post.media || post.media.length === 0) {
        // Text-only post
        const params = new URLSearchParams({
          message: post.text,
          access_token: accessToken,
        })

        const response = await fetch(`${this.baseUrl}/${pageId}/feed?${params}`, {
          method: 'POST',
        })

        if (!response.ok) {
          throw new Error(`Failed to create Facebook post: ${await response.text()}`)
        }

        const { id: postId } = await response.json()
        return postId
      }

      // Post with media
      const mediaIds = await Promise.all(
        post.media.map(async (media) => {
          const mediaUrl = await this.drive.getSignedUrl(media.resource.location)
          const isVideo = media.resource.type.startsWith('video/')

          const params = new URLSearchParams({
            [isVideo ? 'file_url' : 'url']: mediaUrl,
            published: 'false',
            access_token: accessToken,
          })

          const endpoint = isVideo ? 'videos' : 'photos'
          const response = await fetch(`${this.baseUrl}/${pageId}/${endpoint}?${params}`, {
            method: 'POST',
          })

          if (!response.ok) {
            throw new Error(`Failed to upload media: ${await response.text()}`)
          }

          const { id } = await response.json()
          return id
        })
      )

      const params = new URLSearchParams({
        message: post.text,
        access_token: accessToken,
        attached_media: JSON.stringify(mediaIds.map((mediaId) => ({ media_fbid: mediaId }))),
      })

      const response = await fetch(`${this.baseUrl}/${pageId}/feed?${params}`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(`Failed to create Facebook post: ${await response.text()}`)
      }

      const { id: postId } = await response.json()
      return postId
    } catch (error) {
      appLogger.error('Error posting to Facebook:', error)
      throw new Error('Failed to post to Facebook')
    }
  }

  protected async getMetrics(
    channel: ChannelWithIntegration,
    externalId: string,
    oldMetrics: PostMetrics | null
  ): Promise<PostMetrics> {
    try {
      const accessToken = channel.socialMediaIntegration.accessToken

      const params = new URLSearchParams({
        fields:
          'likes.summary(true),comments.summary(true),shares,insights.metric(post_impressions_unique,post_clicks)',
        access_token: accessToken,
      })

      const response = await fetch(`${this.baseUrl}/${externalId}?${params}`)

      if (!response.ok) {
        throw new Error(`Failed to get Facebook post metrics: ${await response.text()}`)
      }

      const data = await response.json()

      return {
        likes: data.likes?.summary?.total_count ?? oldMetrics?.likes ?? 0,
        comments: data.comments?.summary?.total_count ?? oldMetrics?.comments ?? 0,
        shares: data.shares?.count ?? oldMetrics?.shares ?? 0,
        impressions: data.insights?.data?.[0]?.values?.[0]?.value ?? oldMetrics?.impressions ?? 0,
        clicks: data.insights?.data?.[1]?.values?.[0]?.value ?? oldMetrics?.clicks ?? 0,
        reach: data.insights?.data?.[0]?.values?.[0]?.value ?? oldMetrics?.reach ?? 0,
      }
    } catch (error) {
      appLogger.error('Error getting Facebook post metrics:', error)
      throw new Error('Failed to get Facebook post metrics')
    }
  }
}
