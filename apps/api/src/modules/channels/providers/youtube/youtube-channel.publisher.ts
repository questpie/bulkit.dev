import { drive } from '@bulkit/api/drive/drive'
import { ChannelPublisher } from '@bulkit/api/modules/channels/abstract/channel.manager'
import type { ChannelWithIntegration } from '@bulkit/api/modules/channels/services/channels.service'
import type { Post } from '@bulkit/api/modules/posts/services/posts.service'
import { appLogger } from '@bulkit/shared/utils/logger'
import { buildYouTubeClient } from './youtube-api-client'

export class YoutubeChannelPublisher extends ChannelPublisher {
  // TODO: allow users to post as normal video if wanted
  protected async postReel(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'reel' }>
  ): Promise<void> {
    appLogger.debug(channel)
    const client = await buildYouTubeClient(
      channel.socialMediaIntegration.accessToken,
      channel.socialMediaIntegration.refreshToken!
    )

    if (!post.resource) {
      throw new Error(`Post resource is required for YouTube Shorts. Post ID: ${post.id}`)
    }

    try {
      const fileStream = await drive.use().getStream(post.resource.location)

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
          // mimeType: resource.mimeType,
        },
      })

      appLogger.info(`Successfully uploaded YouTube Short: ${res.data.id} `)
    } catch (error) {
      appLogger.error('Error posting YouTube Short:', error)
      throw new Error('Failed to post YouTube Short')
    }
  }

  protected postStory(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'story' }>
  ): Promise<void> {
    throw new Error('Stories are not supported on YouTube')
  }

  protected postThread(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'thread' }>
  ): Promise<void> {
    throw new Error('Threads are not supported on YouTube')
  }

  protected async postPost(
    channel: ChannelWithIntegration,
    post: Extract<Post, { type: 'post' }>
  ): Promise<void> {
    throw new Error('Bulletin posts are already depreciated on YouTube')
  }
}
