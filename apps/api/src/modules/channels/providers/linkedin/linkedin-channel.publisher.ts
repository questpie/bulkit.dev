import {
  ChannelPublisher,
  type PostMetrics,
} from '@bulkit/api/modules/channels/abstract/channel.manager'
import type { ChannelWithIntegration } from '@bulkit/api/modules/channels/services/channels.service'
import type { Post } from '@bulkit/api/modules/posts/services/posts.service'
import { appLogger } from '@bulkit/shared/utils/logger'

export class LinkedInChannelPublisher extends ChannelPublisher {
  private readonly apiVersion = 'v2'
  private readonly baseUrl = `https://api.linkedin.com/${this.apiVersion}`

  protected async postReel(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'reel' }>
  ): Promise<string> {
    // Handle reel as a regular post with video
    if (!post.resource) {
      throw new Error('A video resource is required for LinkedIn video post')
    }

    return this.createPost(channel, post.description, [post.resource])
  }

  protected async postThread(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'thread' }>
  ): Promise<string> {
    // Merge all thread items into a single post
    const sortedItems = post.items.sort((a, b) => a.order - b.order)
    const mergedText = sortedItems.map((item) => item.text).join('\n\n')
    const allMedia = sortedItems.flatMap((item) => item.media.map((m) => m.resource))

    return this.createPost(channel, mergedText, allMedia)
  }

  protected postStory(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'story' }>
  ): Promise<string> {
    throw new Error('Stories are not supported on LinkedIn')
  }

  protected async postPost(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'post' }>
  ): Promise<string> {
    return this.createPost(
      channel,
      post.text,
      post.media.map((m) => m.resource)
    )
  }

  private async createPost(
    channel: ChannelWithIntegration,
    text: string,
    resources: Array<{ location: string; type: string }>
  ): Promise<string> {
    try {
      const accessToken = channel.socialMediaIntegration.accessToken
      const authorId = channel.socialMediaIntegration.platformAccountId

      const registerUpload = await fetch(`${this.baseUrl}/assets?action=registerUpload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
            owner: `urn:li:person:${authorId}`,
            serviceRelationships: [
              {
                relationshipType: 'OWNER',
                identifier: 'urn:li:userGeneratedContent',
              },
            ],
          },
        }),
      }).then((r) => r.json())

      const mediaAssets = await Promise.all(
        resources.slice(0, 9).map(async (resource) => {
          const mediaUrl = await this.drive.getSignedUrl(resource.location)

          // Upload the media to LinkedIn
          await fetch(
            registerUpload.value.uploadMechanism[
              'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
            ].uploadUrl,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              body: await fetch(mediaUrl).then((r) => r.blob()),
            }
          )

          return registerUpload.value.asset
        })
      )

      const postBody = {
        author: `urn:li:person:${authorId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text,
            },
            shareMediaCategory: mediaAssets.length ? 'IMAGE' : 'NONE',
            media: mediaAssets.map((asset) => ({
              status: 'READY',
              media: asset,
            })),
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }

      const response = await fetch(`${this.baseUrl}/ugcPosts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postBody),
      })

      if (!response.ok) {
        throw new Error(`Failed to post to LinkedIn: ${await response.text()}`)
      }

      const data = await response.json()
      return data.id
    } catch (error) {
      appLogger.error('Error posting to LinkedIn:', error)
      throw new Error('Failed to post to LinkedIn')
    }
  }

  protected async getMetrics(
    channel: ChannelWithIntegration,
    externalId: string,
    oldMetrics: PostMetrics | null
  ): Promise<PostMetrics> {
    try {
      const response = await fetch(`${this.baseUrl}/socialActions/${externalId}`, {
        headers: {
          Authorization: `Bearer ${channel.socialMediaIntegration.accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to get LinkedIn post metrics')
      }

      const data = await response.json()

      return {
        likes: data.likesSummary?.totalLikes ?? oldMetrics?.likes ?? 0,
        shares: data.sharesSummary?.totalShares ?? oldMetrics?.shares ?? 0,
        comments: data.commentsSummary?.totalComments ?? oldMetrics?.comments ?? 0,
        impressions: data.impressionsSummary?.totalImpressions ?? oldMetrics?.impressions ?? 0,
        clicks: oldMetrics?.clicks ?? 0,
        reach: oldMetrics?.reach ?? 0,
      }
    } catch (error) {
      appLogger.error('Error getting LinkedIn metrics:', error)
      throw new Error('Failed to get LinkedIn metrics')
    }
  }
}
