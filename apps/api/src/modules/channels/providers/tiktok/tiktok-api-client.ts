import { envApi } from '@bulkit/api/envApi'
import { buildChannelRedirectUri } from '@bulkit/api/modules/channels/channel-utils'

interface TikTokVideoUploadResponse {
  id: string
  share_url: string
}

interface TikTokVideoStats {
  like_count: number
  comment_count: number
  share_count: number
  view_count: number
  reach_count: number
}

export async function buildTikTokClient(accessToken: string, refreshToken: string) {
  const baseUrl = 'https://open.tiktokapis.com/v2'

  async function refreshAccessToken(): Promise<{ access_token: string; refresh_token: string }> {
    const params = new URLSearchParams({
      client_key: envApi.TIKTOK_CLIENT_ID!,
      client_secret: envApi.TIKTOK_CLIENT_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    })

    const response = await fetch(`${baseUrl}/oauth/token?${params}`, {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error(`Failed to refresh TikTok token: ${await response.text()}`)
    }

    return response.json()
  }

  return {
    videos: {
      upload: async ({
        video_url,
        description,
      }: {
        video_url: string
        description: string
      }): Promise<TikTokVideoUploadResponse> => {
        // Step 1: Initialize upload
        const initResponse = await fetch(`${baseUrl}/video/init`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            post_info: {
              title: description,
              privacy_level: 'PUBLIC',
            },
          }),
        })

        if (!initResponse.ok) {
          throw new Error(`Failed to initialize TikTok upload: ${await initResponse.text()}`)
        }

        const { upload_url, video_id } = await initResponse.json()

        // Step 2: Upload video
        const videoResponse = await fetch(video_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
          },
          body: await fetch(video_url).then((r) => r.blob()),
        })

        if (!videoResponse.ok) {
          throw new Error(`Failed to upload video to TikTok: ${await videoResponse.text()}`)
        }

        // Step 3: Publish video
        const publishResponse = await fetch(`${baseUrl}/video/publish`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            video_id,
            post_info: {
              title: description,
              privacy_level: 'PUBLIC',
            },
          }),
        })

        if (!publishResponse.ok) {
          throw new Error(`Failed to publish TikTok video: ${await publishResponse.text()}`)
        }

        const publishData = await publishResponse.json()
        return {
          id: publishData.video_id,
          share_url: publishData.share_url,
        }
      },

      getStats: async (videoId: string): Promise<TikTokVideoStats> => {
        const response = await fetch(`${baseUrl}/video/query`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            video_ids: [videoId],
            fields: ['like_count', 'comment_count', 'share_count', 'view_count', 'reach_count'],
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to get TikTok video stats: ${await response.text()}`)
        }

        const data = await response.json()
        const stats = data.videos[0]

        return {
          like_count: stats.like_count || 0,
          comment_count: stats.comment_count || 0,
          share_count: stats.share_count || 0,
          view_count: stats.view_count || 0,
          reach_count: stats.reach_count || 0,
        }
      },
    },

    auth: {
      refresh: refreshAccessToken,
    },
  }
}
