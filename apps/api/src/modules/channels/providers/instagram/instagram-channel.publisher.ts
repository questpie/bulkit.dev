// apps/api/src/modules/channels/providers/instagram/instagram-channel.publisher.ts

import { drive } from '@bulkit/api/drive/drive'
import { ChannelPublisher } from '@bulkit/api/modules/channels/abstract/channel.manager'
import type { ChannelWithIntegration } from '@bulkit/api/modules/channels/services/channels.service'
import type { Post } from '@bulkit/api/modules/posts/services/posts.service'
import type { Resource } from '@bulkit/api/modules/resources/services/resources.service'
import { appLogger } from '@bulkit/shared/utils/logger'
import fetch from 'node-fetch'

export class InstagramChannelPublisher extends ChannelPublisher {
  private readonly apiVersion = 'v18.0'
  private readonly baseUrl = `https://graph.instagram.com/${this.apiVersion}`

  protected async postReel(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'reel' }>
  ): Promise<void> {
    try {
      const accessToken = channel.socialMediaIntegration.accessToken

      if (!post.resource || post.resource.type.split('/')[0] !== 'video') {
        throw new Error('A video resource is required for an Instagram reel')
      }

      // Upload the video
      const mediaId = await this.uploadReelVideo(accessToken, post.resource)

      // Create and publish the reel
      await this.createAndPublishReel(accessToken, mediaId, post.description)

      appLogger.info(`Successfully posted reel to Instagram: ${mediaId}`)
    } catch (error) {
      appLogger.error('Error posting reel to Instagram:', error)
      throw new Error('Failed to post reel to Instagram')
    }
  }

  protected async postStory(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'story' }>
  ): Promise<void> {
    try {
      const accessToken = channel.socialMediaIntegration.accessToken

      if (!post.resource) {
        throw new Error('A media resource is required for an Instagram story')
      }

      // Upload the media
      const mediaId = await this.uploadMedia(accessToken, post.resource)

      // Create and publish the story
      await this.createAndPublishStory(accessToken, mediaId)

      appLogger.info(`Successfully posted story to Instagram: ${mediaId}`)
    } catch (error) {
      appLogger.error('Error posting story to Instagram:', error)
      throw new Error('Failed to post story to Instagram')
    }
  }

  protected async postThread(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'thread' }>
  ): Promise<void> {
    try {
      const accessToken = channel.socialMediaIntegration.accessToken

      // Sort thread items by order
      const sortedItems = post.items.sort((a, b) => a.order - b.order)

      // Merge text contents
      const mergedText = sortedItems.map((item) => item.text).join('\n\n')

      // Collect all media from thread items
      const allMedia = sortedItems.flatMap((item) => item.media)
      if (allMedia.length === 0) {
        throw new Error('At least one media item is required for an Instagram carousel')
      }

      // Upload all media
      const mediaIds = await Promise.all(
        allMedia.map((media) => this.uploadMedia(accessToken, media.resource, true))
      )

      // Create carousel container
      const containerId = await this.createCarouselContainer(accessToken, mediaIds, mergedText)

      // Publish the carousel
      await this.publishMedia(accessToken, containerId)

      appLogger.info(`Successfully posted thread as carousel to Instagram: ${containerId}`)
    } catch (error) {
      appLogger.error('Error posting thread to Instagram:', error)
      throw new Error('Failed to post thread to Instagram')
    }
  }

  protected async postPost(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'post' }>
  ): Promise<void> {
    try {
      const accessToken = channel.socialMediaIntegration.accessToken

      if (!post.media || post.media.length === 0) {
        throw new Error('At least one media item is required for an Instagram post')
      }

      const mediaIds = await Promise.all(
        post.media.map((media) => this.uploadMedia(accessToken, media.resource))
      )

      let containerId: string
      if (mediaIds.length === 1) {
        containerId = await this.createMediaContainer(accessToken, mediaIds[0]!, post.text)
      } else {
        containerId = await this.createCarouselContainer(accessToken, mediaIds, post.text)
      }

      await this.publishMedia(accessToken, containerId)

      appLogger.info(`Successfully posted to Instagram: ${containerId}`)
    } catch (error) {
      appLogger.error('Error posting to Instagram:', error)
      throw new Error('Failed to post to Instagram')
    }
  }

  private async uploadMedia(
    accessToken: string,
    resource: Resource,
    isCarouselItem = false
  ): Promise<string> {
    const mediaUrl = await drive.use().getSignedUrl(resource.location)
    const mediaType = this.getMediaType(resource.type)

    const response = await fetch(`${this.baseUrl}/me/media`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        [mediaType === 'VIDEO' ? 'video_url' : 'image_url']: mediaUrl,
        media_type: mediaType,
        is_carousel_item: isCarouselItem,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to upload media: ${await response.text()}`)
    }

    const data = await response.json()
    return data.id
  }

  private async createMediaContainer(
    accessToken: string,
    mediaId: string,
    caption: string
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/me/media`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        media_type: 'MEDIA_CONTAINER',
        children: [mediaId],
        caption: caption,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to create media container: ${await response.text()}`)
    }

    const data = await response.json()
    return data.id
  }

  private getMediaType(mimeType: string): 'IMAGE' | 'VIDEO' {
    return mimeType.startsWith('video/') ? 'VIDEO' : 'IMAGE'
  }

  private async createCarouselContainer(
    accessToken: string,
    mediaIds: string[],
    caption: string
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/me/media`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        media_type: 'CAROUSEL',
        children: mediaIds,
        caption: caption,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to create carousel container: ${await response.text()}`)
    }

    const data = await response.json()
    return data.id
  }

  private async publishMedia(accessToken: string, containerId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/me/media_publish`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        creation_id: containerId,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to publish media: ${await response.text()}`)
    }
  }

  private async createAndPublishStory(accessToken: string, mediaId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/me/stories`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        media_type: 'STORY',
        media_id: mediaId,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to create and publish story: ${await response.text()}`)
    }
  }

  private async uploadReelVideo(accessToken: string, resource: Resource): Promise<string> {
    const videoUrl = await drive.use().getSignedUrl(resource.location)

    const response = await fetch(`${this.baseUrl}/me/media`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        media_type: 'REELS',
        video_url: videoUrl,
        share_to_feed: 'true', // Optional: also share to feed
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to upload reel video: ${await response.text()}`)
    }

    const data = await response.json()
    return data.id
  }

  private async createAndPublishReel(
    accessToken: string,
    mediaId: string,
    caption: string
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/me/media_publish`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        creation_id: mediaId,
        caption: caption,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to create and publish reel: ${await response.text()}`)
    }
  }
}
