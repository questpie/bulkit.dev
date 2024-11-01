import { drive } from '@bulkit/api/drive/drive'
import {
  ChannelPublisher,
  type ChannelPostResult,
} from '@bulkit/api/modules/channels/abstract/channel.manager'
import type { ChannelWithIntegration } from '@bulkit/api/modules/channels/services/channels.service'
import type { Post } from '@bulkit/api/modules/posts/services/posts.service'
import type { Resource } from '@bulkit/api/modules/resources/services/resources.service'
import { appLogger } from '@bulkit/shared/utils/logger'
import fetch from 'node-fetch'

export class InstagramChannelPublisher extends ChannelPublisher {
  private readonly apiVersion = 'v21.0'
  private readonly baseUrl = `https://graph.facebook.com/${this.apiVersion}`

  protected async postReel(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'reel' }>
  ): Promise<ChannelPostResult> {
    try {
      const accessToken = channel.socialMediaIntegration.accessToken

      await this.checkRateLimit(accessToken, channel.socialMediaIntegration.platformAccountId)

      if (!post.resource || post.resource.type.split('/')[0] !== 'video') {
        throw new Error('A video resource is required for an Instagram reel')
      }

      const mediaId = await this.uploadMedia(
        accessToken,
        post.resource,
        channel.socialMediaIntegration.platformAccountId,
        false,
        'REELS'
      )

      const postId = await this.createAndPublishReel(
        accessToken,
        mediaId,
        post.description,
        channel.socialMediaIntegration.platformAccountId
      )

      appLogger.info(`Successfully posted reel to Instagram: ${postId}`)
      return this.getChannelPostResult(postId, channel)
    } catch (error) {
      appLogger.error('Error posting reel to Instagram:', error)
      throw new Error('Failed to post reel to Instagram')
    }
  }

  // TODO: you have to have a business account to be able to post story
  protected async postStory(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'story' }>
  ): Promise<ChannelPostResult> {
    try {
      const accessToken = channel.socialMediaIntegration.accessToken

      await this.checkRateLimit(accessToken, channel.socialMediaIntegration.platformAccountId)

      if (!post.resource) {
        throw new Error('A media resource is required for an Instagram story')
      }

      const mediaId = await this.uploadMedia(
        accessToken,
        post.resource,
        channel.socialMediaIntegration.platformAccountId,
        false,
        'STORIES'
      )

      const postId = await this.createAndPublishStory(
        accessToken,
        mediaId,
        channel.socialMediaIntegration.platformAccountId
      )

      appLogger.info(`Successfully posted story to Instagram: ${postId}`)
      return this.getChannelPostResult(postId, channel)
    } catch (error) {
      appLogger.error('Error posting story to Instagram:', error)
      throw new Error('Failed to post story to Instagram')
    }
  }

  protected async postThread(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'thread' }>
  ): Promise<ChannelPostResult> {
    try {
      const accessToken = channel.socialMediaIntegration.accessToken

      await this.checkRateLimit(accessToken, channel.socialMediaIntegration.platformAccountId)

      const sortedItems = post.items.sort((a, b) => a.order - b.order)
      const mergedText = sortedItems.map((item) => item.text).join('\n\n')
      const allMedia = sortedItems.flatMap((item) => item.media)

      if (allMedia.length === 0) {
        throw new Error('At least one media item is required for an Instagram carousel')
      }

      const mediaIds = await Promise.all(
        allMedia.map((media) =>
          this.uploadMedia(
            accessToken,
            media.resource,
            channel.socialMediaIntegration.platformAccountId,
            true
          )
        )
      )

      const containerId = await this.createCarouselContainer(
        accessToken,
        mediaIds,
        mergedText,
        channel.socialMediaIntegration.platformAccountId
      )
      const postId = await this.publishMedia(
        accessToken,
        containerId,
        channel.socialMediaIntegration.platformAccountId
      )

      appLogger.info(`Successfully posted thread as carousel to Instagram: ${postId}`)
      return this.getChannelPostResult(postId, channel)
    } catch (error) {
      appLogger.error('Error posting thread to Instagram:', error)
      throw new Error('Failed to post thread to Instagram')
    }
  }

  protected async postPost(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'post' }>
  ): Promise<ChannelPostResult> {
    try {
      const accessToken = channel.socialMediaIntegration.accessToken

      await this.checkRateLimit(accessToken, channel.socialMediaIntegration.platformAccountId)

      if (!post.media || post.media.length === 0) {
        throw new Error('At least one media item is required for an Instagram post')
      }

      const mediaIds = await Promise.all(
        post.media.map((media) =>
          this.uploadMedia(
            accessToken,
            media.resource,
            channel.socialMediaIntegration.platformAccountId
          )
        )
      )

      const additionalParams = {
        // collaborators: post.collaborators,
        // location_id: post.locationId,
        // user_tags: post.userTags,
      }

      let containerId: string
      if (mediaIds.length === 1) {
        containerId = await this.createMediaContainer(
          accessToken,
          mediaIds[0]!,
          post.text,
          channel.socialMediaIntegration.platformAccountId,
          additionalParams
        )
      } else {
        containerId = await this.createCarouselContainer(
          accessToken,
          mediaIds,
          post.text,
          channel.socialMediaIntegration.platformAccountId,
          additionalParams
        )
      }

      const postId = await this.publishMedia(
        accessToken,
        containerId,
        channel.socialMediaIntegration.platformAccountId
      )

      appLogger.info(`Successfully posted to Instagram: ${postId}`)
      return this.getChannelPostResult(postId, channel)
    } catch (error) {
      appLogger.error('Error posting to Instagram:', error)
      throw new Error('Failed to post to Instagram')
    }
  }

  private async uploadMedia(
    accessToken: string,
    resource: Resource,
    instagramId: string,
    isCarouselItem = false,
    mediaType?: 'REELS' | 'STORIES'
  ): Promise<string> {
    const type = this.getMediaType(resource.type)

    if (type === 'VIDEO') {
      const { id, uri } = await this.initializeResumeableUpload(
        accessToken,
        mediaType || (isCarouselItem ? 'VIDEO' : 'REELS'),
        instagramId
      )
      const videoUrl = await drive.use().getSignedUrl(resource.location)

      const uploadResponse = await fetch(uri, {
        method: 'POST',
        headers: {
          Authorization: `OAuth ${accessToken}`,
          file_url: videoUrl,
        },
      })

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload video: ${await uploadResponse.text()}`)
      }

      return id
    }

    const mediaUrl = !resource.isExternal
      ? await drive.use().getSignedUrl(resource.location)
      : resource.location

    const params = new URLSearchParams({
      image_url: mediaUrl,
      media_type: type,
      is_carousel_item: isCarouselItem.toString(),
      access_token: accessToken,
    })

    const response = await fetch(`${this.baseUrl}/${instagramId}/media?${params}`, {
      method: 'POST',
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
    caption: string,
    instagramId: string,
    additionalParams: {
      collaborators?: string[]
      location_id?: string
      user_tags?: Array<{ username: string; x: number; y: number }>
    } = {}
  ): Promise<string> {
    const params = new URLSearchParams({
      media_type: 'MEDIA_CONTAINER',
      children: mediaId,
      caption: caption,
      access_token: accessToken,
      // ...additionalParams,
    })

    const response = await fetch(`${this.baseUrl}/${instagramId}/media?${params}`, {
      method: 'POST',
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
    caption: string,
    instagramId: string,
    additionalParams: {
      collaborators?: string[]
      location_id?: string
      user_tags?: Array<{ username: string; x: number; y: number }>
    } = {}
  ): Promise<string> {
    const params = new URLSearchParams({
      media_type: 'CAROUSEL',
      children: mediaIds.join(','),
      caption: caption,
      access_token: accessToken,
      // ...additionalParams,
    })

    const response = await fetch(`${this.baseUrl}/${instagramId}/media?${params}`, {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error(`Failed to create carousel container: ${await response.text()}`)
    }

    const data = await response.json()
    return data.id
  }

  private async publishMedia(
    accessToken: string,
    containerId: string,
    instagramId: string
  ): Promise<string> {
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

  private async createAndPublishStory(
    accessToken: string,
    mediaId: string,
    instagramId: string
  ): Promise<string> {
    const params = new URLSearchParams({
      // media_type: 'STORY',
      creation_id: mediaId,
      access_token: accessToken,
    })

    const response = await fetch(`${this.baseUrl}/${instagramId}/media_publish?${params}`, {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error(`Failed to create and publish story: ${await response.text()}`)
    }
    const data = await response.json()
    return data.id
  }

  private async createAndPublishReel(
    accessToken: string,
    mediaId: string,
    caption: string,
    instagramId: string
  ): Promise<string> {
    const params = new URLSearchParams({
      creation_id: mediaId,
      caption: caption,
      access_token: accessToken,
    })

    const response = await fetch(`${this.baseUrl}/${instagramId}/media_publish?${params}`, {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error(`Failed to create and publish reel: ${await response.text()}`)
    }

    const data = await response.json()
    return data.id
  }

  private async initializeResumeableUpload(
    accessToken: string,
    mediaType: string,
    instagramId: string
  ): Promise<{ id: string; uri: string }> {
    const params = new URLSearchParams({
      media_type: mediaType,
      upload_type: 'resumable',
      access_token: accessToken,
    })

    const response = await fetch(`${this.baseUrl}/${instagramId}/media?${params}`, {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error(`Failed to initialize resumeable upload: ${await response.text()}`)
    }

    return await response.json()
  }

  private async checkRateLimit(accessToken: string, instagramId: string): Promise<void> {
    const params = new URLSearchParams({
      access_token: accessToken,
    })

    const response = await fetch(
      `${this.baseUrl}/${instagramId}/content_publishing_limit?${params}`
    )

    if (!response.ok) {
      throw new Error(`Failed to check rate limit: ${await response.text()}`)
    }

    const data = await response.json()
    if (data.data[0].quota_usage >= 50) {
      throw new Error('Publishing rate limit reached')
    }
  }

  private getChannelPostResult(postId: string, channel: ChannelWithIntegration): ChannelPostResult {
    return {
      externalReferenceId: postId,
      externalUrl: `https://www.instagram.com/p/${postId}/`,
    }
  }
}
