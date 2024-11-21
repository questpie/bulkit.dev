import {
  ChannelPublisher,
  type PostMetrics,
} from '@bulkit/api/modules/channels/abstract/channel.manager'
import type { ChannelWithIntegration } from '@bulkit/api/modules/channels/services/channels.service'
import type { Post } from '@bulkit/api/modules/posts/services/posts.service'
import { appLogger } from '@bulkit/shared/utils/logger'
import fetch from 'node-fetch'

export class InstagramChannelPublisher extends ChannelPublisher {
  private readonly apiVersion = 'v18.0' // Updated to latest stable version
  private readonly baseUrl = `https://graph.facebook.com/${this.apiVersion}` // Changed from graph.instagram.com to graph.facebook.com

  protected async postReel(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'reel' }>
  ): Promise<string> {
    try {
      const accessToken = channel.socialMediaIntegration.accessToken

      if (!post.resource || post.resource.type.split('/')[0] !== 'video') {
        throw new Error('A video resource is required for an Instagram reel')
      }

      // Step 1: Create container with REELS type
      const videoUrl = await this.drive.getSignedUrl(post.resource.location)
      const params = new URLSearchParams({
        media_type: 'REELS',
        video_url: videoUrl,
        caption: post.description,
        access_token: accessToken,
      })

      const containerResponse = await fetch(
        `${this.baseUrl}/${channel.socialMediaIntegration.platformAccountId}/media?${params}`,
        {
          method: 'POST',
        }
      )

      if (!containerResponse.ok) {
        throw new Error(`Failed to create reel container: ${await containerResponse.text()}`)
      }

      const { id: containerId } = await containerResponse.json()

      // Step 2: Publish the container
      const postId = await this.publishMedia(
        accessToken,
        containerId,
        channel.socialMediaIntegration.platformAccountId
      )

      appLogger.info(`Successfully posted reel to Instagram: ${postId}`)
      return postId
    } catch (error) {
      appLogger.error('Error posting reel to Instagram:', error)
      throw new Error('Failed to post reel to Instagram')
    }
  }

  protected async postStory(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'story' }>
  ): Promise<string> {
    try {
      const accessToken = channel.socialMediaIntegration.accessToken

      if (!post.resource) {
        throw new Error('A media resource is required for an Instagram story')
      }

      // Step 1: Create container with STORIES type
      const mediaUrl = await this.drive.getSignedUrl(post.resource.location)
      const isVideo = post.resource.type.startsWith('video/')

      const params = new URLSearchParams({
        media_type: 'STORIES',
        [isVideo ? 'video_url' : 'image_url']: mediaUrl,
        access_token: accessToken,
      })

      const containerResponse = await fetch(
        `${this.baseUrl}/${channel.socialMediaIntegration.platformAccountId}/media?${params}`,
        {
          method: 'POST',
        }
      )

      if (!containerResponse.ok) {
        throw new Error(`Failed to create story container: ${await containerResponse.text()}`)
      }

      const { id: containerId } = await containerResponse.json()

      // Step 2: Publish the container
      const postId = await this.publishMedia(
        accessToken,
        containerId,
        channel.socialMediaIntegration.platformAccountId
      )

      appLogger.info(`Successfully posted story to Instagram: ${postId}`)
      return postId
    } catch (error) {
      appLogger.error('Error posting story to Instagram:', error)
      throw new Error('Failed to post story to Instagram')
    }
  }

  protected async postThread(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'thread' }>
  ): Promise<string> {
    try {
      const accessToken = channel.socialMediaIntegration.accessToken

      const sortedItems = post.items.sort((a, b) => a.order - b.order)
      const mergedText = sortedItems.map((item) => item.text).join('\n\n')
      const allMedia = sortedItems.flatMap((item) => item.media)

      if (allMedia.length === 0) {
        throw new Error('At least one media item is required for an Instagram carousel')
      }

      // Step 1: Create containers for each media item
      const mediaContainerIds = await Promise.all(
        allMedia.map(async (media) => {
          const mediaUrl = await this.drive.getSignedUrl(media.resource.location)
          const isVideo = media.resource.type.startsWith('video/')

          const params = new URLSearchParams({
            [isVideo ? 'video_url' : 'image_url']: mediaUrl,
            is_carousel_item: 'true',
            access_token: accessToken,
          })

          if (isVideo) {
            params.append('media_type', 'VIDEO')
          }

          const response = await fetch(
            `${this.baseUrl}/${channel.socialMediaIntegration.platformAccountId}/media?${params}`,
            {
              method: 'POST',
            }
          )

          if (!response.ok) {
            throw new Error(`Failed to create media container: ${await response.text()}`)
          }

          const { id } = await response.json()
          return id
        })
      )

      // Step 2: Create carousel container
      const params = new URLSearchParams({
        media_type: 'CAROUSEL',
        children: mediaContainerIds.join(','),
        caption: mergedText,
        access_token: accessToken,
      })

      const carouselResponse = await fetch(
        `${this.baseUrl}/${channel.socialMediaIntegration.platformAccountId}/media`,
        {
          method: 'POST',
        }
      )

      if (!carouselResponse.ok) {
        throw new Error(`Failed to create carousel container: ${await carouselResponse.text()}`)
      }

      const { id: containerId } = await carouselResponse.json()

      // Step 3: Publish the carousel
      const postId = await this.publishMedia(
        accessToken,
        containerId,
        channel.socialMediaIntegration.platformAccountId
      )

      appLogger.info(`Successfully posted thread as carousel to Instagram: ${postId}`)
      return postId
    } catch (error) {
      appLogger.error('Error posting thread to Instagram:', error)
      throw new Error('Failed to post thread to Instagram')
    }
  }

  protected async postPost(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'post' }>
  ): Promise<string> {
    try {
      const accessToken = channel.socialMediaIntegration.accessToken
      const instagramId = channel.socialMediaIntegration.platformAccountId

      if (!post.media || post.media.length === 0) {
        throw new Error('At least one media item is required for an Instagram post')
      }

      if (post.media.length === 1) {
        // Single media post
        const mediaUrl = await this.drive.getSignedUrl(post.media[0]!.resource.location)
        const isVideo = post.media[0]!.resource.type.startsWith('video/')

        // Step 1: Create media container
        const params = new URLSearchParams({
          [isVideo ? 'video_url' : 'image_url']: mediaUrl,
          caption: post.text,
          access_token: accessToken,
        })

        if (isVideo) {
          params.append('media_type', 'VIDEO')
        }

        const containerResponse = await fetch(`${this.baseUrl}/${instagramId}/media?${params}`, {
          method: 'POST',
        })

        if (!containerResponse.ok) {
          throw new Error(`Failed to create media container: ${await containerResponse.text()}`)
        }

        const { id: containerId } = await containerResponse.json()

        // Step 2: Publish the container
        const publishParams = new URLSearchParams({
          creation_id: containerId,
          access_token: accessToken,
        })

        const publishResponse = await fetch(
          `${this.baseUrl}/${instagramId}/media_publish?${publishParams}`,
          {
            method: 'POST',
          }
        )

        if (!publishResponse.ok) {
          throw new Error(`Failed to publish media: ${await publishResponse.text()}`)
        }

        const { id: postId } = await publishResponse.json()
        appLogger.info(`Successfully posted to Instagram: ${postId}`)
        return postId
      }
      // Carousel post
      // Step 1: Create containers for each media item
      const mediaContainerIds = await Promise.all(
        post.media.map(async (media) => {
          const mediaUrl = await this.drive.getSignedUrl(media.resource.location)
          const isVideo = media.resource.type.startsWith('video/')

          const params = new URLSearchParams({
            [isVideo ? 'video_url' : 'image_url']: mediaUrl,
            is_carousel_item: 'true',
            access_token: accessToken,
          })

          if (isVideo) {
            params.append('media_type', 'VIDEO')
          }

          const response = await fetch(`${this.baseUrl}/${instagramId}/media?${params}`, {
            method: 'POST',
          })

          if (!response.ok) {
            throw new Error(`Failed to create carousel item container: ${await response.text()}`)
          }

          const { id } = await response.json()
          return id
        })
      )

      // Step 2: Create carousel container
      const carouselParams = new URLSearchParams({
        media_type: 'CAROUSEL',
        children: mediaContainerIds.join(','),
        caption: post.text,
        access_token: accessToken,
      })

      const carouselResponse = await fetch(
        `${this.baseUrl}/${instagramId}/media?${carouselParams}`,
        {
          method: 'POST',
        }
      )

      if (!carouselResponse.ok) {
        throw new Error(`Failed to create carousel container: ${await carouselResponse.text()}`)
      }

      const { id: containerId } = await carouselResponse.json()

      // Step 3: Publish the carousel
      const publishParams = new URLSearchParams({
        creation_id: containerId,
        access_token: accessToken,
      })

      const publishResponse = await fetch(
        `${this.baseUrl}/${instagramId}/media_publish?${publishParams}`,
        {
          method: 'POST',
        }
      )

      if (!publishResponse.ok) {
        throw new Error(`Failed to publish carousel: ${await publishResponse.text()}`)
      }

      const { id: postId } = await publishResponse.json()
      appLogger.info(`Successfully posted carousel to Instagram: ${postId}`)
      return postId
    } catch (error) {
      appLogger.error('Error posting to Instagram:', error)
      throw new Error('Failed to post to Instagram')
    }
  }

  private async waitForMediaReady(
    accessToken: string,
    containerId: string,
    instagramId: string,
    maxAttempts = 10
  ): Promise<void> {
    const params = new URLSearchParams({
      fields: 'status_code',
      access_token: accessToken,
    })

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(`${this.baseUrl}/${containerId}?${params}`)
      const data = await response.json()

      if (data.status_code === 'FINISHED') {
        return
      }
      if (data.status_code === 'ERROR') {
        throw new Error('Media processing failed')
      }

      // Wait for 2 seconds before next attempt
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    throw new Error('Media processing timeout')
  }

  private async publishMedia(
    accessToken: string,
    containerId: string,
    instagramId: string
  ): Promise<string> {
    // Wait for media to be ready before publishing
    await this.waitForMediaReady(accessToken, containerId, instagramId)

    const params = new URLSearchParams({
      creation_id: containerId,
      access_token: accessToken,
    })

    const response = await fetch(`${this.baseUrl}/${instagramId}/media_publish?${params}`, {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error(`Failed to publish media: ${await response.text()}`)
    }

    const data = await response.json()
    return data.id
  }

  protected async getMetrics(
    channel: ChannelWithIntegration,
    externalId: string,
    oldMetrics: PostMetrics | null
  ): Promise<PostMetrics> {
    try {
      const accessToken = channel.socialMediaIntegration.accessToken
      const mediaId = externalId

      const params = new URLSearchParams({
        fields: 'like_count,comments_count,engagement',
        access_token: accessToken,
      })

      const response = await fetch(`${this.baseUrl}/${mediaId}/insights?${params}`)

      if (!response.ok) {
        throw new Error(`Failed to get Instagram post metrics: ${await response.text()}`)
      }

      const data = await response.json()

      // Instagram API doesn't provide all metrics directly, so we'll use what's available
      return {
        likes: data.like_count ?? oldMetrics?.likes ?? 0,
        shares: oldMetrics?.shares ?? 0, // Instagram API doesn't provide share count
        comments: data.comments_count ?? oldMetrics?.comments ?? 0,
        impressions: data.engagement ?? oldMetrics?.impressions ?? 0, // Using engagement as a proxy for impressions
        clicks: oldMetrics?.clicks ?? 0, // Instagram API doesn't provide click count
        reach: oldMetrics?.reach ?? 0, // Instagram API doesn't provide reach in this endpoint
      }
    } catch (error) {
      appLogger.error('Error getting Instagram post metrics:', error)
      throw new Error('Failed to get Instagram post metrics')
    }
  }
}
